import { Menu } from "../entities/menu";

export interface IScriptApp {
  mountMenu(menu: Menu): void
  pullOutline(): Beat.Scene[]
}
