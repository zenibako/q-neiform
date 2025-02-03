import { IEditors } from "../abstractions/i-editors";

export default class PushCuesFromScript {
  constructor(private editors: IEditors) { }

  execute() {
    const cueEditor = this.editors.getCueEditor()
    const cueList = cueEditor.getCueList()

    const scriptEditor = this.editors.getScriptEditor()
    const script = scriptEditor.getScript()
    script.mapCues(cueList)
  }
}
