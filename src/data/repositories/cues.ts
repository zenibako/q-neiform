import { ICue, ICueApp, ICues } from "../../domain/abstractions/i-cues";
import ILogger from "../../domain/abstractions/i-logger";
import { IOscClient, IOscDictionary } from "../../domain/abstractions/i-osc";
import { Cue, CueAction, TriggerCue } from "../../domain/entities/cue";
import { Line, LineType } from "./scripts";

export default class Cues implements ICues {
  private cueArray: Cue[] = []

  constructor(private cueApp: ICueApp, private oscClient: IOscClient, private logger: ILogger) { }

  *[Symbol.iterator](): IterableIterator<ICue> {
    for (let i = 0; i < this.cueArray.length; ++i) {
      const cue = this.cueArray[i]
      if (!cue) {
        continue
      }
      yield cue
    }
  }

  getSourceName(): string {
    return this.cueApp.name
  }

  async getCueList(): Promise<object[]> {
    //async getCueList(): Promise<Cue[]> {
    // return this.cueApp.getCueList()
    return []
  }

  addFromLines(lines: Line[]) {
    let bufferCue, bufferCharacterName

    const cuesToAdd: Cue[] = []
    const reset = (cue?: Cue) => {
      if (cue) {
        cuesToAdd.push(cue)
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
        this.logger.log("Pushing buffer cue since this is a different character...")
        reset(bufferCue)
      }

      if (bufferCue) {
        bufferCue.name += cueName
      } else {
        bufferCue = lineCue
      }

      bufferCue?.lines.push(line)
    }

    this.cueArray.push(...cuesToAdd)
  }

  getFirstCueWithoutId() {
    for (const cue of this.cueArray) {
      if (!cue.id) {
        return cue
      }
    }

    return null
  }
  getActions(dict: IOscDictionary) {
    const actionQueue: CueAction[] = []
    for (const cue of this.cueArray) {
      actionQueue.push(...cue.getActions(dict))
    }
    return actionQueue
  }

  clearActions() {
    this.cueArray.forEach(cue => cue.clearActions())
  }

  async pushUpdates(): Promise<ICues> {
    const pushedCues = await this.oscClient.sendCues(this)
    Beat.log(`Pushed cues!`)
    return pushedCues
  }
}
