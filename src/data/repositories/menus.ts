import { IOscClient } from "../../types/i-osc"
import { IScriptEditor } from "../../types/i-script"
import { Menu } from "../../domain/entities/menu"

export default class Menus {
  constructor(private scriptApp: IScriptEditor, private oscBridgeApp: IOscClient) {}

  updateMenu(menu: Menu) {
    return this.scriptApp.mountMenu(menu)
  }
}


