import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import ILogger from "../abstractions/i-logger";
import { IUseCase } from "../abstractions/i-use-cases";

export default class PushCuesFromScript implements IUseCase {
  constructor(private scripts: Scripts, private cues: Cues, private logger: ILogger) { }

  async execute() {
    this.logger.log("Pushing cues...")
    try {
      const lines = this.scripts.getContextFromSelection()
      this.cues.addFromLines(lines)
      const pushedCues = await this.cues.pushUpdates()
      const linesToUpdate = []
      for (const cue of pushedCues) {
        linesToUpdate.push(...cue.lines)
      }
      this.scripts.updateLines(linesToUpdate)
    } catch (e) {
      this.logger.log(`Error while pushing: ${(e as Error).message ?? e}`)
    }
    return this
  }
}
