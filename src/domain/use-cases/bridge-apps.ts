import Cues from "../../data/repositories/cues";

export default class BridgeApps {
  constructor(private cues: Cues) { }

  async execute() {
    return this.cues.initialize()
  }
}
