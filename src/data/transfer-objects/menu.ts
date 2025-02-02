export interface IMenuItem {
  isSeparator: boolean
}

export class MenuItem implements IMenuItem {
  isSeparator = false
  constructor(
    public title: string,
    public callback: () => void,
    public keyboardShortcuts: string[] = [],
  ) { }
}

export class Separator implements IMenuItem {
  isSeparator = true
}
