import { MenuItem } from "./menu";
import { IScriptApp } from "../abstractions/i-script";
import { IActionableUseCase, } from "../abstractions/i-use-cases";
import Script from "./script";

export default class ScriptEditor {
  constructor(private scriptApp: IScriptApp) { }

  initialize(topLevelTitle: string, useCases: IActionableUseCase[]) {
    const menuItems = useCases.map(useCase => new MenuItem(useCase))
    this.scriptApp.mountMenu(topLevelTitle, menuItems)
  }

  getScript(): Script {
    return new Script(this.scriptApp.pullOutline())
  }
}
