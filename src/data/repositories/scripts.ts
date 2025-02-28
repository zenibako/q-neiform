import ILogger from "../../domain/abstractions/i-logger";
import { IScriptApp, IScriptAppLine } from "../../domain/abstractions/i-script";
import { Script } from "../../domain/entities/script";

export enum LineType {
  CHARACTER, DIALOGUE, TEXT
}

export class Line {
  public readonly text: string
  private readonly typeAsString: string
  public readonly range: Beat.Range
  public cueId?: string
  constructor(scriptAppLine: IScriptAppLine) {
    this.text = scriptAppLine.string
    this.typeAsString = scriptAppLine.typeAsString
    this.range = scriptAppLine.range
    this.cueId = scriptAppLine.cueId
  }

  getType() {
    switch (this.typeAsString) {
      case "Character":
        return LineType.CHARACTER
      case "Dialogue":
        return LineType.DIALOGUE
      default:
        return LineType.TEXT
    }
  }

  getStartIndex() {
    return this.range.location
  }

  getEndIndex() {
    return this.range.location + this.range.length
  }
}

export class Scripts {
  constructor(private scriptApp: IScriptApp, private logger: ILogger) { }

  getContextFromSelection(): Line[] {
    const contextLinesFromApp = this.scriptApp.getSelectedLines()
    if (!contextLinesFromApp?.length) {
      contextLinesFromApp.push(this.scriptApp.getCurrentLine())
    }

    const contextLines = contextLinesFromApp.map(line => new Line(line))

    const [firstLine] = contextLines
    const firstLineType = firstLine?.getType()

    let characterLine, dialogueLine
    // If first selected line is dialogue, get character line before it.
    if (firstLineType === LineType.DIALOGUE) {
      characterLine = this.getCharacterLineBefore(firstLine!)
      if (characterLine) {
        contextLines.unshift(characterLine)
      }
    }
    // If first selected line is a character name, get the first line after it.
    else if (firstLineType === LineType.CHARACTER && contextLines.length === 1) {
      dialogueLine = this.getLineFromIndex(firstLine!.getEndIndex())
      if (dialogueLine) {
        contextLines.push(dialogueLine)
      }
    }

    return contextLines
  }

  getLineBefore(line: Line) {
    const indexBefore = line.getStartIndex() - 1
    if (indexBefore < 0) {
      return null
    }
    return this.getLineFromIndex(indexBefore)
  }

  private getCharacterLineBefore(line: Line) {
    const lineBefore = this.getLineBefore(line)
    if (lineBefore && line.getType() !== LineType.CHARACTER) {
      return this.getLineBefore(lineBefore)
    }

    return lineBefore
  }

  getLineFromIndex(index: number): Line {
    const line = this.scriptApp.getLineFromIndex(index)
    return new Line(line)
  }

  updateLines(lines: Line[]) {
    this.logger.log("Updating lines...")
    for (const line of lines) {
      const appLine = this.scriptApp.getLineFromIndex(line.getStartIndex())
      this.scriptApp.setLineData(appLine.range, "cue_id", line.cueId ?? null)
      this.scriptApp.setRangeColor(line.range, line.cueId ? "green" : "gray")
      lines.push(line)
    }

    return lines
  }

  getScript(): Script {
    // return new Script(this.scriptApp.pullOutline())
    return new Script()
  }
}
