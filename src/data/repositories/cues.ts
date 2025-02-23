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
    let bufferCue, bufferCharacterName


    const cues: Cue[] = []
    const reset = (cue?: Cue) => {
      if (cue) {
        cues.push(cue)
      }
      bufferCue = null
      bufferCharacterName = null
    }

    reset()
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isLastLine = (i === lines.length - 1)
      if (!line) {
        continue
      }


      const lineCharacterName = line.getType() == LineType.CHARACTER ? line.text : null
      let cueName = line.text
      let isDifferentCharacter = false
      if (lineCharacterName) {
        isDifferentCharacter = lineCharacterName !== bufferCharacterName
        bufferCharacterName = lineCharacterName
        cueName += ":"
      }

      if (!isLastLine) {
        cueName += " "
      }

      const lineCue = new TriggerCue(cueName, line.cueId)

      if (isLastLine) {
        this.logger.log("Pushing buffer cue since this is the last line...")
        let pushCue: Cue
        if (bufferCue) {
          bufferCue.name += cueName
          pushCue = bufferCue
        } else {
          pushCue = lineCue
        }
        pushCue.lines.push(line)
        reset(pushCue)
      } else if (isDifferentCharacter) {
        this.logger.log("Pushing bufer cue since this is a different character...")
        reset(bufferCue)
      }

      if (bufferCue) {
        bufferCue.name += cueName
      } else {
        bufferCue = lineCue
      }

      bufferCue?.lines.push(line)
    }

    return cues
  }

  async pushUpdates(...cues: Cue[]): Promise<Cue[]> {
    const pushedCues: Cue[] = []
    for (const cue of cues) {
      pushedCues.push(await this.oscClient.send(cue))
    }
    return pushedCues
  }
}
