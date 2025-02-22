import { Menu } from "../entities/menu";

export interface IScriptApp {
  mountMenu(menu: Menu): void
  getCurrentLine(): Beat.Line
  getSelectedLines(): Beat.Line[]
  getLineFromIndex(index: number): Beat.Line
  setLineData(line: Beat.Line, key: string, value?: string): Beat.Line
  pullOutline(): Beat.Scene[]
}
