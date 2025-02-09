import { Menu } from "./menu";
import { IScriptApp } from "../abstractions/i-script";
import Script from "./script";

export default class ScriptEditor {
  constructor(private scriptApp: IScriptApp) { }

  initialize(menu: Menu) {
    this.scriptApp.mountMenu(menu)
  }

  getScript(): Script {
    //return new Script(this.scriptApp.pullOutline())
    return new Script()
  }
}
