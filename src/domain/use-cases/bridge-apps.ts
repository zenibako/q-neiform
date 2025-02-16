import Cues from "../../data/repositories/cues";
import OscPort from "../../data/transfer-objects/osc-port";

export default class BridgeApps {
  constructor(private cues: Cues) { }

  async execute(oscPort: OscPort, password?: string) {
    await this.cues.initialize(oscPort, password)
  }
}
