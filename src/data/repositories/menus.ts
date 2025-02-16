import { IScriptApp } from "../../domain/abstractions/i-script"
import { Menu } from "../../domain/entities/menu"

export default class Menus {
  constructor(private scriptApp: IScriptApp) {}

  initialize() {
    return this.scriptApp.promptForConnection()
  }

  updateMenu(menu: Menu) {
    return this.scriptApp.mountMenu(menu)
  }
}


