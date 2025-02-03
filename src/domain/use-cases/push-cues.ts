import { IEditors } from "../abstractions/i-editors";
import { IActionableUseCase } from "../abstractions/i-use-cases";

export default class PushCuesFromScript implements IActionableUseCase {
  constructor(private editors: IEditors) { }

  execute() {
    const scriptEditor = this.editors.getScriptEditor()
    const script = scriptEditor.getScript()

    const cueEditor = this.editors.getCueEditor()
    cueEditor.pushUpdates(script)
    return this
  }

  getLabel() {
    return "Push Cues"
  }

  getKeyboardShortcut(): string[] {
    return []
  }
}
