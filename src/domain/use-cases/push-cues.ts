import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import { IUseCase } from "../abstractions/i-use-cases";

export default class PushCuesFromScript implements IUseCase {
  constructor(private scripts: Scripts, private cues: Cues) { }

  execute() {
    const script = this.scripts.getScript()

    this.cues.pushUpdates(script)
    return this
  }
}
