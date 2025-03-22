import { BeatRange, BeatTag, BeatTagType } from "../../../types/beat/beat-types"

const DOC_TAGS_KEY = "Tags"

export class BeatTagQuery {
  public type?: BeatTagType
  public range?: BeatRange

  isTypeMatch(tag: BeatTag) {
    if (!this.type) {
      return true
    }

    return this.type === tag.type
  }

  isRangeMatch({ range: [ tagLocation, tagLength ] }: BeatTag) {
    if (!this.range) {
      return true
    }

    const tagEndIndex = tagLocation + tagLength
    const queryEndIndex = this.range.location + this.range.length
    return tagLocation >= this.range.location && tagEndIndex <= queryEndIndex
  }
}

export default class BeatTags {
  static get(query: BeatTagQuery): BeatTag[] {
    const tags = Beat.getRawDocumentSetting(DOC_TAGS_KEY) ?? []
    return tags.filter((tag: BeatTag) => {
      return query.isTypeMatch(tag) && query.isRangeMatch(tag)
    })
  }
}
