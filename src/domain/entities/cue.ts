import { Line } from "../../data/repositories/scripts"
import { CueType } from "../../data/sources/qlab/workspace"
import { ICue } from "../../types/i-cues"
import { IOscClient, IOscMessage } from "../../types/i-osc"

export class CueAction implements IOscMessage {
  constructor(
    public readonly address: string,
    public readonly args: (string | number)[] = [],
    public readonly listenOn?: string
  ) {
  }
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
  ) {
  }

  getActions(oscClient: IOscClient) {
    const dict = oscClient.getDictionary()
    const actions: CueAction[] = []
    if (!this.id) {
      const newAddress = oscClient.getTargetAddress(dict.new.address)
      actions.push(new CueAction(newAddress, [this.type], newAddress))
    }

    const prefix = oscClient.getTargetAddress(dict.cue.address + "/" + (this.id?.length ? this.id : "selected"))
    actions.push(new CueAction(prefix + dict.name.address, [this.name]))
    if (this.mode) {
      actions.push(new CueAction(prefix + dict.mode.address, [this.mode]))
    }

    return actions
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
