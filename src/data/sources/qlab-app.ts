// import OscPacket from "../transfer-objects/osc-packet.ts.bak"
// import OscBundle from "../transfer-objects/osc-bundle.ts.bak";
// import OscUdpPort from "../transfer-objects/osc-udp-port.ts.bak";
// import { ICueApp, ICueCommandBundle } from "../../domain/abstractions/i-cues";

import { ICueApp } from "../../domain/abstractions/i-cues"

const CONNECT_PHASE = 'connect'

export default class QLabApp implements ICueApp {
  public name
  public initialized = false

  // private queue: OscBundle[] = []
  // private mappingByCueNumber: Record<number, string> = {}

  constructor() {
    this.name = "QLab"
  }

  async initialize(passcode?: string) {
    /*
    await this.send(
      new OscBundle(
        CONNECT_PHASE,
        new OscPacket('/connect', passcode)
      )
    )
    */
    console.log(CONNECT_PHASE, passcode)

    this.initialized = true
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

  private async send(...bundles: OscBundle[]): Promise<string[]> {
    if (!this.initialized) {
      this.initialize()
    }

    return Promise.all(
      bundles.map(async bundle => {
        if (!bundle.packets.length) {
          throw new Error('No packets set.')
        }

        const oscPort = new OscUdpPort()
        await oscPort.send(bundle)

        return `processed all replies for ${bundle.phase}`
      })
    )
  }
  */
}
