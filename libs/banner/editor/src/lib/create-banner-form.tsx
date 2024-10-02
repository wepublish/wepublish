import {
  Banner,
  CreateBannerActionInput,
  CreateBannerInput,
  getApiClientV2,
  useCreateBannerMutation
} from '@wepublish/editor/api-v2'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate} from 'react-router-dom'
import {BannerForm} from './banner-form'
import {SingleViewTitle} from '@wepublish/ui/editor'
import {Form, Schema} from 'rsuite'

export const CreateBannerForm = () => {
  const navigate = useNavigate()
  const {t} = useTranslation()

  const closePath = '/banners'

  const [banner, setBanner] = useState<CreateBannerInput>({
    title: '',
    text: '',
    active: false,
    showOnArticles: false,
    tags: []
  })

  const {StringType, BooleanType} = Schema.Types
  const validationModel = Schema.Model({
    title: StringType().isRequired(),
    text: StringType().isRequired(),
    active: BooleanType().isRequired(),
    showOnArticles: BooleanType().isRequired()
  })

  const [shouldClose, setShouldClose] = useState(false)

  const client = useMemo(() => getApiClientV2(), [])
  const [createBanner, {loading}] = useCreateBannerMutation({
    client,
    onError: () => {},
    onCompleted: banner => {
      navigate(closePath)
    }
  })

  const onSubmit = () => {
    createBanner({variables: {input: banner}})
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
        title={t('banner.create.title')}
        loadingTitle={t('banner.create.title')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <BannerForm
        banner={banner}
        onChange={banner => setBanner(banner)}
        onAddAction={handleAddAction}
        onRemoveAction={handleRemoveAction}
      />
    </Form>
  )
}
