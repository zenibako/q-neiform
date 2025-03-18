import { ICueApp } from "../../domain/abstractions/i-cues"
import ILogger from "../../domain/abstractions/i-logger";
import OSC from "osc-js";
import { IOscServer, IOscDictionary, IOscMessage, IOscClient } from "../../domain/abstractions/i-osc";

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
  cue: { address: "/cue" },
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

export class QLabWorkspace implements ICueApp, IOscServer, IOscClient {
  public readonly name = "QLab"

  public id?: string

  constructor(
    private osc: OSC,
    public readonly host: string,
    public readonly port: string,
    private logger: ILogger
  ) {
  }

  initialize(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.osc.on("open", () => {
        this.logger.log(`Opened WebSocket bridge port on localhost:8080.`)
      })
      const { reply, connect } = OSC_DICTIONARY
      const connectReplyAddress = reply.address + connect.address
      this.osc.on(connectReplyAddress, (message: OSC.Message) => {
        //const connectReplyListener = this.osc.on(connectReplyAddress, (message: OSC.Message) => {
        // this.osc.off(connectReplyAddress, connectReplyListener)
        try {
          if (!message.address.startsWith(reply.address)) {
            return
          }

          if (!message.args?.length) {
            throw new Error(`No args returned.`)
          }

          const [connectResponse] = message.args
          this.setIdFromConnectResponse(connectResponse as string)
          resolve("Successfully connected.")
        } catch (e) {
          reject((e as Error)?.message ?? e)
        }
      })
      this.osc.on("error", (error: unknown) => {
        this.logger.log(`Error while opening port: ${JSON.stringify(error, null, 1)}`)
        reject(error)
      })
      this.osc.open()
    })
  }

  listen() {
    const wildcard = "*"
    this.osc.on(wildcard, (message: OSC.Message) => {
      this.logger.log(`${this.getLogPrefaceText(message.address)}:\n${this.logOscMessage(message)}`)
    })
    this.logger.log(`Listening for messages...`)
  }

  private getLogPrefaceText(address: string) {
    const { reply, connect } = OSC_DICTIONARY

    if (address.startsWith(reply.address)) {
      return "Forwarding reply to WebSocket client"
    }

    if (address.startsWith(connect.address)) {
      return "Sending connect message to UDP client"
    }

    if (address.includes(this.getTargetAddress())) {
      return "Sending workspace message to UDP client"
    }

    return "Unknown message received"
  }

  send(...messages: IOscMessage[]): Promise<string | null> {
    const oscMessages = messages.map(({ address, args }) => new OSC.Message(address, ...args))
    if (!oscMessages?.length) {
      throw new Error("No messages passed as send input.")
    }

    const [firstOscMessage] = oscMessages
    if (!firstOscMessage) {
      throw new Error("First OSC message is undefined.")
    }

    const payload = oscMessages.length === 1 ? firstOscMessage : new OSC.Bundle(oscMessages)
    return new Promise((resolve) => {
      let repliesRemaining = 0
      for (const { listenOn } of messages) {
        if (!listenOn) {
          continue
        }

        repliesRemaining++
        this.osc.on(this.getReplyAddress(listenOn), () => {
          repliesRemaining--
          if (repliesRemaining !== 0) {
            return
          }

          resolve("All replies heard")
        })
      }

      this.osc.send(payload, { receiver: "ws" })
      if (repliesRemaining === 0) {
        resolve("No replies expected.")
      }
    })
  }

  getDictionary(): IOscDictionary {
    return OSC_DICTIONARY
  }

  setIdFromConnectResponse(replyResponse: string) {
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

  getReplyAddress(address: string): string {
    const { reply } = OSC_DICTIONARY
    return reply.address + this.getTargetAddress(address) + "/*"
  }
}
