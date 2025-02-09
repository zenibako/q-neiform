import { IUseCase } from "../abstractions/i-use-cases"

export interface IMenuItem {
  title: string | null
}

export class Menu {
  private menuItemSections: IMenuItem[][]
  constructor(
    public title: string,
    ...menuItemSections: MenuItem[][]
  ) {
    this.menuItemSections = menuItemSections ?? []
  }

  getMenuItems(): IMenuItem[] {
    const sections = this.menuItemSections ?? []

    const menuItems: IMenuItem[] = []
    for (let i = 0; i++; i < sections.length) {
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
    private useCase?: IUseCase, 
    public keyboardShortcuts?: string[]
  ) {}

  click() {
    return this.useCase?.execute()
  }
}

class Separator implements IMenuItem {
  public title: null
  constructor() {
    this.title = null
  }
}
