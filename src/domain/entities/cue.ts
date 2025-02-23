import { Line } from "../../data/repositories/scripts";
import { CueType } from "../../data/sources/qlab-app";

class CueAction {
  constructor(
    public readonly address: string,
    public readonly args: (string | number)[] = []
  ) { }
}

export class Cue {
  lines: Line[] = []
  address: string
  mode?: number
  private actionQueue: CueAction[] = []
  // fileTarget?: string
  // parentId?: string
  // childIndex?: number

  constructor(
    public name: string,
    public type: CueType,
    public id?: string | null,
  ) {
    this.address = `/cue/${this.id?.length ? this.id : "selected"}`;
    // this.type = this.getCueType(token);
    /*
    if (this.type === 'group') {
      this.mode = type === 'trigger_begin' ? 3 : 1;
    }
    */
  }

  getActions() {
    let initAction 
    if (this.id?.length) {
      this.address = "/cue/selected";
      initAction = new CueAction(this.address)
    } else {
      initAction = new CueAction("/new", [this.type])
    }
    this.actionQueue.unshift(new CueAction(`${this.address}/name`, [this.name]))
    this.actionQueue.unshift(initAction)
    this.actionQueue.push(new CueAction(this.address))
    return this.actionQueue
  }

  clearActions() {
    this.actionQueue = []
  }

  queueAction(address: string, ...args: (string | number)[]) {
    this.address = `/cue/${this.id?.length ? this.id : "selected"}`;
    this.actionQueue.push(new CueAction(this.address + address, args))
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
    this.queueAction("/mode", 1)
  }
}

export class TriggerCue extends Cue {
  constructor(name: string, id?: string | null) {
    super(name, "group", id)
    this.queueAction("/mode", 3)
  }
}
