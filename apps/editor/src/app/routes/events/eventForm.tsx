import {
  EventStatus,
  FullImageFragment,
  MutationCreateEventArgs,
  MutationUpdateEventArgs,
  Tag,
  TagType,
} from '@wepublish/editor/api';
import {
  ChooseEditImage,
  DateTimePicker,
  ImageEditPanel,
  ImageSelectPanel,
  RichTextBlock,
  RichTextBlockValue,
  SelectTags,
  Textarea,
} from '@wepublish/ui/editor';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer, Form, Panel, SelectPicker } from 'rsuite';

type EventFormData = (MutationCreateEventArgs | MutationUpdateEventArgs) & {
  image?: FullImageFragment | null;
  tags?: Pick<Tag, 'id' | 'tag'>[];
  externalSourceName?: string;
};

type EventFormProps = {
  create?: boolean;
  event: EventFormData;
  onChange: (changes: Partial<EventFormData>) => void;
};

export const EventForm = ({ event, onChange, create }: EventFormProps) => {
  const { t } = useTranslation();

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  return (
    <>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
      >
        <Panel
          bordered
          style={{ overflow: 'initial' }}
        >
          <Form.Group controlId="name">
            <Form.ControlLabel>{t('event.form.name')}</Form.ControlLabel>
            <Form.Control
              name="name"
              value={event.name ?? ''}
              onChange={(name: string) => onChange({ name })}
            />
          </Form.Group>

          {event.externalSourceName && (
            <Form.Group controlId="externalSourceName">
              <Form.ControlLabel>
                {t('event.form.externalSource')}
              </Form.ControlLabel>
              <Form.Control
                name="externalSourceName"
                value={event.externalSourceName ?? ''}
                disabled
              />
            </Form.Group>
          )}

          <Form.Group controlId="location">
            <Form.ControlLabel>{t('event.form.location')}</Form.ControlLabel>
            <Form.Control
              name="location"
              value={event.location ?? ''}
              onChange={(location: string) => onChange({ location })}
            />
          </Form.Group>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '20px',
            }}
          >
            <Form.Group controlId="startsAt">
              <Form.Control
                name="startsAt"
                label={t('event.form.startsAt')}
                dateTime={event.startsAt ? new Date(event.startsAt) : undefined}
                changeDate={(date: Date) =>
                  onChange({ startsAt: date?.toISOString() })
                }
                accepter={DateTimePicker}
              />
            </Form.Group>

            <Form.Group controlId="endsAt">
              <Form.Control
                name="endsAt"
                label={t('event.form.endsAt')}
                dateTime={event.endsAt ? new Date(event.endsAt) : undefined}
                changeDate={(date: Date) =>
                  onChange({ endsAt: date?.toISOString() })
                }
                accepter={DateTimePicker}
              />
            </Form.Group>
          </div>

          <Form.Group controlId="lead">
            <Form.ControlLabel>{t('event.form.lead')}</Form.ControlLabel>
            <Form.Control
              name="lead"
              rows={3}
              value={event.lead ?? ''}
              onChange={(lead: string) => onChange({ lead })}
              accepter={Textarea}
            />
          </Form.Group>

          <Form.Group controlId="description">
            <Form.ControlLabel>{t('event.form.description')}</Form.ControlLabel>
            <Panel bordered>
              <Form.Control
                name="description"
                value={event.description || []}
                onChange={(description: RichTextBlockValue['richText']) =>
                  onChange({ description })
                }
                accepter={RichTextBlock}
              />
            </Panel>
          </Form.Group>
        </Panel>

        <Panel bordered>
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
                  {
                    value: EventStatus.Scheduled,
                    label: t('event.form.scheduled'),
                  },
                  {
                    value: EventStatus.Cancelled,
                    label: t('event.form.cancelled'),
                  },
                  {
                    value: EventStatus.Postponed,
                    label: t('event.form.postponed'),
                  },
                  {
                    value: EventStatus.Rescheduled,
                    label: t('event.form.rescheduled'),
                  },
                ]}
                onChange={(status: any) =>
                  onChange({ status: status as EventStatus })
                }
              />
            </Form.Group>
          )}

          <Form.Group controlId="tagIds">
            <Form.ControlLabel>{t('event.form.tags')}</Form.ControlLabel>
            <Form.Control
              name="tagIds"
              defaultTags={event.tags ?? []}
              selectedTags={event.tagIds ?? []}
              setSelectedTags={(tagIds: string[]) => onChange({ tagIds })}
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
                onChange({ imageId: undefined, image: undefined });
              }}
              accepter={ChooseEditImage}
              minHeight={200}
            />
          </Form.Group>
        </Panel>
      </div>

      <Drawer
        open={isChooseModalOpen}
        size={'sm'}
        onClose={() => {
          setChooseModalOpen(false);
        }}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={image => {
            setChooseModalOpen(false);
            onChange({ imageId: image.id, image });
          }}
        />
      </Drawer>

      {event.imageId && (
        <Drawer
          open={isEditModalOpen}
          size={'sm'}
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={event.imageId}
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  );
};
