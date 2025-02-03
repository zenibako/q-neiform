import { IMenuItem } from "../entities/menu";

export interface IScriptApp {
  mountMenu(topLevelTitle: string, children: IMenuItem[]): void
  pullOutline(): Beat.Scene[]
}
