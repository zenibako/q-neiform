export interface IUseCase {
  execute(): IUseCase | Promise<IUseCase>
}
