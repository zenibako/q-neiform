import Cues from "../../data/repositories/cues";
import { Scripts } from "../../data/repositories/scripts";
import BeatPlugin, { Mode } from "../../data/sources/beat/plugin"
import { Menu, MenuItem } from "../../domain/entities/menu";
import ClearCueMappings from "../../domain/use-cases/clear-mappings";
import DefineCueFromSelection from "../../domain/use-cases/define-cues";
import PushCuesFromScript from "../../domain/use-cases/push-cues";

const plugin = new BeatPlugin(Mode.DEVELOPMENT)

async function initialize() {
  plugin.debug("Starting plugin...")
  const scripts = new Scripts(plugin, plugin)
  const cues = new Cues(plugin, plugin)

  const menu = new Menu("QLab", [
    new MenuItem("Push to Cues", new PushCuesFromScript(scripts, cues, plugin)),
    new MenuItem("Highlight Cues", new DefineCueFromSelection(scripts, cues, plugin)),
    new MenuItem("Clear Cue Mappings", new ClearCueMappings(scripts, plugin))
  ])

  await plugin.initialize()
  plugin.mountMenu(menu)
}

initialize()
  .then(() => plugin.debug("Plugin is initialized."))
  .catch((e) => {
    const errorMessage = (e as Error).message ?? JSON.stringify(e, null, 1)
    plugin.log(`Error while connecting to bridge: ${errorMessage}`)
    Beat.end()
  })
