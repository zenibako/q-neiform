import ILogger from "../../types/i-logger";
import { IRange, IScriptEditor, IScriptLine, IScriptData, IScriptTag } from "../../types/i-script";
import { Script } from "../../domain/entities/script";

export enum LineType {
  CHARACTER,
  DIALOGUE,
  TEXT,
  EMPTY,
}

export class Line {
  public readonly text: string
  private readonly typeAsString: string
  public readonly range: IRange
  public cueId?: string
  public tags: IScriptTag[]
  constructor(scriptAppLine: IScriptLine, ...tags: IScriptTag[]) {
    this.text = scriptAppLine.string
    this.typeAsString = scriptAppLine.typeAsString
    this.range = scriptAppLine.range
    this.cueId = scriptAppLine.cueId
    this.tags = tags
  }

  getType() {
    const typesByString = new Map<string, LineType>([
      ["Character", LineType.CHARACTER],
      ["Dialogue", LineType.DIALOGUE],
      ["Text", LineType.TEXT],
      ["Empty", LineType.EMPTY],
    ])

    return typesByString.get(this.typeAsString) ?? LineType.TEXT
  }

  getStartIndex() {
    return this.range.location
  }

  getEndIndex() {
    return this.range.location + this.range.length
  }
}

export class Scripts {
  constructor(private data: IScriptData, private editor: IScriptEditor, private logger: ILogger) { }

  listenForSelection(callback: (range: IRange) => void) {
    this.editor.listenForSelection((range) => {
      this.editor.toggleHighlight("#1E90FF", range)
      callback(range)
    })
  }

  stopListeningForSelection() {
    this.editor.stopListeningForSelection()
  }

  getLines() {
    return this.data.getLines().map((line) => new Line(line))
  }

  getLinesWithTags(): Line[] {
    const tags = this.editor.getTags("sfx", "vfx")
    return tags.map((tag) => new Line(this.data.getLineFromIndex(tag.range.location), tag))
  }

  getScopeLines(): Line[] {
    const contextLinesFromApp = this.editor.getSelectedLines()
    if (!contextLinesFromApp?.length) {
      contextLinesFromApp.push(this.editor.getCurrentLine())
    }

    return contextLinesFromApp.map((line) => new Line(line))
  }

  getContext(...scopeLines: Line[]): Line[] {
    const contextLines = [...scopeLines]
    const [firstLine] = contextLines
    const firstLineType = firstLine?.getType()

    let characterLine, dialogueLine
    // If first line is dialogue, get character line before it.
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

  private getCharacterLineBefore(line: Line): Line | null {
    const lineBefore = this.getLineBefore(line)
    if (!lineBefore) {
      return null
    }

    // Keep recursing until you get a character line.
    if (lineBefore.getType() !== LineType.CHARACTER) {
      return this.getCharacterLineBefore(lineBefore)
    }

    return lineBefore
  }

  getLineFromIndex(index: number): Line {
    const line = this.data.getLineFromIndex(index)
    return new Line(line)
  }

  /*
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
  */

  getScript(): Script {
    // return new Script(this.scriptApp.pullOutline())
    return new Script()
  }
}
