import { Line } from "../../data/repositories/scripts";
import { CueType } from "../../data/sources/qlab-app";
import { ICue } from "../abstractions/i-cues";
import { IOscDictionary, IOscMessage } from "../abstractions/i-osc";

export class CueAction implements IOscMessage {
  constructor(
    public readonly address: string,
    public readonly args: (string | number)[] = []
  ) { }
}

export class Cue implements ICue {
  lines: Line[] = []
  address?: string
  mode?: number
  // fileTarget?: string
  // parentId?: string
  // childIndex?: number

  constructor(
    public name: string,
    public type: CueType,
    public id: string | null = null,
  ) { }

  private propActions: CueAction[] = []

  addPropAction(address: string, ...args: (string | number)[]) {
    this.propActions.push(new CueAction(this.getQueryAddress() + address, args))
  }

  getActions(dict: IOscDictionary) {
    if (!this.id) {
      return [ new CueAction(dict.new.address, [this.type]) ]
    }

    const propActions = [new CueAction(`${this.getQueryAddress()}${dict.name.address}`, [this.name])]
    if (this.mode) {
      this.propActions.push(new CueAction(`${this.getQueryAddress()}${dict.mode.address}`, [this.mode]))
    }
    return propActions
  }

  getQueryAddress() {
    return `/cue/${this.id?.length ? this.id : "selected"}`
  }

  /*
  constructor(
    public number: string,
    public name: string,
    public type: string,
    public color: string,
    public id?: string,
  ) {
    // this.type = this.getCueType(token);

    this.isNewCue = !this.id;

    this.cueAddress = `/cue/${this.isNewCue ? 'selected' : this.id}`;

    if (this.type === 'group') {
      this.mode = type === 'trigger_begin' ? 3 : 1;
    }
  }

  setParent(parentId: string, color?: string) {
    this.parentId = parentId
    if (this.type === 'event' && color) {
      this.color = color
    }

    return this
  }

  getCueType(token: StageToken) {
    const { source = {} } = token
    if (['trigger_begin', 'section', 'title'].includes(token.getType() ?? '')) {
      return 'group'
    }

    const { mediaType } = source;
    if (mediaType) {
      return mediaType;
    }

    return 'memo';
  }
    */
}
export class SceneCue extends Cue {
  constructor(name: string, id?: string | null) {
    super(name, "group", id)
    this.mode = 1
  }
}

export class TriggerCue extends Cue {
  constructor(name: string, id?: string | null) {
    super(name, "group", id)
    this.mode = 3
  }
}
