import ILogger from "../../domain/abstractions/i-logger";
import { IScriptApp } from "../../domain/abstractions/i-script";
import { Cue } from "../../domain/entities/cue";
import { Script } from "../../domain/entities/script";

export enum LineType {
  CHARACTER, DIALOGUE, TEXT
}

export class Line {
  public readonly text: string
  private readonly typeAsString: string
  public readonly range: Beat.Range
  constructor(
    appLine: Beat.Line,
    public cueId?: string | null
  ) {
    const jsonAppLine = appLine.forSerialization()
    this.text = jsonAppLine["string"] as string
    this.typeAsString = jsonAppLine["typeAsString"] as string
    this.range = jsonAppLine["range"] as Beat.Range
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

    const contextLines = contextLinesFromApp.map(line => {
      return new Line(line, line.getCustomData("cue_id"))
    })

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
    return new Line(line, line.getCustomData("cue_id"))
  }

  updateLines(lines: Line[]) {
    for (const line of lines) {
      const appLine = this.scriptApp.getLineFromIndex(line.getStartIndex())
      this.scriptApp.setLineData(appLine, "cue_id", line.cueId ?? null)
      if (line.cueId) {
        this.scriptApp.setRangeColor(line.range, "green")
      } else {
        this.scriptApp.setRangeColor(line.range, "gray")
      }
      lines.push(line)
    }

    return lines
  }

  getScript(): Script {
    // return new Script(this.scriptApp.pullOutline())
    return new Script()
  }
}
