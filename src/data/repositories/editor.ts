import BeatData from "../sources/beat-data";
import OscData from "../sources/osc-data";
import { MenuItem } from "../transfer-objects/menu";

export class Editor {
  constructor(private beatData: BeatData, private oscData: OscData) { }

  initializeMenu(cueSourceName: string) {
    this.beatData.setMenu(cueSourceName, [
      new MenuItem("Connect", () => this.oscData.initialize())
    ])
  }
}
