import { ICueApp } from "../../domain/abstractions/i-cues"
import ILogger from "../../domain/abstractions/i-logger";
import OSC from "osc-js";
import { IOscServer, IOscDictionary } from "../../domain/abstractions/i-osc";

export type CueType =
  "audio" |
  "mic" |
  "video" |
  "camera" |
  "text" |
  "light" |
  "fade" |
  "network" |
  "midi" |
  "midi file" |
  "timecode" |
  "group" |
  "start" |
  "stop" |
  "pause" |
  "load" |
  "reset" |
  "devamp" |
  "goto" |
  "target" |
  "arm" |
  "disarm" |
  "wait" |
  "memo" |
  "script" |
  "list" |
  "cuelist" |
  "cue list" |
  "cart" |
  "cuecart" |
  "cue cart"

export const OSC_DICTIONARY: IOscDictionary = {
  connect: { address: "/connect" },
  reply: { address: "/reply" },
  workspace: { address: "/workspace" },
  new: { address: "/new", replyDataExample: "3434B56C-214F-4855-8185-E05B9E7F50A2" },
  name: { address: "/name" },
  mode: { address: "/mode" },
  update: { address: "/update" },
  selectedCues: {
    address: "/selectedCues", replyDataExample: `[
        {
          "number": "{string}",
          "uniqueID": {string},
          "cues": [ {a cue dictionary}, {another dictionary}, {and another} ],
          "flagged": true|false,
          "listName": "{string}",
          "type": "{string}",
          "colorName": "{string}",
          "colorName/live": "{string}",
          "name": "{string}",
          "armed": true|false,
        }
      ]` }
}

export class QLabWorkspace implements ICueApp, IOscServer {
  public readonly name = "QLab"

  public id?: string

  constructor(private osc: OSC, private logger: ILogger) { }

  connect(): Promise<string> {
    this.osc.on("open", () => {
      this.logger.log(`Opened WebSocket bridge port on localhost:8080. Ready to accept OSC messages.`)
    })

    return new Promise((resolve, reject) => {
      const { reply, connect } = OSC_DICTIONARY
      const connectReplyAddress = reply.address + connect.address
      this.osc.on(connectReplyAddress, (message: OSC.Message) => {
      //const connectReplyListener = this.osc.on(connectReplyAddress, (message: OSC.Message) => {
        // this.osc.off(connectReplyAddress, connectReplyListener)
        try {
          const { args } = message
          if (!args?.length) {
            throw new Error(`No args returned.`)
          }
          this.handleConnectReply(args[0] as string)
          resolve("Successfully connected.")
        } catch (e) {
          reject((e as Error)?.message ?? e)
        }
      })
      this.osc.on("error", (error: unknown) => {
        this.logger.log(`Error from bridge: ${JSON.stringify(error, null, 1)}`)
        reject(error)
      })
      this.osc.open()
    })
  }

  listen() {
    const { reply } = OSC_DICTIONARY
    const wildcard = "*"
    const workspaceTargetAddress = this.getTargetAddress("/" + wildcard)
    this.osc.on(workspaceTargetAddress, () => {
      this.logger.log(`Sending message to UDP client:`)
    })
    this.osc.on(reply.address + workspaceTargetAddress, () => {
      this.logger.log(`Forwarding reply to WebSocket client:`)
    })
    this.osc.on(wildcard, (message: OSC.Message) => {
      this.logger.log(`\n${this.logOscMessage(message)}`)
    })
    this.logger.log(`Listening for messages on:\n - ${workspaceTargetAddress}\n - ${reply.address + workspaceTargetAddress}`)
  }

  send(message: OSC.Message | OSC.Bundle) {
    this.osc.send(message)
  }

  getDictionary(): IOscDictionary {
    return OSC_DICTIONARY
  }

  handleConnectReply(replyResponse: string) {
    const { workspace_id, data } = JSON.parse(replyResponse)

    const splitData = (data as string)?.split(":")
    if (splitData?.length < 2) {
      throw new Error("Password was incorrect or did not provide permissions. Please try again.")
    }

    this.id = workspace_id
  }

  private logOscMessage({ address, args }: OSC.Message) {
    if (!args.length) {
      return ` └ address: ${address}`
    } else {
      return ` ├ address: ${address}\n └ args: ${args}`
    }
  }

  getTargetAddress(address?: string): string {
    const { workspace } = OSC_DICTIONARY
    let targetAddress = `${workspace.address}/${this.id}`
    if (address) {
      targetAddress += address
    }

    return targetAddress
  }

// private queue: OscBundle[] = []
// private mappingByCueNumber: Record<number, string> = {}
/*
async push(...bundles: ICueCommandBundle[]) {
  console.log(bundles)
  return []
}
 
async pull(...ids: string[]) {
  console.log(ids)
  return []
}
 
async select() {
}
*/
}
