import React from 'react';
import styled from '@emotion/styled';
import {
  CreateBannerActionInput,
  CreateBannerInput,
  FullImageFragment,
  UpdateBannerInput,
  usePageListQuery,
  LoginStatus,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckPicker,
  Drawer,
  Form,
  Input,
  Panel,
  RadioGroup,
  Toggle,
  Radio,
  NumberInput,
} from 'rsuite';
import { BannerActionList } from './banner-action-list';
import {
  ChooseEditImage,
  ImageEditPanel,
  ImageSelectPanel,
} from '@wepublish/ui/editor';

type BannerFormData = (CreateBannerInput | UpdateBannerInput) & {
  image?: FullImageFragment | null;
  actions?: CreateBannerActionInput[] | null;
};

interface BannerFormProps {
  create?: boolean;
  banner: BannerFormData;
  onChange: (banner: BannerFormData) => void;
  onAddAction: (action: CreateBannerActionInput) => void;
  onRemoveAction: (index: number) => void;
}

const BannerFormContainer = styled('div')`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  grid-template-areas:
    'displayoptions content'
    'actions        actions';
`;

export const BannerForm = (props: BannerFormProps) => {
  const { t } = useTranslation();

  const { data: pageData } = usePageListQuery({
    variables: { take: 50 },
  });

  const pages = pageData?.pages.nodes ?? [];
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  return (
    <BannerFormContainer>
      <Panel
        bordered
        style={{ overflow: 'initial', gridArea: 'displayoptions' }}
      >
        <h3>{t('banner.form.displayOptions')}</h3>

        <Form.Group controlId="active">
          <Form.Label>{t('banner.form.active')}</Form.Label>

          <Form.Control
            name="active"
            value={props.banner.active}
            onChange={value =>
              props.onChange({ ...props.banner, active: value })
            }
            accepter={Toggle}
          />
        </Form.Group>

        <Form.Group controlId="collapsible">
          <Form.Label>{t('banner.form.collapsible')}</Form.Label>

          <Form.Control
            name="collapsible"
            value={props.banner.collapsible}
            onChange={value =>
              props.onChange({ ...props.banner, collapsible: value })
            }
            accepter={Toggle}
          />
        </Form.Group>

        <Form.Group controlId="delay">
          <Form.Label>{t('banner.form.delay')}</Form.Label>

          <Form.Control
            name="delay"
            accepter={NumberInput}
            value={props.banner.delay}
            onChange={v => props.onChange({ ...props.banner, delay: +v })}
          />
        </Form.Group>

        <Form.Group controlId="hideForMinutes">
          <Form.Label>{t('banner.form.hideForMinutes')}</Form.Label>

          <Form.Control
            name="hideForMinutes"
            accepter={NumberInput}
            value={props.banner.hideForMinutes}
            onChange={v =>
              props.onChange({ ...props.banner, hideForMinutes: +v })
            }
          />
        </Form.Group>

        <Form.Group controlId="showForLoginStatus">
          <Form.Label>{t('banner.form.showForLoginStatus')}</Form.Label>

          <RadioGroup
            name="showForLoginStatus"
            value={props.banner.showForLoginStatus}
            onChange={value =>
              props.onChange({
                ...props.banner,
                showForLoginStatus: value as LoginStatus,
              })
            }
          >
            {Object.values(LoginStatus).map((status: LoginStatus) => (
              <Radio
                key={status}
                value={status}
              >
                {t(`banner.form.loginStatus.${status}`)}
              </Radio>
            ))}
          </RadioGroup>
        </Form.Group>

        <Form.Group controlId="showOnArticles">
          <Form.Label>{t('banner.form.showOnArticles')}</Form.Label>

          <Form.Control
            name="showOnArticles"
            value={props.banner.showOnArticles}
            onChange={value =>
              props.onChange({ ...props.banner, showOnArticles: value })
            }
            accepter={Toggle}
          />
        </Form.Group>

        <Form.Group controlId="showOnPages">
          <Form.Label>{t('banner.form.showOnPages')}</Form.Label>

          <CheckPicker
            block
            virtualized
            placeholder={t('navigation.panels.selectPage')}
            value={props.banner.showOnPages?.map(p => p.id) || []}
            data={pages.map(page => ({
              value: page.id,
              label: page.latest.title,
            }))}
            onChange={ids => {
              if (!ids) return;
              props.onChange({
                ...props.banner,
                showOnPages: ids.map(i => {
                  return { id: i };
                }),
              });
            }}
          />
        </Form.Group>
      </Panel>

      <Panel
        bordered
        style={{ overflow: 'initial', gridArea: 'content' }}
      >
        <h3>Inhalt</h3>

        <Form.Group controlId="title">
          <Form.Label>{t('banner.form.title')}</Form.Label>

          <Form.Control
            name="title"
            value={props.banner.title}
            onChange={value =>
              props.onChange({ ...props.banner, title: value })
            }
          />
        </Form.Group>

        <Form.Group controlId="text">
          <Form.Label>{t('banner.form.text')}</Form.Label>

          <Form.Control
            name="text"
            componentClass="textarea"
            rows={5}
            value={props.banner.text}
            onChange={value => props.onChange({ ...props.banner, text: value })}
          />
        </Form.Group>

        <Form.Group controlId="cta">
          <Form.Label>{t('banner.form.cta')}</Form.Label>

          <Form.Control
            name="cta"
            value={props.banner.cta}
            onChange={value => props.onChange({ ...props.banner, cta: value })}
          />
        </Form.Group>

        <Form.Group controlId="images">
          <Form.Label>{t('banner.form.image')}</Form.Label>

          <Form.Control
            name="image"
            header={''}
            image={props.banner.image}
            disabled={false}
            openChooseModalOpen={() => setChooseModalOpen(true)}
            openEditModalOpen={() => setEditModalOpen(true)}
            removeImage={() => {
              props.onChange({
                ...props.banner,
                imageId: undefined,
                image: undefined,
              });
            }}
            accepter={ChooseEditImage}
            minHeight={200}
          />
        </Form.Group>

        <Form.Group controlId="html">
          <Form.Label>{t('banner.form.html')}</Form.Label>

          <Input
            name="html"
            as="textarea"
            rows={5}
            value={props.banner.html ?? undefined}
            onChange={value => props.onChange({ ...props.banner, html: value })}
          />
        </Form.Group>
      </Panel>

      <Panel
        bordered
        style={{ overflow: 'initial', gridArea: 'actions' }}
      >
        <Form.Group controlId="actions">
          <h3>{t('banner.form.actions')}</h3>
          <BannerActionList
            actions={props.banner.actions || []}
            onAdd={action =>
              props.onChange({
                ...props.banner,
                actions: [...(props.banner.actions || []), action],
              })
            }
            onRemove={index =>
              props.onChange({
                ...props.banner,
                actions:
                  props.banner.actions?.filter((_, i) => i !== index) || [],
              })
            }
            onUpdate={(index, updatedAction) => {
              const updatedActions = props.banner.actions?.map((action, i) =>
                i === index ? updatedAction : action
              );
              props.onChange({
                ...props.banner,
                actions: updatedActions,
              });
            }}
          />
        </Form.Group>
      </Panel>

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
            props.onChange({ ...props.banner, imageId: image.id, image });
          }}
        />
      </Drawer>

      {props.banner.imageId && (
        <Drawer
          open={isEditModalOpen}
          size={'sm'}
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={props.banner.imageId}
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </BannerFormContainer>
  );
};
