import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import ILogger from "../../types/i-logger";
import { IUseCase } from "../../types/i-use-cases";

export default class DefineCueFromSelection implements IUseCase {
  private isListening = false
  constructor(private scripts: Scripts, private cues: Cues, private logger: ILogger) { }

  async execute() {
    if (!this.isListening) {
      this.scripts.listenForSelection(() => {
        const lines = this.scripts.getContextFromSelection()
        const addedCues = this.cues.addFromLines(lines)
        this.logger.log(JSON.stringify(addedCues, null, 1))
      })
    } else {
      this.scripts.stopListeningForSelection()
    }
    return this
  }
}
