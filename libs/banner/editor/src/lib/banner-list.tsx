import {createCheckedPermissionComponent} from '@wepublish/ui/editor'

function BannerList() {
  return <h1>Test</h1>
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_BANNERS',
  'CAN_GET_BANNER',
  'CAN_CREATE_BANNER',
  'CAN_DELETE_BANNER'
])(BannerList)
export {CheckedPermissionComponent as BannerList}
