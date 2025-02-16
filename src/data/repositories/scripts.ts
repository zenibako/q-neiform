import { IScriptApp } from "../../domain/abstractions/i-script";
import Script from "../../domain/entities/script";

export class Scripts {
  constructor(private scriptApp: IScriptApp) {}

  getScript(): Script {
    // return new Script(this.scriptApp.pullOutline())
    return new Script()
  }
}
