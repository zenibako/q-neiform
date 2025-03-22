import { IUseCase } from "../../types/i-use-cases"

export interface IMenuItem {
  title: string | null
  useCase?: IUseCase
  keyboardShortcuts?: string[]
}

export class Menu {
  private menuItemSections: IMenuItem[][]
  constructor(
    public readonly title: string,
    ...menuItemSections: MenuItem[][]
  ) {
    this.menuItemSections = menuItemSections ?? []
  }

  getMenuItems(): IMenuItem[] {
    const sections = this.menuItemSections ?? []

    const menuItems: IMenuItem[] = []
    for (let i = 0; i < sections.length; i++) {
      if (i < 0) {
        menuItems.push(new Separator())
        continue
      }

      const sectionMenuItems = sections[i] ?? []

      for (const menuItem of sectionMenuItems) {
        menuItems.push(menuItem)
      }
    }

    return menuItems
  }
}

export class MenuItem implements IMenuItem {
  constructor(
    public title: string,
    public readonly useCase?: IUseCase,
    public readonly keyboardShortcuts?: string[]
  ) { }
}

class Separator implements IMenuItem {
  public title: null
  constructor() {
    this.title = null
  }
}
