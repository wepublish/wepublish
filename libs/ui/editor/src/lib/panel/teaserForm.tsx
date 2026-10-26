import styled from '@emotion/styled';
import {
  Checkbox,
  Chip,
  Drawer,
  FormControlLabel,
  FormHelperText,
  TextField,
  Typography,
} from '@mui/material';
import { FullImageFragment, TeaserType } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChooseEditImage } from '../atoms/chooseEditImage';
import { ListInput, ListValue } from '../atoms/listInput';
import { Teaser } from '../blocks/types';
import { DRAWER_WIDTHS } from '../drawer';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';

export interface TeaserMetadataProperty {
  id?: string | null;
  key: string;
  value: string;
  public: boolean;
}

export type TeaserFormValues = {
  preTitle?: string | null;
  title?: string | null;
  lead?: string | null;
  image?: FullImageFragment | null;
  contentUrl?: string | null;
  openInNewTab?: boolean | null;
  properties: ListValue<TeaserMetadataProperty>[];
};

type OriginalTeaser = {
  preTitle?: string | null;
  title?: string | null;
  lead?: string | null;
  image?: FullImageFragment | null;
};

export const originalForTeaser = (teaser: Teaser): OriginalTeaser => {
  switch (teaser.type) {
    case TeaserType.Article:
      return {
        preTitle: teaser.article?.latest.preTitle,
        title: teaser.article?.latest.title,
        lead: teaser.article?.latest.lead,
        image: teaser.article?.latest.image as FullImageFragment | undefined,
      };

    case TeaserType.Page:
      return {
        title: teaser.page?.latest.title,
        lead: teaser.page?.latest.description,
        image: teaser.page?.latest.image as FullImageFragment | undefined,
      };

    case TeaserType.Event:
      return {
        title: teaser.event?.name,
        lead: teaser.event?.lead || teaser.event?.location,
        image: teaser.event?.image as FullImageFragment | undefined,
      };

    default:
      return {};
  }
};

const Form = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const Section = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

const SectionHeader = styled('header')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.25)};
`;

const Preview = styled('div')`
  position: relative;
  display: grid;
  align-items: end;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
  background-size: cover;
  background-position: center;

  &:not([style]) {
    aspect-ratio: auto;
    min-height: ${({ theme }) => theme.spacing(16)};
    color: ${({ theme }) => theme.vars.palette.text.primary};
  }

  &:not([style]) > div:last-of-type {
    color: inherit;
    background: none;
  }
`;

const PreviewText = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(2)};
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8) 40%);
`;

const PreviewType = styled(Chip)`
  position: absolute;
  top: ${({ theme }) => theme.spacing(1)};
  left: ${({ theme }) => theme.spacing(1)};
  color: #fff;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
`;

const PropertyRow = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) max-content;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
`;

export type TeaserFormProps = {
  teaser: Teaser;
  values: TeaserFormValues;
  onChange: (patch: Partial<TeaserFormValues>) => void;
};

export function TeaserForm({ teaser, values, onChange }: TeaserFormProps) {
  const { t } = useTranslation();
  const [isChooseImageOpen, setChooseImageOpen] = useState(false);
  const [isEditImageOpen, setEditImageOpen] = useState(false);

  const original = originalForTeaser(teaser);
  const isCustom = teaser.type === TeaserType.Custom;
  const image = values.image ?? original.image;

  const preview = {
    preTitle: values.preTitle || original.preTitle,
    title: values.title || original.title,
    lead: values.lead || original.lead,
  };

  return (
    <Form>
      <Preview
        style={
          image?.largeURL ?
            { backgroundImage: `url(${image.largeURL})` }
          : undefined
        }
      >
        <PreviewType
          size="small"
          label={t(`resources.teaserType.${teaser.type.toLowerCase()}`)}
        />

        <PreviewText>
          {preview.preTitle && (
            <Typography
              variant="caption"
              color="inherit"
            >
              {preview.preTitle}
            </Typography>
          )}
          <Typography
            variant="subtitle1"
            color="inherit"
          >
            {preview.title || t('articleEditor.panels.untitled')}
          </Typography>
          {preview.lead && (
            <Typography
              variant="body2"
              color="inherit"
              sx={{ opacity: 0.8 }}
            >
              {preview.lead}
            </Typography>
          )}
        </PreviewText>
      </Preview>

      <Section>
        <SectionHeader>
          <Typography
            variant="subtitle2"
            component="h3"
          >
            {t('articleEditor.panels.displayOptions')}
          </Typography>
          {!isCustom && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {t('articleEditor.panels.displayOptionsHint')}
            </Typography>
          )}
        </SectionHeader>

        <TextField
          label={t('articleEditor.panels.preTitle')}
          value={values.preTitle ?? ''}
          placeholder={original.preTitle ?? undefined}
          onChange={event => onChange({ preTitle: event.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label={t('articleEditor.panels.title')}
          value={values.title ?? ''}
          placeholder={original.title ?? undefined}
          onChange={event => onChange({ title: event.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label={t('articleEditor.panels.lead')}
          value={values.lead ?? ''}
          placeholder={original.lead ?? undefined}
          onChange={event => onChange({ lead: event.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
          multiline
          minRows={2}
        />
      </Section>

      <Section>
        <Typography
          variant="subtitle2"
          component="h3"
        >
          {t('articleEditor.panels.image')}
        </Typography>

        <ChooseEditImage
          image={values.image}
          disabled={false}
          maxHeight={180}
          onSelect={selected => onChange({ image: selected })}
          openChooseModalOpen={() => setChooseImageOpen(true)}
          openEditModalOpen={() => setEditImageOpen(true)}
          removeImage={() => onChange({ image: null })}
        />
      </Section>

      {isCustom && (
        <Section>
          <TextField
            label={t('articleEditor.panels.contentUrl')}
            value={values.contentUrl ?? ''}
            onChange={event => onChange({ contentUrl: event.target.value })}
            helperText={t('articleEditor.panels.contentUrlInfo')}
          />

          <FormControlLabel
            sx={{ justifySelf: 'start' }}
            control={
              <Checkbox
                checked={!!values.openInNewTab}
                onChange={(_event, openInNewTab) => onChange({ openInNewTab })}
              />
            }
            label={t('articleEditor.panels.openInNewTab')}
          />
        </Section>
      )}

      {isCustom && (
        <Section>
          <SectionHeader>
            <Typography
              variant="subtitle2"
              component="h3"
            >
              {t('articleEditor.panels.properties')}
            </Typography>
            <FormHelperText sx={{ m: 0 }}>
              {t('articleEditor.panels.teaserPropertiesInfo')}
            </FormHelperText>
          </SectionHeader>

          <ListInput
            value={values.properties}
            onChange={properties => onChange({ properties })}
            defaultValue={{ key: '', value: '', public: true }}
          >
            {({ value, onChange: onPropertyChange }) => (
              <PropertyRow>
                <TextField
                  label={t('articleEditor.panels.key')}
                  value={value.key}
                  onChange={event =>
                    onPropertyChange({ ...value, key: event.target.value })
                  }
                />

                <TextField
                  label={t('articleEditor.panels.value')}
                  value={value.value}
                  onChange={event =>
                    onPropertyChange({ ...value, value: event.target.value })
                  }
                />

                <FormControlLabel
                  sx={{ m: 0 }}
                  control={
                    <Checkbox
                      checked={value.public}
                      onChange={(_event, isPublic) =>
                        onPropertyChange({ ...value, public: isPublic })
                      }
                    />
                  }
                  label={t('articleEditor.panels.public')}
                />
              </PropertyRow>
            )}
          </ListInput>
        </Section>
      )}

      <Drawer
        anchor="right"
        slotProps={{
          paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
        }}
        open={isChooseImageOpen}
        onClose={() => setChooseImageOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseImageOpen(false)}
          onSelect={selected => {
            setChooseImageOpen(false);
            onChange({ image: selected });
          }}
        />
      </Drawer>

      {values.image && (
        <Drawer
          anchor="right"
          slotProps={{
            paper: {
              sx: {
                display: 'flex',
                flexDirection: 'column',
                width: DRAWER_WIDTHS.sm,
                maxWidth: '100vw',
              },
            },
          }}
          open={isEditImageOpen}
          onClose={() => setEditImageOpen(false)}
        >
          <ImageEditPanel
            id={values.image.id}
            onClose={() => setEditImageOpen(false)}
          />
        </Drawer>
      )}
    </Form>
  );
}
