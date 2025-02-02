import { IMenuItem, MenuItem } from "../transfer-objects/menu"

export default class BeatData {
  constructor() { }

  getOutline() {
    return Beat.outline()
  }

  setMenu(topLevelTitle: string, children: IMenuItem[]) {
    Beat.menu(topLevelTitle, children.map((item) => {
      if (item.isSeparator) {
        return Beat.separatorMenuItem()
      }

      const { title, keyboardShortcuts, callback } = item as MenuItem
      return Beat.menuItem(title, keyboardShortcuts, callback)
    }))
  }
}
