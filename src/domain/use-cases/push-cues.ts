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
      this.logger.log(`lines for cues: ${JSON.stringify(lines, null, 1)}`)
      const triggerCues = this.cues.getFromLines(lines)
      this.logger.log(`cues to push: ${JSON.stringify(triggerCues, null, 1)}`)
      const pushedCues = await this.cues.pushUpdates(...triggerCues)
      this.scripts.updateLines(pushedCues)
    } catch (e) {
      this.logger.log((e as Error).message ?? e)
    }
    return this
  }
}
