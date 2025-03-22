import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import ILogger from "../../types/i-logger";
import { IUseCase } from "../../types/i-use-cases";

export default class PushCuesFromScript implements IUseCase {
  constructor(private scripts: Scripts, private cues: Cues, private logger: ILogger) { }

  async execute() {
    this.logger.debug("Pushing cues...")
    try {
      const lines = this.scripts.getContextFromSelection()
      this.cues.addFromLines(lines)
      await this.cues.push()
      const linesToUpdate = []
      for (const cue of this.cues) {
        linesToUpdate.push(...cue.lines)
      }
      this.scripts.updateLines(linesToUpdate)
    } catch (e) {
      this.logger.debug(`Error while pushing: ${(e as Error).message ?? e}`)
    }
    return this
  }
}
