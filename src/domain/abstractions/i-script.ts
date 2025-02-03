import { IMenuItem } from "../../data/transfer-objects/menu";

export interface IScriptApp {
  setMenu(topLevelTitle: string, children: IMenuItem[]): void
}
