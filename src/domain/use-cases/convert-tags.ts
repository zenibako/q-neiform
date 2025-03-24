import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import ILogger from "../../types/i-logger";
import { IUseCase } from "../../types/i-use-cases";

export default class ConvertTagsToCues implements IUseCase {
  constructor(private scripts: Scripts, private cues: Cues, private logger: ILogger) { }

  async execute() {
    this.logger.debug("Converting tags to cues...")
    try {
      const lines = this.scripts.getContextFromSelection()
      this.cues.add(...lines)
    } catch (e) {
      this.logger.debug(`Error while converting: ${(e as Error).message ?? e}`)
    }
    return this
  }
}
