import React, {useState} from 'react'
import {SingleView} from '../../../../../ui/src/lib/singleView/singleView'
import {SingleViewTitle} from '../../../../../ui/src/lib/singleView/singleViewTitle'
import {SingleViewContent} from '../../../../../ui/src/lib/singleView/singleViewContent'
import {useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'

// todo: create re-usable single view components

export default function MemberPlanEdit() {
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
        loadingTitle="Laden..."
        title={t('memberPlanEdit.title')}
        saveBtnTitle={t('memberPlanEdit.saveBtnTitle')}
        saveAndCloseBtnTitle={t('memberPlanEdit.saveAndCloseBtnTitle')}
        closePath={closePath}
        setCloseFn={() => close()}
      />
      <SingleViewContent>Hier kommt der Inhalt</SingleViewContent>
    </SingleView>
  )
}
