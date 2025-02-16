import OscPacket from "../transfer-objects/osc-packet"
import OscBundle from "../transfer-objects/osc-bundle";
import OscPort from "../transfer-objects/osc-port";
// import { ICueApp, ICueCommandBundle } from "../../domain/abstractions/i-cues";

import { ICueApp } from "../../domain/abstractions/i-cues"
import ILogger from "../../domain/abstractions/i-logger";

const CONNECT_PHASE = 'connect'

export default class QLabApp implements ICueApp {
  public readonly name = "QLab"
  public readonly host
  public readonly port

  private osc?: OscPort

  constructor(private logger: ILogger, host: string = "localhost", port: number = 53000) {
    this.host = host
    this.port = port
  }

  public isConnected() {
    return !!this.osc
  }

  // private queue: OscBundle[] = []
  // private mappingByCueNumber: Record<number, string> = {}

  async connect(osc: OscPort, passcode?: string) {
    this.osc = osc
    await this.osc.open()

    this.logger.log("sending connect packet")
    await this.send(
      new OscBundle(
        CONNECT_PHASE,
        new OscPacket('/connect', passcode)
      )
    )
    this.logger.log(CONNECT_PHASE + ' ' + passcode)
  }

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
    if (!this.isConnected()) {
      throw new Error('Not connected.')
    }

    return Promise.all(
      bundles.map(async bundle => {
        if (!bundle.packets.length) {
          throw new Error('No packets set.')
        }

        await this.osc!.send(bundle)

        return `processed all replies for ${bundle.phase}`
      })
    )
  } 
}
