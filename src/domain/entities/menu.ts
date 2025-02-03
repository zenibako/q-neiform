import { IActionableUseCase, } from "../abstractions/i-use-cases"

export interface IMenuItem {
  isSeparator: boolean
}

export class MenuItem implements IMenuItem {
  public title: string
  public keyboardShortcuts: string[] = []
  public isSeparator = false

  constructor(private useCase: IActionableUseCase) {
    this.title = useCase.getLabel()
    this.keyboardShortcuts = useCase.getKeyboardShortcut()
  }

  callback() {
    this.useCase.execute()
  }
}

export class Separator implements IMenuItem {
  public isSeparator = true
}
