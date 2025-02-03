import { IMenuItem, MenuItem } from "../transfer-objects/menu"
import { IScriptApp } from "../../domain/abstractions/i-script"

export default class BeatApp implements IScriptApp {
  constructor() { }

  getOutline() {
    return Beat.outline()
  }

  mountMenu(topLevelTitle: string, children: IMenuItem[]) {
    Beat.menu(topLevelTitle, children.map((item) => {
      if (item.isSeparator) {
        return Beat.separatorMenuItem()
      }

      const { title, keyboardShortcuts, callback } = item as MenuItem
      return Beat.menuItem(title, keyboardShortcuts, callback)
    }))
  }
}
