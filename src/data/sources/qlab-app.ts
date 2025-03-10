import { ICueApp } from "../../domain/abstractions/i-cues"
import ILogger from "../../domain/abstractions/i-logger";
import OSC from "osc-js";
import { IOscServer, IOscDictionary, IOscMessage } from "../../domain/abstractions/i-osc";

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

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.osc.on("open", () => {
        this.logger.log(`Opened WebSocket bridge port on localhost:8080.`)
        resolve()
      })
      this.osc.on("error", (error: unknown) => {
        this.logger.log(`Error while opening port: ${JSON.stringify(error, null, 1)}`)
        reject(error)
      })
      this.osc.open()
    })
  }

  connect(): Promise<string> {
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
          if (!message.address.startsWith(reply.address)) {
            return
          }
          this.setId(args[0] as string)
          resolve("Successfully connected. Ready to accept OSC messages.")
        } catch (e) {
          reject((e as Error)?.message ?? e)
        }
      })
      this.osc.on("error", (error: unknown) => {
        this.logger.log(`Error while connecting: ${JSON.stringify(error, null, 1)}`)
        reject(error)
      })
      this.osc.send(new OSC.Message(connect.address))
    })
  }

  listen() {
    const { reply } = OSC_DICTIONARY
    const wildcard = "*"
    const workspaceTargetAddress = this.getTargetAddress("/" + wildcard)
    this.osc.on(wildcard, (message: OSC.Message) => {
      const prefaceLog = message.address.startsWith(reply.address)
        ? "Forwarding reply to WebSocket client:"
        : message.address.includes(this.getTargetAddress())
          ? "Sending message to UDP client:"
          : "Unknown message received:"
      this.logger.log(`${prefaceLog}\n${this.logOscMessage(message)}`)
    })
    this.logger.log(`Listening for messages on:\n - ${workspaceTargetAddress}\n - ${reply.address + workspaceTargetAddress}`)
  }

  send(...messages: IOscMessage[]) {
    const oscMessages = messages.map(({ address, args }) => new OSC.Message(address, ...args))
    if (!oscMessages?.length) {
      throw new Error("No messages passed as send input.")
    }
    const [firstOscMessage] = oscMessages
    if (!firstOscMessage) {
      throw new Error("First OSC message is undefined.")
    }
    const payload = oscMessages.length === 1 ? firstOscMessage : new OSC.Bundle(oscMessages)
    this.osc.send(payload, { receiver: "ws" })
  }

  getDictionary(): IOscDictionary {
    return OSC_DICTIONARY
  }

  setId(replyResponse: string) {
    const { workspace_id, data } = JSON.parse(replyResponse)

    const splitData = (data as string)?.split(":")
    if (splitData?.length < 2) {
      throw new Error("Password was incorrect or did not provide permissions. Please try again.")
    }

    if (!workspace_id) {
      throw new Error(`No workspace_id key in response: ${replyResponse}`)
    }

    this.id = workspace_id
    this.logger.log(`Set workspace ID: ${this.id}`)
  }

  private logOscMessage({ address, args }: OSC.Message) {
    if (!args.length) {
      return ` └ address: ${address}`
    } else {
      return ` ├ address: ${address}\n └ args: ${args}`
    }
  }

  getTargetAddress(address?: string): string {
    if (!this.id) {
      throw new Error("No Workspace ID has been set yet.")
    }

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
