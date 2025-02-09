import { IEditors } from "../abstractions/i-editors";
import { IUseCase } from "../abstractions/i-use-cases";

export default class PushCuesFromScript implements IUseCase {
  constructor(private editors: IEditors) { }

  execute() {
    const scriptEditor = this.editors.getScriptEditor()
    const script = scriptEditor.getScript()

    const cueEditor = this.editors.getCueEditor()
    cueEditor.pushUpdates(script)
    return this
  }
}
