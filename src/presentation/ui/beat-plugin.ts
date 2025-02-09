import { Editors } from "../../data/repositories/editors";
import BeatApp from "../../data/sources/beat-app"
import QLabApp from "../../data/sources/qlab-app";
import { Menu, MenuItem } from "../../domain/entities/menu";
import InitApps from "../../domain/use-cases/init-apps";
import PullCuesIntoScript from "../../domain/use-cases/pull-cues";
import PushCuesFromScript from "../../domain/use-cases/push-cues";

export default class BeatPlugin {
  contructor() {
    const beat = new BeatApp()
    const qlab = new QLabApp()
    const editors = new Editors(beat, qlab)

    const pushMenuItem = new MenuItem("Push to Cues", new PushCuesFromScript(editors))
    const pullMenuItem = new MenuItem("Pull from Cues", new PullCuesIntoScript(editors))
    const menu = new Menu("QLab", [pushMenuItem, pullMenuItem])

    new InitApps(editors).execute(menu)
  }
}
