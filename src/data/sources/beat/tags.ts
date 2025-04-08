import { BeatRange, BeatTag, BeatTagType } from "../../../types/beat/beat-types"
import { IScriptTag } from "../../../types/i-script"

const DOC_TAGS_KEY = "Tags"

export class BeatTagQuery {

  constructor(
    public readonly types: BeatTagType[] = [],
    public readonly ranges: BeatRange[] = []
  ) { }

  isTypeMatch(tag: BeatTag) {
    if (!this.types.length) {
      return true
    }

    return this.types.includes(tag.type)
  }

  isRangeMatch({ range: [tagLocation, tagLength] }: BeatTag) {
    if (!this.ranges.length) {
      return true
    }

    let isIncluded = false
    for (const range of this.ranges) {
      const tagEndIndex = tagLocation + tagLength
      const queryEndIndex = range.location + range.length
      isIncluded ||= (tagLocation >= range.location && tagEndIndex <= queryEndIndex)
    }

    return isIncluded
  }
}

export default class BeatTags {
  static get(query: BeatTagQuery): IScriptTag[] {
    const tags = Beat.getRawDocumentSetting(DOC_TAGS_KEY) ?? []
    return tags
      .filter((tag: BeatTag) => query.isTypeMatch(tag) && query.isRangeMatch(tag))
  }
}
