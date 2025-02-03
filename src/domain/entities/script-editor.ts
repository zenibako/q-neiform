import BeatApp from "../../data/sources/beat-app";
import Script from "./script";

export default class ScriptEditor {
  constructor(private scriptApp: BeatApp) { }

  initialize(topLevelTitle: string) {
    this.scriptApp.mountMenu(topLevelTitle, [])
  }

  getScript(): Script {
    return new Script()
  }
}
