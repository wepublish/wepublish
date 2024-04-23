import {gql} from 'graphql-tag'
import AvailablePaymentMethods from '~/sdk/wep/models/paymentMethod/AvailablePaymentMethods'
import AvailablePaymentMethod from '~/sdk/wep/models/paymentMethod/AvailablePaymentMethod'
import Slate, {SlateNode} from '~/sdk/wep/classes/Slate'
import WepImage from '~/sdk/wep/models/image/WepImage'

export default class MemberPlan {
  public id: string
  public slug: string
  public image?: WepImage
  public name: string
  public description: SlateNode[]
  public amountPerMonthMin: number
  public availablePaymentMethods: AvailablePaymentMethods
  public tags?: string[]
  public maxCount?: number
  public extendable: boolean

  constructor({
    id,
    slug,
    image,
    name,
    description,
    amountPerMonthMin,
    availablePaymentMethods,
    tags,
    maxCount,
    extendable
  }: {
    id: string
    slug: string
    image?: WepImage
    name: string
    description: SlateNode[]
    amountPerMonthMin: number
    availablePaymentMethods: AvailablePaymentMethods | AvailablePaymentMethod[]
    tags?: string[]
    maxCount?: number
    extendable: boolean
  }) {
    this.id = id
    this.slug = slug
    this.image = image ? new WepImage(image) : undefined
    this.name = name
    this.description = description
    this.amountPerMonthMin = amountPerMonthMin
    this.availablePaymentMethods =
      availablePaymentMethods instanceof AvailablePaymentMethods
        ? availablePaymentMethods
        : new AvailablePaymentMethods().parseApiData(availablePaymentMethods)
    this.tags = tags
    this.maxCount = maxCount
    this.extendable = extendable
  }

  public getAvailablePaymentMethods(): AvailablePaymentMethods {
    return this.availablePaymentMethods
  }

  public getHtmlOfDescription(
    {fontClassHeadings}: {fontClassHeadings: string} = {fontClassHeadings: ''}
  ): string {
    return new Slate({fontClassHeadings}).toHtml(this.description)
  }

  public hasTag(findTag) {
    return !!this.tags?.find(tag => tag === findTag)
  }

  /**
   * Returns a sort order, implemented by tags.
   * To influence the sort order of a member plan, it has to contain a tag like sort-order:n
   */
  public getSortOrder() {
    const sortOrderIdentifier = 'sort-order:'
    const sortOrderTag = this.tags
      ?.find(tag => tag.startsWith(sortOrderIdentifier))
      ?.split(sortOrderIdentifier)
    if (sortOrderTag?.length === 2) {
      return parseInt(sortOrderTag[1])
    }
    return 0
  }

  public static memberPlanFragment = gql`
    fragment memberPlan on MemberPlan {
      id
      name
      slug
      description
      amountPerMonthMin
      image {
        ...image
      }
      availablePaymentMethods {
        ...availablePaymentMethod
      }
      tags
      maxCount
      extendable
    }
    ${AvailablePaymentMethod.availablePaymentMethodFragment}
    ${WepImage.wepImageFragment}
  `
}
