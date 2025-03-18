import { ICue, ICues } from "../../domain/abstractions/i-cues";
import ILogger from "../../domain/abstractions/i-logger";
import { IOscClient } from "../../domain/abstractions/i-osc";
import { TriggerCue } from "../../domain/entities/cue";
import { Line, LineType } from "./scripts";

export default class Cues implements ICues {
  private cueArray: ICue[] = []

  constructor(private oscClient: IOscClient, private logger: ILogger) { }

  *[Symbol.iterator](): IterableIterator<ICue> {
    for (let i = 0; i < this.cueArray.length; ++i) {
      const cue = this.cueArray[i]
      if (!cue) {
        continue
      }
      yield cue
    }
  }

  async getCueList(): Promise<object[]> {
    //async getCueList(): Promise<Cue[]> {
    // return this.cueApp.getCueList()
    return []
  }

  addFromLines(lines: Line[]) {
    let bufferCue, bufferCharacterName

    const cuesToAdd: ICue[] = []
    const reset = (cue?: ICue) => {
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
        let pushCue: ICue
        if (bufferCue) {
          bufferCue.name += cueName
          pushCue = bufferCue
        } else {
          pushCue = lineCue
        }
        pushCue.lines.push(line)
        reset(pushCue)
      } else if (isDifferentCharacter) {
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

  async push(): Promise<void> {
    for (const cue of this.cueArray) {
      await this.sendCue(cue)
      this.logger.log("end of iteration")
    }
    this.logger.log("push done")
  }

  private async sendCue(cue: ICue): Promise<void> {
    const messages = cue.getActions(this.oscClient)
    cue.id = await this.oscClient.send(...messages)
    this.logger.log("sendCue done")
  }

}
