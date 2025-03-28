import { Menu } from "../domain/entities/menu"
import { ICue } from "./i-cues";

export interface IRange {
  location: number; 
  length: number
}

export interface IScriptLine {
  string: string,
  typeAsString: string,
  range: IRange,
  cueId?: string
}

export interface IScriptData {
  getLineFromIndex(index: number): IScriptLine
  setLineData(range: IRange, key: string, value: string | null): void
}

export interface IScriptEditor {
  listenForSelection(callback: (range: IRange) => void): void
  stopListeningForSelection(): void
  toggleHighlight(color: string, range: IRange): void
  mountMenu(menu: Menu): void
  getCurrentLine(): IScriptLine
  getSelectedLines(): IScriptLine[]
  setRangeColor(range: IRange, backgroundColor: string, foregroundColor?: string): void
}

export interface IScriptStorage {
  getFountainText(): Promise<string | null>
  getYamlCues(): Promise<string | null>
}
