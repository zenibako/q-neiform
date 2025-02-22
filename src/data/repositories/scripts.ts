import { IScriptApp } from "../../domain/abstractions/i-script";
import { Cue } from "../../domain/entities/cue";
import { Script } from "../../domain/entities/script";

export class Scripts {
  constructor(private scriptApp: IScriptApp) { }

  getContextFromSelection(): Beat.Line[] {
    const selectedLines = this.scriptApp.getSelectedLines()
    if (!selectedLines?.length) {
      return []
    }

    const [firstLine] = selectedLines
    if (firstLine?.typeAsString() === "Dialogue") {
      const characterLineBefore = this.getCharacterLineBefore(firstLine)
      if (characterLineBefore) {
        selectedLines.unshift(characterLineBefore)
      }
    } else if (firstLine?.typeAsString() === "Character") {
      const lineAfter = this.getLineFromIndex(firstLine.position + firstLine.range.length)
      selectedLines.push(lineAfter)
    }

    return selectedLines
  }

  getLineBefore(line: Beat.Line) {
    const positionBefore = line.position - 1
    if (positionBefore < 0) {
      return null
    }
    return this.getLineFromIndex(positionBefore)
  }

  private getCharacterLineBefore(line: Beat.Line) {
    const lineBefore = this.getLineBefore(line)
    if (lineBefore && !lineBefore.characterName()) {
      return this.getLineBefore(lineBefore)
    }

    return lineBefore
  }

  getLineFromIndex(index: number) {
    return this.scriptApp.getLineFromIndex(index)
  }

  updateLines(cues: Cue[]) {
    const lines: Beat.Line[] = []
    for (const cue of cues) {
      for (const line of cue.lines) {
        this.scriptApp.setLineData(line, "cue_id", cue.id)
        lines.push(line)
      }
    }

    return lines
  }

  getScript(): Script {
    // return new Script(this.scriptApp.pullOutline())
    return new Script()
  }
}
