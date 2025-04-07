import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import ILogger from "../../types/i-logger";
import { IUseCase } from "../../types/i-use-cases";

export default class DefineCueFromSelection implements IUseCase {
  private isListening = false
  constructor(private scripts: Scripts, private cues: Cues, private logger: ILogger) { }

  async execute() {
    if (!this.isListening) {
      this.scripts.listenForSelection(({ location }) => {
        const selectedLine = this.scripts.getLineFromIndex(location)
        const lines = this.scripts.getContext(selectedLine)
        this.logger.debug(JSON.stringify({ lines }, null, 1))
        const addedCues = this.cues.add(...lines)
        this.logger.debug(JSON.stringify(addedCues, null, 1))
      })
    } else {
      this.scripts.stopListeningForSelection()
    }
    return this
  }
}
