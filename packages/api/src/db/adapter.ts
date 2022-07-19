import {DBUserAdapter} from './user'
import {DBSessionAdapter} from './session'
import {DBNavigationAdapter} from './navigation'
import {DBAuthorAdapter} from './author'
import {DBImageAdapter} from './image'
import {DBArticleAdapter} from './article'
import {DBCommentAdapter} from './comment'
import {DBPageAdapter} from './page'
import {DBPeerAdapter} from './peer'
import {DBTokenAdapter} from './token'
import {DBUserRoleAdapter} from './userRole'
import {DBMemberPlanAdapter} from './memberPlan'
import {DBPaymentMethodAdapter} from './paymentMethod'
import {DBInvoiceAdapter} from './invoice'
import {DBPaymentAdapter} from './payment'
import {DBMailLogAdapter} from './mailLog'
import {DBSubscriptionAdapter} from './subscription'
import {DBSettingAdapter} from './setting'

export interface DBAdapter {
  readonly peer: DBPeerAdapter
  readonly user: DBUserAdapter
  readonly subscription: DBSubscriptionAdapter
  readonly userRole: DBUserRoleAdapter
  readonly session: DBSessionAdapter
  readonly token: DBTokenAdapter
  readonly navigation: DBNavigationAdapter
  readonly author: DBAuthorAdapter
  readonly image: DBImageAdapter
  readonly article: DBArticleAdapter
  readonly comment: DBCommentAdapter
  readonly page: DBPageAdapter
  readonly memberPlan: DBMemberPlanAdapter
  readonly paymentMethod: DBPaymentMethodAdapter
  readonly invoice: DBInvoiceAdapter
  readonly payment: DBPaymentAdapter
  readonly mailLog: DBMailLogAdapter
  readonly setting: DBSettingAdapter
}
