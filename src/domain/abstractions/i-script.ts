import OscPort from "../../presentation/adapters/osc-adapter";
import { Menu } from "../entities/menu";

export interface ConnectResponse {
  oscPort: OscPort
  password?: string
}

export interface IScriptApp {
  mountMenu(menu: Menu): void
  pullOutline(): Beat.Scene[]
}
