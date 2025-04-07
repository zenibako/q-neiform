import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import ILogger from "../../types/i-logger";
import { IUseCase } from "../../types/i-use-cases";

export default class ConvertTagsToCues implements IUseCase {
  constructor(private scripts: Scripts, private cues: Cues, private logger: ILogger) { }

  async execute() {
    this.logger.debug("Converting tags to cues...")
    try {
      await this.cues.load()
      const tagLines = this.scripts.getLinesWithTags()
      const lines = this.scripts.getContext(...tagLines)
      this.cues.add(...lines)
      await this.cues.save()
      this.logger.debug(JSON.stringify({ lines }, null, 1))
    } catch (e) {
      this.logger.debug(`Error while converting: ${(e as Error).message ?? e}`)
    }
    return this
  }
}
