import Comment from '~/sdk/wep/models/comment/Comment'

export default class Comments {
  public comments: Comment[]

  constructor() {
    this.comments = []
  }

  public parse(comments: Comment[] | Comments | undefined): Comments | undefined {
    if (!comments) {
      return undefined
    }
    if (comments instanceof Comments) {
      this.comments = comments.comments
      return this
    }
    this.comments = []
    for (const comment of comments) {
      this.comments.push(new Comment(comment))
    }
    return this
  }

  public getBestRatedComments(amountOfComments: number): Comment[] {
    let bestRatedComments: Comment[] = []
    for (const comment of this.comments) {
      // no best rated comment
      if (bestRatedComments.length < amountOfComments) {
        bestRatedComments.push(comment)
        // sort among the total rating
        const tmpComments = new Comments()
        tmpComments.comments = bestRatedComments
        tmpComments.sortCommentsByRating()
        bestRatedComments = tmpComments.comments
      } else {
        // check the rating
        const rating = comment.calculatedRatings?.getTotalRating() || 0
        const findIndex = bestRatedComments.findIndex(tmpComment => {
          return rating > (tmpComment.calculatedRatings?.getTotalRating() || 0)
        })
        if (findIndex >= 0) {
          bestRatedComments[findIndex] = comment
        }
      }
    }
    return bestRatedComments
  }

  /**
   * Count all comments including children
   */
  public countComments(): number {
    let counter = 0
    for (let i = 0; i < this.comments.length; i++) {
      counter++
      const comment = this.comments[i]
      const childrenCounter = comment.children?.countComments() || 0
      counter += childrenCounter
    }
    return counter
  }

  public moveCommentWithTagToTop(tag: string): void {
    const commentWithTagIndex = this.comments.findIndex(comment => {
      return comment.tags?.tags.find(tmpTag => tmpTag.tag === tag)
    })
    // no comment with tag was found
    if (commentWithTagIndex < 0) {
      return
    }
    const commentWithTag = this.comments[commentWithTagIndex]
    // remove comment from it's position in the array
    this.comments.splice(commentWithTagIndex, 1)
    // add comment at the beginning
    this.comments.unshift(commentWithTag)
  }

  /**
   * Add a new comment at the beginning of the array
   * @param comment
   */
  public addComment(comment: Comment): void {
    this.comments.push(comment)
    this.sortComments()
  }

  /**
   * sort comments
   */
  public sortByCreatedAt(): void {
    this.comments.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) {
        return 0
      }
      return a.createdAt.valueOf() - b.createdAt.valueOf()
    })
  }

  public sortComments(): void {
    this.comments.sort((a, b) => {
      if (!a.modifiedAt || !b.modifiedAt) {
        return 0
      }
      return b.modifiedAt.valueOf() - a.modifiedAt.valueOf()
    })
  }

  public sortCommentsByRating(): Comment[] {
    return this.comments.sort((a, b) => {
      return (
        (b.calculatedRatings?.getTotalRating() || 0) - (a.calculatedRatings?.getTotalRating() || 0)
      )
    })
  }
}
