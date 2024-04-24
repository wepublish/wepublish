import Tag from '~/sdk/wep/models/tags/Tag'

export default class Tags {
  public tags: Tag[]

  constructor() {
    this.tags = []
  }

  public parse(tags: Tag[] | Tags | undefined): Tags | undefined {
    if (!tags) {
      return undefined
    }
    if (tags instanceof Tags) {
      this.tags = tags.tags
      return this
    }
    this.tags = []
    for (const tag of tags) {
      this.tags.push(new Tag(tag))
    }
    return this
  }
}
