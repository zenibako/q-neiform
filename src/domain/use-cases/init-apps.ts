import Cues from "../../data/repositories/cues";
import Menus from "../../data/repositories/menus";
import { Scripts } from "../../data/repositories/scripts";
import { Menu } from "../entities/menu";

export default class InitApps {
  constructor(private scripts: Scripts, private cues: Cues, private menus: Menus) {}

  async execute(menu: Menu) {
    const { password, oscPort } = await this.menus.initialize()
    await this.cues.initialize(oscPort, password)
    this.menus.updateMenu(menu)
    return this
  }
}
