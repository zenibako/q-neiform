import { ICueApp } from "../abstractions/i-cues";
// import Cue from "./cue.ts.bak";
import Script from "./script";

export default class CueEditor {
  constructor(private cueApp: ICueApp) { }

  getName(): string {
    return this.cueApp.name
  }

  async getCueList(): Promise<object[]> {
  //async getCueList(): Promise<Cue[]> {
    // return this.cueApp.getCueList()
    return []
  }

  async pushUpdates(script: Script) {
    const cues = script.pullCues()
    //this.cueApp.push(cues)
    return cues
  }
}
