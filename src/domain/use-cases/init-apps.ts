import { Editors } from "../../data/repositories/editors";
import { Menu } from "../entities/menu";

export default class InitApps {
  constructor(private editors: Editors) {}

  execute(menu: Menu) {
    const scriptEditor = this.editors.getScriptEditor()
    scriptEditor.initialize(menu)
    return this
  }
}
