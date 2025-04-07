import { ICue, ICues } from "../../types/i-cues";
import ILogger from "../../types/i-logger";
import { TriggerCue } from "../../domain/entities/cue";
import { Line, LineType } from "./scripts";
import { IScriptStorage } from "../../types/i-script";
import { parse, stringify } from "yaml";

export default class Cues implements ICues {
  constructor(
    public readonly storage: IScriptStorage,
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

  async load() {
    const yamlString = await this.storage.getYamlCues()
    if (!yamlString) {
      throw new Error("No cue file found.")
    }
    this.logger.debug(yamlString)

    const { cues } = parse(yamlString) as ICue
    if (!cues) {
      this.storage.setYamlCues("cues: {}")
      throw new Error("No child cues found on root cue.")
    }
    this.list.push(...Object.values(cues))
  }

  async save() {
    const cues: Record<string, ICue> = {}
    for (const cue of this.list) {
      cues[cue.id] = cue
    }

    const yamlString = stringify({ cues })
    this.logger.debug(yamlString)
    return this.storage.setYamlCues(yamlString)
  }
}
