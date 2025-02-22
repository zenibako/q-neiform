import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import BeatApp, { Mode } from "../../data/sources/beat-app"
import { QLabWorkspace } from "../../data/sources/qlab-app";
import { Menu, MenuItem } from "../../domain/entities/menu";
import PullCuesIntoScript from "../../domain/use-cases/pull-cues";
import PushCuesFromScript from "../../domain/use-cases/push-cues";

const beat = new BeatApp(Mode.DEVELOPMENT)
const qlab = new QLabWorkspace(beat)

export default class BeatPlugin {
  async initialize() {
    beat.log("Starting plugin...")
    const scripts = new Scripts(beat, beat)
    const cues = new Cues(qlab, beat, beat)

    const menu = new Menu(qlab.name, [
      new MenuItem("Push to Cues", new PushCuesFromScript(scripts, cues, beat)),
      new MenuItem("Pull from Cues", new PullCuesIntoScript(cues, scripts))
    ])

    try {
      await beat.connect(qlab)
      beat.mountMenu(menu)
    } catch (e) {
      beat.log(`Error while connecting to bridge: ${(e as Error).message ?? e}`)
      Beat.end()
    }

    beat.log("Plugin is loaded")
  }
}
