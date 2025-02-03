import { IEditors } from "../abstractions/i-editors";
import { IActionableUseCase } from "../abstractions/i-use-cases";

export default class PullCuesIntoScript implements IActionableUseCase {
  constructor(private editors: IEditors) { }

  execute() {
    const cueEditor = this.editors.getCueEditor()
    const cueList = cueEditor.getCueList()

    const scriptEditor = this.editors.getScriptEditor()
    const script = scriptEditor.getScript()
    script.mapCues(cueList)

    return this
  }

  getLabel() {
    return "Pull Cues"
  }

  getKeyboardShortcut(): string[] {
    return []
  }
}
