import Cues from "../../data/repositories/cues";
import Menus from "../../data/repositories/menus";
import { Scripts } from "../../data/repositories/scripts";
import BeatApp, { Mode } from "../../data/sources/beat-app"
import QLabApp from "../../data/sources/qlab-app";
import { Menu, MenuItem } from "../../domain/entities/menu";
import ConnectToBridge from "../../domain/use-cases/init-apps";
import PullCuesIntoScript from "../../domain/use-cases/pull-cues";
import PushCuesFromScript from "../../domain/use-cases/push-cues";

const beat = new BeatApp(Mode.DEVELOPMENT)
const qlab = new QLabApp(beat)

export default class BeatPlugin {
  async initialize() {
    beat.log("Starting plugin...")
    const scripts = new Scripts(beat)
    const cues = new Cues(qlab, beat)
    const menus = new Menus(beat, beat)

    const pushMenuItem = new MenuItem("Push to Cues", new PushCuesFromScript(scripts, cues))
    const pullMenuItem = new MenuItem("Pull from Cues", new PullCuesIntoScript(cues, scripts))
    const menu = new Menu("QLab", [pushMenuItem, pullMenuItem])

    try {
      await new ConnectToBridge(menus).execute(menu)
    } catch (e) {
      beat.log("Error while connecting to bridge: " + ((e as Error).message ?? JSON.stringify(e)))
      Beat.end()
    }
    beat.log("Plugin is loaded")
  }
}
