// import {
//   EventStatus,
//   ImageRefFragment,
//   MutationCreateEventArgs,
//   MutationUpdateEventArgs,
//   TagType
// } from '@wepublish/editor/api'
import {
  ConsentValue,
  useConsentsQuery,
  useCreateConsentMutation,
  useDeleteConsentMutation,
  MutationCreateConsentArgs,
  MutationUpdateConsentArgs
} from '@wepublish/editor/api-v2'
import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Drawer, Form, Panel, SelectPicker} from 'rsuite'

const consentValues = [
  {
    value: ConsentValue.Accepted,
    label: ConsentValue.Accepted
  },
  {
    value: ConsentValue.Rejected,
    label: ConsentValue.Rejected
  },
  {
    value: ConsentValue.Unset,
    label: ConsentValue.Unset
  }
]

// import {ChooseEditImage} from '../../atoms/chooseEditImage'
// import {DateTimePicker} from '../../atoms/dateTimePicker'
// import {SelectTags} from '../../atoms/tag/selectTags'
// import {RichTextBlock} from '../../blocks/richTextBlock/richTextBlock'
// import {RichTextBlockValue} from '../../blocks/types'
// import {ImageEditPanel} from '../../panel/imageEditPanel'
// import {ImageSelectPanel} from '../../panel/imageSelectPanel'

type ConsentFormData = MutationCreateConsentArgs['consent'] | MutationUpdateConsentArgs['consent']

type ConsentFormProps = {
  create?: boolean
  consent: ConsentFormData
  onChange: (changes: Partial<ConsentFormData>) => void
}

export const ConsentForm = ({consent, onChange, create}: ConsentFormProps) => {
  const {t} = useTranslation()

  // const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  // const [isEditModalOpen, setEditModalOpen] = useState(false)

  return (
    <>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
        <Panel bordered style={{overflow: 'initial'}}>
          <Form.Group controlId="name">
            <Form.ControlLabel>{t('event.form.name')}</Form.ControlLabel>
            <Form.Control
              name="name"
              value={consent.name ?? ''}
              onChange={(name: string) => onChange({name})}
            />
          </Form.Group>

          <Form.Group controlId="slug">
            <Form.ControlLabel>{t('event.form.slug')}</Form.ControlLabel>
            <Form.Control
              name="slug"
              value={consent.slug ?? ''}
              onChange={(slug: string) => onChange({slug})}
            />
          </Form.Group>

          <Form.Group controlId="defaultValue">
            <Form.ControlLabel>{t('event.form.defaultValue')}</Form.ControlLabel>
            {/* <Form.Control
              name="defaultValue"
              selectedTags={consent.defaultValue ?? []}
              setSelectedTags={(defaultValue: string[]) => onChange({defaultValue})}
              // tagType={TagType.Event}
              accepter={SelectTags}
            /> */}
            <SelectPicker
              key="default-value"
              placeholder={t('userSubscriptionEdit.selectMemberPlan')}
              block
              // disabled={isDisabled}
              // data={memberPlans.map(mp => ({value: mp.id, label: mp.name}))}
              data={consentValues}
              onChange={value =>
                onChange({defaultValue: consentValues.find(v => v.id === value)?.id})
              }
            />
          </Form.Group>

          {/* <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '20px'
            }}>
            <Form.Group controlId="startsAt">
              <Form.Control
                name="startsAt"
                label={t('event.form.startsAt')}
                dateTime={event.startsAt ? new Date(event.startsAt) : undefined}
                changeDate={(date: Date) => onChange({startsAt: date?.toISOString()})}
                accepter={DateTimePicker}
              />
            </Form.Group>

            <Form.Group controlId="endsAt">
              <Form.Control
                name="endsAt"
                label={t('event.form.endsAt')}
                dateTime={event.endsAt ? new Date(event.endsAt) : undefined}
                changeDate={(date: Date) => onChange({endsAt: date?.toISOString()})}
                accepter={DateTimePicker}
              />
            </Form.Group>
          </div> */}

          {/* <Form.Group controlId="description">
            <Form.ControlLabel>{t('event.form.description')}</Form.ControlLabel>
            <Panel bordered>
              <Form.Control
                name="description"
                value={event.description || []}
                onChange={(description: RichTextBlockValue) => onChange({description})}
                accepter={RichTextBlock}
              />
            </Panel>
          </Form.Group> */}
        </Panel>

        {/* <Panel bordered>
          {!create && (
            <Form.Group controlId="status">
              <Form.ControlLabel>{t('event.form.status')}</Form.ControlLabel>
              <Form.Control
                name="status"
                block
                placement="auto"
                cleanable={false}
                searchable={false}
                accepter={SelectPicker}
                value={(event as MutationUpdateEventArgs).status ?? ''}
                data={[
                  {value: EventStatus.Scheduled, label: t('event.form.scheduled')},
                  {value: EventStatus.Cancelled, label: t('event.form.cancelled')},
                  {value: EventStatus.Postponed, label: t('event.form.postponed')},
                  {value: EventStatus.Rescheduled, label: t('event.form.rescheduled')}
                ]}
                onChange={(status: any) => onChange({status: status as EventStatus})}
              />
            </Form.Group>
          )}

          <Form.Group controlId="tagIds">
            <Form.ControlLabel>{t('event.form.tags')}</Form.ControlLabel>
            <Form.Control
              name="tagIds"
              selectedTags={event.tagIds ?? []}
              setSelectedTags={(tagIds: string[]) => onChange({tagIds})}
              tagType={TagType.Event}
              accepter={SelectTags}
            />
          </Form.Group>

          <Form.Group controlId="tagIds">
            <Form.ControlLabel>{t('event.form.image')}</Form.ControlLabel>
            <Form.Control
              name="image"
              header={''}
              image={event.image}
              disabled={false}
              openChooseModalOpen={() => setChooseModalOpen(true)}
              openEditModalOpen={() => setEditModalOpen(true)}
              removeImage={() => {
                onChange({imageId: undefined, image: undefined})
              }}
              accepter={ChooseEditImage}
              minHeight={200}
            />
          </Form.Group>
        </Panel> */}
      </div>

      {/* <Drawer
        open={isChooseModalOpen}
        size={'sm'}
        onClose={() => {
          setChooseModalOpen(false)
        }}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={image => {
            setChooseModalOpen(false)
            onChange({imageId: image.id, image})
          }}
        />
      </Drawer> */}

      {/* {event.imageId && (
        <Drawer open={isEditModalOpen} size={'sm'} onClose={() => setEditModalOpen(false)}>
          <ImageEditPanel id={event.imageId} onClose={() => setEditModalOpen(false)} />
        </Drawer>
      )} */}
    </>
  )
}

{
  /* <form onSubmit={addConsent}>
        <label>
          Consent Name
          <input
            type="text"
            name="name"
            value={consentName}
            onChange={e => setConsentName(e.target.value)}
          />
        </label>
        <label>
          Consent Slug
          <input
            type="text"
            name="slug"
            value={consentSlug}
            onChange={e => setConsentSlug(e.target.value)}
          />
        </label>
        <label>
          Consent Default Value
          <select
            name="defaultValue"
            value={consentDefaultValue}
            onChange={e => setConsentDefaultValue(e.target.value as ConsentValue)}>
            <option value={ConsentValue.Accepted}>{ConsentValue.Accepted}</option>
            <option value={ConsentValue.Rejected}>{ConsentValue.Rejected}</option>
            <option value={ConsentValue.Unset}>{ConsentValue.Unset}</option>
          </select>
        </label>

        <button
          type="submit"
          onClick={e => {
            e.preventDefault()
            addConsent()
          }}>
          Submit
        </button>
      </form> */
}
