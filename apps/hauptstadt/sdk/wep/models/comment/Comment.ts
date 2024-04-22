import moment, {Moment} from 'moment'
import {gql} from 'graphql-tag'
import User from '~/sdk/wep/models/user/User'
import Comments from '~/sdk/wep/models/comment/Comments'
import {SlateNode} from '~/sdk/wep/classes/Slate'
import CalculatedRatings from '~/sdk/wep/models/comment/CalculatedRatings'
import Tags from '~/sdk/wep/models/tags/Tags'
import Tag from '~/sdk/wep/models/tags/Tag'
import CalculatedRating from '~/sdk/wep/models/comment/CalculatedRating'
import WepImage from '~/sdk/wep/models/image/WepImage'
import {WepPublicationTypeName} from '~/sdk/wep/interfacesAndTypes/WePublish'
export type CommentAuthorType = 'Author' | 'Team' | 'VerifiedUser'
export type RejectReason = 'spam' | 'misconduct'
export type CommentState = 'approved' | 'pendingApproval' | 'pendingUserChanges' | 'rejected'

export interface CommentProps {
  id: string
  parentID: string
  user?: User
  guestUsername?: string
  guestUserImage?: WepImage
  calculatedRatings?: CalculatedRatings
  tags?: Tags
  authorType: CommentAuthorType
  itemID: string
  itemType: WepPublicationTypeName
  children?: Comments
  title?: string
  lead?: string
  text?: SlateNode[]
  state: CommentState
  source: string
  rejectionReason: RejectReason
  createdAt?: Moment
  modifiedAt?: Moment
}

export default class Comment {
  public id: string
  public parentID: string
  public user?: User
  public guestUsername?: string
  public guestUserImage?: WepImage
  public calculatedRatings?: CalculatedRatings
  public tags?: Tags
  public authorType: CommentAuthorType
  public itemID: string
  public itemType: WepPublicationTypeName
  public children?: Comments
  public title?: string
  public lead?: string
  public text?: SlateNode[]
  public state: CommentState
  public source: string
  public rejectionReason: RejectReason
  public createdAt?: Moment
  public modifiedAt?: Moment

  constructor({
    id,
    parentID,
    user,
    guestUsername,
    guestUserImage,
    calculatedRatings,
    tags,
    authorType,
    itemID,
    itemType,
    children,
    title,
    lead,
    text,
    state,
    source,
    rejectionReason,
    createdAt,
    modifiedAt
  }: CommentProps) {
    this.id = id
    this.parentID = parentID
    this.user = user ? new User(user) : undefined
    this.guestUsername = guestUsername
    this.guestUserImage = guestUserImage ? new WepImage(guestUserImage) : undefined
    this.calculatedRatings = new CalculatedRatings().parse(calculatedRatings)
    this.tags = new Tags().parse(tags)
    this.authorType = authorType
    this.itemID = itemID
    this.itemType = itemType
    this.children = new Comments().parse(children)
    this.title = title
    this.lead = lead
    this.text = text
    this.state = state
    this.source = source
    this.rejectionReason = rejectionReason
    this.createdAt = createdAt ? moment(createdAt) : undefined
    this.modifiedAt = modifiedAt ? moment(modifiedAt) : undefined
  }

  public getUserName(): string {
    if (this.guestUsername) {
      return this.guestUsername
    }
    const userName = this.user?.getUserName()
    if (userName) {
      return userName
    }
    return 'Gast'
  }

  /**
   * Add a new comment into the childs
   * @param comment
   */
  public addChild(comment: Comment): void {
    if (!this.children) {
      this.children = new Comments()
    }
    this.children.comments.push(comment)
    // re-organize
    this.children.sortComments()
  }

  public static commentFieldsFragment = gql`
    fragment commentFields on Comment {
      id
      parentID
      user {
        ...user
      }
      guestUsername
      guestUserImage {
        ...image
      }
      calculatedRatings {
        ...calculatedRating
      }
      tags {
        ...tag
      }
      authorType
      itemID
      itemType
      title
      lead
      text
      state
      source
      rejectionReason
      createdAt
      modifiedAt
    }
    ${User.userFragment}
    ${Tag.tagFragment}
    ${CalculatedRating.calculatedRatingFragment}
    ${WepImage.wepImageFragment}
  `

  public static commentFragment = gql`
    fragment comment on Comment {
      ...commentFields
      children {
        ...commentFields
        children {
          ...commentFields
          children {
            ...commentFields
            children {
              ...commentFields
              children {
                ...commentFields
              }
            }
          }
        }
      }
    }
    ${Comment.commentFieldsFragment}
  `
}
