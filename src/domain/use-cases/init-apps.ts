import Menus from "../../data/repositories/menus";
import { Menu } from "../entities/menu";

export default class ConnectToBridge {
  constructor(private menus: Menus) {}

  async execute(menu: Menu) {
    await this.menus.initialize()
    this.menus.updateMenu(menu)
    return this
  }
}
