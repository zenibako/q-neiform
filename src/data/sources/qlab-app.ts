import OscBundle from "../transfer-objects/osc-bundle";
// import { ICueApp, ICueCommandBundle } from "../../domain/abstractions/i-cues";

import { ICueApp } from "../../domain/abstractions/i-cues"
import ILogger from "../../domain/abstractions/i-logger";
import OSC from "osc-js";

export default class QLabApp implements ICueApp {
  public readonly name = "QLab"
  public readonly osc: OSC

  constructor(private logger: ILogger, host: string = "localhost", port: number = 53000) {
    this.osc = new OSC({
      plugin: new OSC.BridgePlugin({
        udpClient: { port: port + 1 },
        udpServer: { port, host }
      })
    })
  }

  connect(password: string = "") {
    return new Promise((resolve, reject) => {
      this.osc.on(`/connect/${password}`, (reply: object) => {
        this.logger.log(JSON.stringify(reply))
        resolve(reply)
      })
      try {
        this.osc.open()
      } catch (e) {
        reject(e)
      }
      this.logger.log('opened bridge port. waiting for response...')

      const delay = 30000
      setTimeout(() => reject(`Timed out after ${delay/1000} seconds.`), delay)
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
