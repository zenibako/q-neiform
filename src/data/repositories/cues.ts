import { ICue, ICues } from "../../types/i-cues";
import ILogger from "../../types/i-logger";
import { TriggerCue } from "../../domain/entities/cue";
import { Line, LineType } from "./scripts";

export default class Cues implements ICues {
  constructor(
    public readonly logger: ILogger,
    private readonly list: ICue[] = []
  ) { }

  *[Symbol.iterator](): IterableIterator<ICue> {
    for (let i = 0; i < this.list.length; ++i) {
      const cue = this.list[i]
      if (!cue) {
        continue
      }
      yield cue
    }
  }

  merge(cues?: ICues) {
    if (!cues) {
      return this.list
    }
    this.list.push(...cues)
    return this.list
  }

  add(...lines: Line[]): ICue[] {
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
        //pushCue.lines.push(line)
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

    this.list.push(...cuesToAdd)
    return cuesToAdd
  }
}
