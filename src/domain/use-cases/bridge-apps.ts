import Cues from "../../data/repositories/cues";

export default class BridgeApps {
  constructor(private cues: Cues) { }

  async execute(password?: string) {
    return this.cues.initialize(password)
  }
}
