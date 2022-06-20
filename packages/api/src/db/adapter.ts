import {DBUserAdapter} from './user'
import {DBImageAdapter} from './image'
import {DBArticleAdapter} from './article'
import {DBCommentAdapter} from './comment'
import {DBPageAdapter} from './page'
import {DBPeerAdapter} from './peer'
import {DBMemberPlanAdapter} from './memberPlan'
import {DBPaymentMethodAdapter} from './paymentMethod'
import {DBPaymentAdapter} from './payment'
import {DBSubscriptionAdapter} from './subscription'

export interface DBAdapter {
  readonly peer: DBPeerAdapter
  readonly user: DBUserAdapter
  readonly subscription: DBSubscriptionAdapter
  readonly image: DBImageAdapter
  readonly article: DBArticleAdapter
  readonly comment: DBCommentAdapter
  readonly page: DBPageAdapter
  readonly memberPlan: DBMemberPlanAdapter
  readonly paymentMethod: DBPaymentMethodAdapter
  readonly payment: DBPaymentAdapter
}
