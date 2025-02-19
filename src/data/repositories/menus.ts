import { IOscClient } from "../../domain/abstractions/i-osc"
import { IScriptApp } from "../../domain/abstractions/i-script"
import { Menu } from "../../domain/entities/menu"

export default class Menus {
  constructor(private scriptApp: IScriptApp, private oscBridgeApp: IOscClient) {}

  updateMenu(menu: Menu) {
    return this.scriptApp.mountMenu(menu)
  }
}


