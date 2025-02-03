// import OscDataSource from "../../data/data-sources/OscDataSource"
// import OscBundle from "../../data/data-transfer-objects/OscBundle"
import { ICue } from "../abstractions/i-cues"

interface StageToken {
  source: {
    mediaType?: string
  }
  getType(): string
}

export default class Cue implements ICue {
  isNewCue: boolean
  cueAddress: string
  mode?: number
  fileTarget?: string
  parentId?: string
  childIndex?: number

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
}
