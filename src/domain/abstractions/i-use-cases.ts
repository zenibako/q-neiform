export interface IUseCase {
  execute(): IUseCase
}

export interface IGroupUseCase {
  execute(...useCases: IUseCase[]): IUseCase
}

export interface IActionableUseCase extends IUseCase {
  getLabel(): string
  getKeyboardShortcut(): string[]
}
