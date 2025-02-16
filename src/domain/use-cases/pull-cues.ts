import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import { IUseCase } from "../abstractions/i-use-cases";

export default class PullCuesIntoScript implements IUseCase {
  constructor(private cues: Cues, private script: Scripts) {}

  async execute() {
    /*
    const cueEditor = this.editors.getCueEditor()
    const cueList = await cueEditor.getCueList()

    const scriptEditor = this.editors.getScriptEditor()
    const script = scriptEditor.getScript()
    script.mapCues(cueList)
    */

    return this
  }
}
