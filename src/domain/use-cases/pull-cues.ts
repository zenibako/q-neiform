import { IEditors } from "../abstractions/i-editors";
import { IUseCase } from "../abstractions/i-use-cases";

export default class PullCuesIntoScript implements IUseCase {
  constructor(private editors: IEditors) { }

  async execute() {
    /*
    const cueEditor = this.editors.getCueEditor()
    const cueList = await cueEditor.getCueList()

    const scriptEditor = this.editors.getScriptEditor()
    const script = scriptEditor.getScript()
    script.mapCues(cueList)
    */

    console.log('PullCuesIntoScript', this.editors)

    return this
  }
}
