import Cues from "../../data/repositories/cues";
import RemoteCues from "../../data/repositories/remote-cues";
import { Scripts } from "../../data/repositories/scripts";
import BeatPlugin, { Mode } from "../../data/sources/beat/plugin"
import BeatWebSocketWindow from "../../data/sources/beat/window";
import { Menu, MenuItem } from "../../domain/entities/menu";
import ClearCueMappings from "../../domain/use-cases/clear-mappings";
import ConvertTagsToCues from "../../domain/use-cases/convert-tags";
import PushCuesToRemote from "../../domain/use-cases/push-cues";

const plugin = new BeatPlugin(Mode.DEVELOPMENT)

async function initialize() {
  plugin.debug("Starting plugin...")
  const { host, port, password } = plugin.serverConfiguration
  const webSocketWindow = await new BeatWebSocketWindow(host, port).initialize(password)

  const scripts = new Scripts(plugin, plugin, plugin)
  const remoteCues = new RemoteCues(webSocketWindow, plugin, plugin)
  const localCues = new Cues(plugin, plugin)

  const menu = new Menu("QLab", [
    new MenuItem("Convert Tags to Cues", new ConvertTagsToCues(scripts, localCues, plugin)),
    new MenuItem("Push Cues", new PushCuesToRemote(localCues, remoteCues, plugin)),
    new MenuItem("Clear Cue Mappings", new ClearCueMappings(scripts, plugin))
  ])
  plugin.mountMenu(menu)
}

initialize()
  .then(() => plugin.debug("Plugin is initialized."))
  .catch((e) => {
    const errorMessage = (e as Error).message ?? JSON.stringify(e, null, 1)
    plugin.log(`Error while connecting to bridge: ${errorMessage}`)
    Beat.end()
  })
