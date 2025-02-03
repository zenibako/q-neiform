import { Editors } from "../../data/repositories/editors";

export default class ConnectApps {
  constructor(private editors: Editors) {}

  execute() {
    const scriptEditor = this.editors.getScriptEditor()
    const cueEditor = this.editors.getCueEditor()
    scriptEditor.initialize(cueEditor.getName())
  }
}
