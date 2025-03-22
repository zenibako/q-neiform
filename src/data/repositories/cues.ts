import { ICue, ICues } from "../../types/i-cues";
import ILogger from "../../types/i-logger";
import { IOscClient } from "../../types/i-osc";
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

  addFromLines(lines: Line[]): ICue[] {
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
    return cuesToAdd
  }

  async push(): Promise<void> {
    for (const cue of this.cueArray) {
      const messages = cue.getActions(this.oscClient)
      const [replyString] = await this.oscClient.send(...messages)
      if (!replyString) {
        continue
      }
      const { data } = JSON.parse(replyString)
      cue.id = data
      this.logger.debug(`Set ID on cue: ${cue.id}`)
    }
    this.logger.debug("Push done!")
  }
}
