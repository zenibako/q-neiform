import { ICueApp } from "../../domain/abstractions/i-cues";
import ILogger from "../../domain/abstractions/i-logger";
import { IOscClient } from "../../domain/abstractions/i-osc";
import { Cue, TriggerCue } from "../../domain/entities/cue";
import { Line, LineType } from "./scripts";

export default class Cues {
  constructor(private cueApp: ICueApp, private oscClient: IOscClient, private logger: ILogger) { }

  async initialize() {
    this.logger.log("Initializing cues...")
    try {
      this.logger.log("Initialized! Ready for cues.")
    } catch (e) {
      this.logger.log("Error while initializing: " + ((e as Error).message ?? e))
      throw e
    }
  }

  getName(): string {
    return this.cueApp.name
  }

  async getCueList(): Promise<object[]> {
    //async getCueList(): Promise<Cue[]> {
    // return this.cueApp.getCueList()
    return []
  }

  getFromLines(lines: Line[]) {
    let triggerCue, triggerCharacterName

    const clear = () => {
      this.logger.log("Clearing trigger vars...")
      triggerCue = null
      triggerCharacterName = null
    }

    clear()
    const cues: Cue[] = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isLastLine = (i === lines.length)
      if (!line) {
        continue
      }


      const lineCharacterName = line.getType() == LineType.CHARACTER ? line.text : null
      let cueName = line.text
      let isDifferentCharacter = false
      if (lineCharacterName) {
        triggerCharacterName = lineCharacterName
        isDifferentCharacter = lineCharacterName !== triggerCharacterName
        cueName += ":"
      }

      if (!isLastLine) {
        cueName += " "
      }

      const lineCue = new TriggerCue(cueName, line.cueId)
      const pushCue: TriggerCue = triggerCue ?? lineCue
      pushCue.lines.push(line)

      if (isLastLine) {
        cues.push(pushCue)
        clear()
      } else if (isDifferentCharacter) {
        cues.push(lineCue)
        clear()
      }       

      if (triggerCue) {
        pushCue.name += cueName
      }
      triggerCue = pushCue
    }

    return cues
  }

  async pushUpdates(...cues: Cue[]) {
    return Promise.all(cues.map((cue) => this.oscClient.send(cue)))
  }
}
