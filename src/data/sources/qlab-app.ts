import OscBundle from "../transfer-objects/osc-bundle";
// import { ICueApp, ICueCommandBundle } from "../../domain/abstractions/i-cues";

import { ICueApp } from "../../domain/abstractions/i-cues"
import ILogger from "../../domain/abstractions/i-logger";
import OSC from "osc-js";

const DELAY_MS = 30000

export default class QLabApp implements ICueApp {
  public readonly name = "QLab"

  public osc?: OSC

  constructor(private logger: ILogger, private host: string = "localhost", private port: number = 53000) { }

  connect(password: string = "") {
    const { port, host } = this
    this.osc = new OSC({
      plugin: new OSC.BridgePlugin({
        udpClient: { port, host },      // Target QLab's port
        udpServer: { port: port + 1 },  // This bridge's port
        receiver: 'udp'
      })
    })
    return new Promise((resolve, reject) => {
      if (!this.osc) {
        reject('No OSC server set')
        return
      }
      this.osc.on(`/reply/connect/${password}`, (reply: unknown) => {
        this.logger.log(`Received ${JSON.stringify(reply)}`)
        resolve(reply)
      })
      this.osc.on("error", (error: unknown) => {
        this.logger.log(`Received ${JSON.stringify(error)}`)
        reject(error)
      })
      this.osc.open()
      this.logger.log(`Opened bridge port.`)
      try {
        this.logger.log(`Waiting for ${DELAY_MS / 1000} seconds...`)
        setTimeout(() => reject(`Timed out after ${DELAY_MS / 1000} seconds.`), DELAY_MS)
      } catch (e) {
        reject(e)
      }
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
