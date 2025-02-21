import { Menu } from "../entities/menu";

export interface IScriptApp {
  mountMenu(menu: Menu): void
  getCurrentLine(): Beat.Line
  pullOutline(): Beat.Scene[]
}
