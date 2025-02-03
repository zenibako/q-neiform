import { Editors } from "../../data/repositories/editors";
import { IActionableUseCase, IGroupUseCase } from "../abstractions/i-use-cases";

export default class InitApps implements IGroupUseCase {
  constructor(private editors: Editors) {}

  execute(...useCases: IActionableUseCase[]): IGroupUseCase {
    const scriptEditor = this.editors.getScriptEditor()
    const cueEditor = this.editors.getCueEditor()
    scriptEditor.initialize(cueEditor.getName(), useCases)
    return this
  }
}
