import { ICueApp } from "../../domain/abstractions/i-cues";
import CueEditor from "../../domain/entities/cue-editor";
import ScriptEditor from "../../domain/entities/script-editor";
import BeatApp from "../sources/beat-app"

export class Editors {
  constructor(private scriptApp: BeatApp, private cueApp: ICueApp) { }

  getScriptEditor(): ScriptEditor {
    return new ScriptEditor(this.scriptApp)
  }

  getCueEditor(): CueEditor {
    return new CueEditor(this.cueApp)
  }
}
