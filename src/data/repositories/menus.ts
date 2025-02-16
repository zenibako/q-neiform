import { IOscBridgeApp } from "../../domain/abstractions/i-bridge"
import { IScriptApp } from "../../domain/abstractions/i-script"
import { Menu } from "../../domain/entities/menu"

export default class Menus {
  constructor(private scriptApp: IScriptApp, private oscBridgeApp: IOscBridgeApp) {}

  initialize() {
    return this.oscBridgeApp.connectToWebSocket()
  }

  updateMenu(menu: Menu) {
    return this.scriptApp.mountMenu(menu)
  }
}


