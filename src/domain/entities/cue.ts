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
  actionQueue: CueAction[] = []
  // fileTarget?: string
  // parentId?: string
  // childIndex?: number

  constructor(
    public name: string,
    public id?: string | null,
  ) {
    // this.type = this.getCueType(token);
    this.address = `/cue/${this.id?.length ? this.id : "selected"}`;
    this.queueAction(`${this.address}/name`, name)
    /*
    if (this.type === 'group') {
      this.mode = type === 'trigger_begin' ? 3 : 1;
    }
    */
  }

  initialize(type: CueType) {
    let initAction 
    if (this.id?.length) {
      initAction = new CueAction(this.address)
    } else {
      initAction = new CueAction("/new", [type])
    }
    this.actionQueue.unshift(initAction)
  }

  queueAction(address: string, ...args: (string | number)[]) {
    this.actionQueue.push(new CueAction(address, args))
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
    super(name, id)
    this.initialize("group")
    this.queueAction(`${this.address}/mode`, 1)
  }
}

export class TriggerCue extends Cue {
  constructor(name: string, id?: string | null) {
    super(name, id)
    this.initialize("group")
    this.queueAction(`${this.address}/mode`, 3)
  }
}
