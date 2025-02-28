import { Scripts } from "../../data/repositories/scripts";
import ILogger from "../abstractions/i-logger";
import { IUseCase } from "../abstractions/i-use-cases";

export default class ClearCueMappings implements IUseCase {
  constructor(private scripts: Scripts, private logger: ILogger) { }

  execute() {
    this.logger.log("Clearing cue mappings...")
    try {
      const lines = this.scripts.getContextFromSelection()
      for (const line of lines) {
        line.cueId = undefined
      }
      this.logger.log(`Clearing cue mappings on lines: ${JSON.stringify(lines, null, 1)}`)
      this.scripts.updateLines(lines)
    } catch (e) {
      this.logger.log(`Error while pushing: ${(e as Error).message ?? e}`)
    }
    return this
  }
}
