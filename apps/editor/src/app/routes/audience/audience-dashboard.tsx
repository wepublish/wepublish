import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader
} from '@wepublish/ui/editor'
import {useTranslation} from 'react-i18next'

function AudienceDashboard() {
  const {t} = useTranslation()

  return (
    <ListViewContainer>
      <ListViewHeader>
        <h2>{t('audienceDashboard.title')}</h2>
      </ListViewHeader>
    </ListViewContainer>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent(['CAN_GET_AUDIENCE_STATS'])(
  AudienceDashboard
)
export {CheckedPermissionComponent as AudienceDashboard}
