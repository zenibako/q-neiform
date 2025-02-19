import OscBundle from "../transfer-objects/osc-bundle";
// import { ICueApp, ICueCommandBundle } from "../../domain/abstractions/i-cues";

import { ICueApp } from "../../domain/abstractions/i-cues"
import ILogger from "../../domain/abstractions/i-logger";
import OSC from "osc-js";
import { IOscServer } from "../../domain/abstractions/i-osc";

export default class QLabApp implements ICueApp, IOscServer {
  public readonly name = "QLab"

  public osc?: OSC

  constructor(private logger: ILogger) { }

  getConnectAddress() {
    return `/connect`
  }

  getReplyAddress(originalAddress: string = "*") {
    return `/reply/${originalAddress}`
  }

  bridge(host: string = "localhost", port: number = 53000): Promise<string> {
    this.osc = new OSC({
      plugin: new OSC.BridgePlugin({
        udpClient: { port, host },      // Target QLab's port
        udpServer: { port: port + 1 },  // This bridge's port
        receiver: "udp"
      })
    })
    return new Promise((resolve, reject) => {
      if (!this.osc) {
        reject('No OSC server set')
        return
      }

      this.osc.on("open", () => {
        this.logger.log(`Opened WebSocket bridge port on localhost:8080. Ready to accept OSC messages.`)
      })
      this.osc.on(this.getReplyAddress(), ({ address, args }: OSC.Message) => {
        const relayedMessage = new OSC.Message(address, ...args)
        this.osc?.send(relayedMessage, { receiver: "ws" })
        resolve("Successfully connected.")
      })
      this.osc.on("error", (error: unknown) => {
        reject(error)
      })
      this.osc.open()
    })
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
