import { ICueApp } from "../abstractions/i-cues";
import Cue from "./cue";
import Script from "./script";

export default class CueEditor {
  constructor(private cueApp: ICueApp) { }

  getName(): string {
    return this.cueApp.name
  }

  getCueList(): Cue[] {
    return this.cueApp.getCueList()
  }

  pushUpdates(script: Script) {
    const cues = script.pullCues()
    this.cueApp.push(cues)
  }
}
