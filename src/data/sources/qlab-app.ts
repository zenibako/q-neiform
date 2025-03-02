import OscBundle from "../transfer-objects/osc-bundle";
// import { ICueApp, ICueCommandBundle } from "../../domain/abstractions/i-cues";

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
      this.osc.on("*", (message: OSC.Message) => {
        const { address } = message
        if (address.includes(this.dict.reply.address)) {
          this.logger.log(`Forwarding reply to WebSocket client:\n${this.logOscMessage(message)}`)
          if (address.includes(this.dict.connect.address)) {
            resolve("Successfully connected.")
          }
        } else {
          this.logger.log(`Received message for UDP server:\n${this.logOscMessage(message)}`)
        }
      })
      this.osc.on("error", (error: unknown) => {
        reject(error)
      })
      this.osc.open()
    })
  }

  private logOscMessage({ address, args }: OSC.Message) {
    return ` ├ address: ${address}${args?.length ? "\n └ args: " + args : ""}`
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

  private async send(...bundles: OscBundle[]): Promise<string[]> {
    return Promise.all(
      bundles.map(async bundle => {
        if (!bundle.packets.length) {
          throw new Error('No packets set.')
        }

        //await this.osc!.send(bundle)

        return `processed all replies for ${bundle.phase}`
      })
    )
  }
}
