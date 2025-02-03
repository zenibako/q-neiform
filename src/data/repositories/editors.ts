import { ICueApp } from "../../domain/abstractions/i-cues";
import { IScriptApp } from "../../domain/abstractions/i-script";
import CueEditor from "../../domain/entities/cue-editor";
import ScriptEditor from "../../domain/entities/script-editor";

export class Editors {
  readonly scriptEditor: ScriptEditor
  readonly cueEditor: CueEditor

  constructor(private scriptApp: IScriptApp, private cueApp: ICueApp) {
    this.scriptEditor = new ScriptEditor(this.scriptApp)
    this.cueEditor = new CueEditor(this.cueApp)
  }

  getScriptEditor(): ScriptEditor {
    return this.scriptEditor
  }

  getCueEditor(): CueEditor {
    return this.cueEditor
  }
}
