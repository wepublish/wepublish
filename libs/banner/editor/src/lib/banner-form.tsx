import {
  CreateBannerActionInput,
  CreateBannerInput,
  ImageRefFragment,
  UpdateBannerInput
} from '@wepublish/editor/api-v2'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate} from 'react-router-dom'
import {CheckPicker, Drawer, Form, Panel, Toggle} from 'rsuite'
import {BannerActionList} from './banner-action-list'
import {ChooseEditImage, ImageEditPanel, ImageSelectPanel} from '@wepublish/ui/editor'
import {PageRefFragment, usePageListQuery} from '@wepublish/editor/api'

type BannerFormData = (CreateBannerInput | UpdateBannerInput) & {
  image?: ImageRefFragment | null
  actions?: CreateBannerActionInput[] | null
}

interface BannerFormProps {
  create?: boolean
  banner: BannerFormData
  onChange: (banner: BannerFormData) => void
  onAddAction: (action: CreateBannerActionInput) => void
  onRemoveAction: (index: number) => void
}

export const BannerForm = (props: BannerFormProps) => {
  const navigate = useNavigate()
  const {t} = useTranslation()
  const [pages, setPages] = useState<PageRefFragment[]>([])

  const handleChange = (value: any, event: React.ChangeEvent<HTMLInputElement>) => {
    const {name} = event.target
    props.onChange({...props.banner, [name]: value})
  }

  const {
    data: pageData,
    loading: isLoadingPageData,
    error: pageLoadError
  } = usePageListQuery({
    variables: {take: 50},
    fetchPolicy: 'no-cache'
  })

  useEffect(() => {
    if (pageData?.pages?.nodes) {
      setPages(pageData.pages.nodes)
    }
  }, [pageData?.pages])

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
      <Panel bordered style={{overflow: 'initial'}}>
        <Form.Group controlId="title">
          <Form.ControlLabel>{t('banner.form.title')}</Form.ControlLabel>
          <Form.Control name="title" value={props.banner.title} onChange={handleChange} />
        </Form.Group>
        <Form.Group controlId="text">
          <Form.ControlLabel>{t('banner.form.text')}</Form.ControlLabel>
          <Form.Control name="text" value={props.banner.text} onChange={handleChange} />
        </Form.Group>
        <Form.Group controlId="cta">
          <Form.ControlLabel>{t('banner.form.cta')}</Form.ControlLabel>
          <Form.Control name="cta" value={props.banner.cta} onChange={handleChange} />
        </Form.Group>
        <Form.Group controlId="images">
          <Form.ControlLabel>{t('banner.form.image')}</Form.ControlLabel>
          <Form.Control
            name="image"
            header={''}
            image={props.banner.image}
            disabled={false}
            openChooseModalOpen={() => setChooseModalOpen(true)}
            openEditModalOpen={() => setEditModalOpen(true)}
            removeImage={() => {
              props.onChange({...props.banner, imageId: undefined, image: undefined})
            }}
            onChange={x => console.log(x)}
            accepter={ChooseEditImage}
            minHeight={200}
          />
        </Form.Group>
        <Form.Group controlId="active">
          <Form.ControlLabel>{t('banner.form.active')}</Form.ControlLabel>
          <Form.Control
            name="active"
            value={props.banner.active}
            onChange={handleChange}
            accepter={Toggle}
          />
        </Form.Group>
        <Form.Group controlId="showOnArticles">
          <Form.ControlLabel>{t('banner.form.showOnArticles')}</Form.ControlLabel>
          <Form.Control
            name="showOnArticles"
            value={props.banner.showOnArticles}
            onChange={handleChange}
            accepter={Toggle}
          />
        </Form.Group>
        <Form.Group controlId="showOnPages">
          <Form.ControlLabel>{t('banner.form.showOnPages')}</Form.ControlLabel>
          <CheckPicker
            block
            virtualized
            placeholder={t('navigation.panels.selectPage')}
            value={props.banner.showOnPages?.map(p => p.id) || []}
            data={pages.map(page => ({value: page.id!, label: page.latest.title}))}
            onChange={ids => {
              if (!ids) return
              props.onChange({
                ...props.banner,
                showOnPages: ids.map(i => {
                  return {id: i}
                })
              })
            }}
          />
        </Form.Group>
      </Panel>
      <Panel bordered style={{overflow: 'initial'}}>
        <Form.Group controlId="actions">
          <h3>{t('banner.form.actions')}</h3>
          <BannerActionList
            actions={props.banner.actions || []}
            onAdd={action =>
              props.onChange({...props.banner, actions: [...(props.banner.actions || []), action]})
            }
            onRemove={index =>
              props.onChange({
                ...props.banner,
                actions: props.banner.actions?.filter((_, i) => i !== index) || []
              })
            }
            onUpdate={(index, updatedAction) => {
              const updatedActions = props.banner.actions?.map((action, i) =>
                i === index ? updatedAction : action
              )
              props.onChange({
                ...props.banner,
                actions: updatedActions
              })
            }}
          />
        </Form.Group>
      </Panel>

      <Drawer
        open={isChooseModalOpen}
        size={'sm'}
        onClose={() => {
          setChooseModalOpen(false)
        }}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={image => {
            setChooseModalOpen(false)
            props.onChange({...props.banner, imageId: image.id})
          }}
        />
      </Drawer>

      {props.banner.imageId && (
        <Drawer open={isEditModalOpen} size={'sm'} onClose={() => setEditModalOpen(false)}>
          <ImageEditPanel id={props.banner.imageId} onClose={() => setEditModalOpen(false)} />
        </Drawer>
      )}
    </div>
  )
}