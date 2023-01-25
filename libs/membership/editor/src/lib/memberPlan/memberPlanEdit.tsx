import React, {useState} from 'react'
import {SingleView} from '../../../../../ui/src/lib/singleView/singleView'
import {SingleViewTitle} from '../../../../../ui/src/lib/singleView/singleViewTitle'
import {SingleViewContent} from '../../../../../ui/src/lib/singleView/singleViewContent'
import {useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {Card, CardContent, CardHeader, Grid} from '@mui/material'
import {createCheckedPermissionComponent} from '../../../../../../apps/editor/src/app/atoms/permissionControl'

function MemberPlanEdit() {
  const navigate = useNavigate()
  const {t} = useTranslation()

  const [loading, setLoading] = useState<boolean>(false)

  const closePath = '/memberplans'

  function close() {
    navigate(closePath)
  }

  return (
    <SingleView>
      <SingleViewTitle
        loading={loading}
        loadingTitle={t('memberPlanEdit.loadingTitle')}
        title={t('memberPlanEdit.title')}
        saveBtnTitle={t('memberPlanEdit.saveBtnTitle')}
        saveAndCloseBtnTitle={t('memberPlanEdit.saveAndCloseBtnTitle')}
        closePath={closePath}
        setCloseFn={() => close()}
      />
      <SingleViewContent>
        <Grid container>
          <Grid xs={6}>
            <Card variant="outlined">
              <CardHeader title={'Titel'} />
              <CardContent>Inhalt</CardContent>
            </Card>
          </Grid>
        </Grid>
      </SingleViewContent>
    </SingleView>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MEMBER_PLANS',
  'CAN_GET_MEMBER_PLAN',
  'CAN_CREATE_MEMBER_PLAN',
  'CAN_DELETE_MEMBER_PLAN'
])(MemberPlanEdit)
export {CheckedPermissionComponent as MemberPlanEdit}
