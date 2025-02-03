import { Editors } from "../../data/repositories/editors";
import BeatApp from "../../data/sources/beat-app"
import QLabApp from "../../data/sources/qlab-app";
import ConnectApps from "../../domain/use-cases/load-editor";

export default class BeatPlugin {
  contructor() {
    const beat = new BeatApp()
    const osc = new QLabApp()
    const editors = new Editors(beat, osc)

    new ConnectApps(editors).execute()
  }
}
