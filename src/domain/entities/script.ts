import Cue from "./cue";

export default class Script {
  cuesToCueAppId: Map<string, Cue>

  constructor(private scenes: Beat.Scene[]) {
    this.cuesToCueAppId = new Map<string, Cue>()
  }

  mapCues(cues: Cue[]) {
    for (const cue of cues) {
      if (!cue.id) {
        continue
      }
      this.cuesToCueAppId.set(cue.id, cue)
    }
  }

  pullCues(): Cue[] {
    const cues = this.scenes.map(
      ({ sceneNumber, stringForDisplay, typeAsString, color }) => new Cue(sceneNumber, stringForDisplay, typeAsString(), color)
    )
    return cues
  }
}
