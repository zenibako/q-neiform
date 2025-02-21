import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import ILogger from "../abstractions/i-logger";
import { IUseCase } from "../abstractions/i-use-cases";
import { GroupCue } from "../entities/cue";

export default class PushCuesFromScript implements IUseCase {
  constructor(private scripts: Scripts, private cues: Cues, private logger: ILogger) { }

  execute() {
    this.logger.log("Pushing cues...")
    const line = this.scripts.getCurrentLine()
    const groupCue = new GroupCue(`${line.characterName}`)
    this.cues.pushUpdates(groupCue)
    return this
  }
}
