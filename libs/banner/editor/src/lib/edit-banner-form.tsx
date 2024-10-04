import {
  Banner,
  CreateBannerActionInput,
  UpdateBannerInput,
  getApiClientV2,
  useBannerQuery,
  useUpdateBannerMutation
} from '@wepublish/editor/api-v2'
import {useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {BannerForm} from './banner-form'
import {SingleViewTitle} from '@wepublish/ui/editor'
import {Form, Schema} from 'rsuite'

export const EditBannerForm = () => {
  const navigate = useNavigate()
  const {t} = useTranslation()
  const {id} = useParams()

  const closePath = '/banners'

  const [banner, setBanner] = useState<UpdateBannerInput>({
    id: '',
    title: '',
    text: '',
    cta: '',
    active: false,
    showOnArticles: false,
    tags: [],
    actions: []
  })

  const client = useMemo(() => getApiClientV2(), [])
  useBannerQuery({
    client,
    variables: {
      id: id!
    },
    skip: !id,
    onCompleted: data => {
      const {__typename, ...input} = data.banner
      setBanner(input)
    }
  })

  const {StringType, BooleanType} = Schema.Types
  const validationModel = Schema.Model({
    title: StringType().isRequired(),
    text: StringType().isRequired(),
    active: BooleanType().isRequired(),
    showOnArticles: BooleanType().isRequired()
  })

  const [shouldClose, setShouldClose] = useState(false)

  const [updateBanner, {loading}] = useUpdateBannerMutation({
    client,
    onError: () => {},
    onCompleted: banner => {
      navigate(closePath)
    }
  })

  const onSubmit = () => {
    updateBanner({variables: {input: banner}})
  }

  const handleAddAction = (action: CreateBannerActionInput) => {
    setBanner({
      ...banner,
      actions: [...(banner.actions || []), action]
    })
  }

  const handleRemoveAction = (index: number) => {
    setBanner({
      ...banner,
      actions: banner.actions?.filter((_, i) => i !== index) || []
    })
  }

  return (
    <Form
      fluid
      formValue={banner}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => /*validationPassed &&*/ onSubmit()}>
      <SingleViewTitle
        loading={loading}
        title={t('banner.edit.title')}
        loadingTitle={t('banner.edit.title')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <BannerForm
        banner={banner}
        onChange={updatedBanner => setBanner({...updatedBanner, id: banner.id})}
        onAddAction={handleAddAction}
        onRemoveAction={handleRemoveAction}
      />
    </Form>
  )
}
