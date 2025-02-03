import CueEditor from "../entities/cue-editor";
import ScriptEditor from "../entities/script-editor";

export interface IEditors {
  getCueEditor(): CueEditor
  getScriptEditor(): ScriptEditor
}
