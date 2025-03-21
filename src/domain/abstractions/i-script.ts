import { Menu } from "../entities/menu";

export interface IRange {
  location: number; 
  length: number
}

export interface IScriptAppLine {
  string: string,
  typeAsString: string,
  range: IRange,
  cueId?: string
}

export interface IScriptApp {
  listenForSelection(callback: (range: IRange) => void): void
  stopListeningForSelection(): void
  toggleHighlight(color: string, range: IRange): void
  mountMenu(menu: Menu): void
  getCurrentLine(): IScriptAppLine
  getSelectedLines(): IScriptAppLine[]
  getLineFromIndex(index: number): IScriptAppLine
  setLineData(range: IRange, key: string, value: string | null): void
  setRangeColor(range: IRange, backgroundColor: string, foregroundColor?: string): void
}
