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

export class QLabWorkspace implements ICueApp, IOscServer {
  public readonly name = "QLab"

  public id?: string

  public osc?: OSC

  constructor(private logger: ILogger) { }

  public readonly dict: IOscDictionary = {
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

  bridge(host: string = "localhost", port: number = 53000): Promise<string> {
    this.osc = new OSC({
      plugin: new OSC.BridgePlugin({
        udpClient: { port, host },      // Target QLab's port
        udpServer: { port: port + 1 },  // This bridge's port
        receiver: "udp"
      })
    })

    this.osc.on("open", () => {
      this.logger.log(`Opened WebSocket bridge port on localhost:8080. Ready to accept OSC messages.`)
    })

    return new Promise((resolve, reject) => {
      if (!this.osc) {
        reject('No OSC server set')
        return
      }

      const connectReplyAddress = this.dict.reply.address + this.dict.connect.address
      const connectReplyListener = this.osc.on(connectReplyAddress, (message: OSC.Message) => {
        this.osc?.off(connectReplyAddress, connectReplyListener)
        try {
          const { args } = message
          if (!args?.length) {
            throw new Error(`No args returned.`)
          }
          this.handleConnectReply(args[0] as string)
          this.listenForMessages()
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

  handleConnectReply(replyResponse: string) {
    const { workspace_id, data } = JSON.parse(replyResponse)

    const splitData = (data as string)?.split(":")
    if (splitData?.length < 2) {
      throw new Error("Password was incorrect or did not provide permissions. Please try again.")
    }

    this.id = workspace_id
  }

  private listenForMessages() {
    const wildcard = "*"
    const workspaceTargetAddress = this.getTargetAddress("/" + wildcard)
    this.osc?.on(workspaceTargetAddress, (message: OSC.Message) => {
      this.logger.log(`Sending message to UDP client:`)
    })
    this.osc?.on(this.dict.reply.address + workspaceTargetAddress, (message: OSC.Message) => {
      this.logger.log(`Forwarding reply to WebSocket client`)
    })
    this.osc?.on(wildcard, (message: OSC.Message) => {
      this.logger.log(`\n${this.logOscMessage(message)}`)
    })
    this.logger.log(`Listening for messages on:\n - ${workspaceTargetAddress}\n - ${this.dict.reply.address + workspaceTargetAddress}`)
  }

  private logOscMessage({ address, args }: OSC.Message) {
    if (!args.length) {
      return ` └ address: ${address}`
    } else {
      return ` ├ address: ${address}\n └ args: ${args}`
    }
  }

  getTargetAddress(address?: string): string {
    let workspaceAddress = `${this.dict.workspace.address}/${this.id}`
    if (address) {
      workspaceAddress += address
    }

    return workspaceAddress
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
