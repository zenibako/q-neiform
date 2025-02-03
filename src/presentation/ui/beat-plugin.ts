import { Editors } from "../../data/repositories/editors";
import BeatApp from "../../data/sources/beat-app"
import QLabApp from "../../data/sources/qlab-app";
import InitApps from "../../domain/use-cases/init-apps";
import PullCuesIntoScript from "../../domain/use-cases/pull-cues";
import PushCuesFromScript from "../../domain/use-cases/push-cues";

export default class BeatPlugin {
  contructor() {
    const beat = new BeatApp()
    const qlab = new QLabApp()
    const editors = new Editors(beat, qlab)

    new InitApps(editors).execute(
      new PushCuesFromScript(editors),
      new PullCuesIntoScript(editors)
    )
  }
}
