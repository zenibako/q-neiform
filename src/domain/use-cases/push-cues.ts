import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import ILogger from "../abstractions/i-logger";
import { IUseCase } from "../abstractions/i-use-cases";

export default class PushCuesFromScript implements IUseCase {
  constructor(private scripts: Scripts, private cues: Cues, private logger: ILogger) { }

  async execute() {
    this.logger.log("Pushing cues...")
    const lines = this.scripts.getContextFromSelection()
    
    const triggerCues = this.cues.getFromLines(lines)
    this.logger.log(`Cues to push: ${JSON.stringify(triggerCues)}`)
    const pushedCues = await this.cues.pushUpdates(...triggerCues)
    this.scripts.updateLines(pushedCues)
    return this
  }
}
