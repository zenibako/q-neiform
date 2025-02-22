import { ICueApp } from "../../domain/abstractions/i-cues";
import ILogger from "../../domain/abstractions/i-logger";
import { IOscClient } from "../../domain/abstractions/i-osc";
import { Cue, TriggerCue } from "../../domain/entities/cue";
import { Script } from "../../domain/entities/script";
// import Cue from "../../domain/entities/cue";
// import Stage from "../../domain/entities/Stage";
// import StageToken, { StageTokenType } from "../../domain/entities/StageToken";
// import { ICueCommandBundle } from "../../domain/abstractions/ICueCommandBundle";
// import OscBundle from "../transfer-objects/osc-bundle";

/*
enum Phase {
  Groups = 'groups',
  Events = 'events',
  Moves = 'moves',
}
*/

export default class Cues {
  // private mappingByCueNumber: Record<string, string> = {}
  // private triggerColorMap: Record<string, string> = {};
  // private parentChildIdMap: Record<string, string[]> = {};

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

  getFromLines(lines: Beat.Line[]) {
    let currentTriggerCue = null
    const cues: Cue[] = []
    for (const line of lines) {
      let text = line.cleanedString()

      // If there's no current trigger cue, set one up and move on
      if (currentTriggerCue === null) {
        if (line.characterName()) {
          text += ": "
        }
        currentTriggerCue = new TriggerCue(text, line.getCustomData("cue_id"))
        currentTriggerCue.lines.push(line)
        continue
      }


      // A new character means a break in the dialogue and the end of the cue.
      if (line.characterName()) {
        cues.push(currentTriggerCue)
        if (line.characterName()) {
          text += ": "
        }
        currentTriggerCue = new TriggerCue(text, line.getCustomData("cue_id"))
        currentTriggerCue.lines.push(line)
        continue
      }

      // Otherwise, just append the text.
      currentTriggerCue.name += text
      currentTriggerCue.lines.push(line)
    }

    return cues
  }

  async pushUpdates(...cues: Cue[]) {
    return Promise.all(cues.map((cue) => this.oscClient.send(cue)))
  }

  /*
  get(cueNumber: number, parentNumber?: number): Cue {
      let id, color
      if (cueNumber) {
          id = this.mappingByCueNumber[cueNumber]
          color = this.triggerColorMap[cueNumber]
      }
 
      const cue = new Cue(token, id, color)
 
      let parentId
      if (parentNumber) {
          parentId = this.mappingByCueNumber[parentNumber]
          cue.setParent(parentId, this.triggerColorMap[parentNumber])
      }
 
      if (id && parentId) {
          const siblings = this.parentChildIdMap[parentId] || [];
          cue.childIndex = siblings.length;
          siblings.push(id);
          this.parentChildIdMap[parentId] = siblings;
          // console.log('parentChildIdMap', this.parentChildIdMap)
      }
      
      return cue
  }
 
  getAll(stage: Stage) {
      const tokens = stage.getTokens()
      
      this.triggerColorMap = tokens.reduce((map, { type, cueNumber }) => {
          if (!cueNumber) {
              return map
          }
  
          const existingColor = map[cueNumber];
          if (existingColor) {
              return map;
          }
  
          if (type === StageTokenType.TriggerBegin) {
              map[cueNumber] = getColor();
          }
          return map
      }, this.triggerColorMap)
 
      return tokens
          .reduce((p: Cue[], token: StageToken) => {
              const cue = this.get(token)
              return [ ...p, cue ]
          }, [])
  }
 
  async set(...cues: Cue[]) {
      if (!this.oscData.initialized) {
          await this.oscData.initialize()
      }
 
      const phaseValues = Object.values(Phase) as string[]
      phaseValues.forEach(async phase => {
          const bundles = cues.map(cue => new OscBundle(phase).addFromCue(cue))
          if (bundles.length) {
              const mapping = await this.oscData.send(...bundles)
              Object.assign(this.mappingByCueNumber, mapping)
          }
      })
  }
  */
}

/*

function getFilterTypes(phase: string) {
    if (phase === Phase.Groups) {
        return [StageTokenType.TriggerBegin, StageTokenType.Section, StageTokenType.Title];
    } else if (phase === Phase.Events) {
        return [StageTokenType.Event];
    }
    return []
}

enum Color {
    Red = 'red',
    Orange = 'orange',
    Green = 'green',
    Blue = 'blue',
    Purple = 'purple',
}

let colorIndex = 0;
function getColor() {
    const colorValues = Object.values(Color)
    const color = colorValues[colorIndex];
    colorIndex++;

    if (colorIndex === colorValues.length) {
        colorIndex = 0;
    }

    return color;
}
*/
