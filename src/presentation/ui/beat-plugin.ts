import OSC from "osc-js";
import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import BeatApp, { Mode } from "../../data/sources/beat-app"
import { Menu, MenuItem } from "../../domain/entities/menu";
import ClearCueMappings from "../../domain/use-cases/clear-mappings";
import PushCuesFromScript from "../../domain/use-cases/push-cues";

const beat = new BeatApp(Mode.DEVELOPMENT)

export default class BeatPlugin {
  async initialize() {
    beat.log("Starting plugin...")
    const scripts = new Scripts(beat, beat)
    const cues = new Cues(beat, beat)

    const menu = new Menu("QLab", [
      new MenuItem("Push to Cues", new PushCuesFromScript(scripts, cues, beat)),
      new MenuItem("Clear Cue Mappings", new ClearCueMappings(scripts, beat))
    ])

    try {
      await beat.connect()
      beat.mountMenu(menu)
    } catch (e) {
      beat.log(`Error while connecting to bridge: ${(e as Error).message ?? e}`)
      Beat.end()
    }

    beat.log("Plugin is loaded.")
  }
}
