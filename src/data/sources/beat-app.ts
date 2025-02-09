import { Menu, MenuItem } from "../../domain/entities/menu"
import { IScriptApp } from "../../domain/abstractions/i-script"

export default class BeatApp implements IScriptApp {
  constructor() { }

  pullOutline() {
    return Beat.outline()
  }

  mountMenu(menu: Menu) {
    Beat.menu(menu.title, menu.getMenuItems().map((item) => {
      if (item?.title) {
        return Beat.separatorMenuItem()
      }

      const { title, keyboardShortcuts, click } = item as MenuItem
      return Beat.menuItem(title, keyboardShortcuts ?? [], click)
    }))
  }
}
