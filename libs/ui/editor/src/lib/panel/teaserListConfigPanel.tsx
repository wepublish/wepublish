import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { TagType } from '@wepublish/editor/api-v2';
import { TeaserListBlockSort, TeaserType } from '@wepublish/editor/api-v2';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Drawer, Form, Schema, SelectPicker } from 'rsuite';

import { SelectTags } from '../atoms/tag/selectTags';
import { TeaserListBlockValue } from '../blocks/types';

const DrawerBody = styled(Drawer.Body)`
  padding: 24px;
`;

const inputStyles = css`
  width: 200px !important;
`;

export type TeaserListConfigPanelProps = {
  value: TeaserListBlockValue;
  onClose(): void;
  onSelect(newValue: TeaserListBlockValue): void;
};

export const useTeaserTypeText = () => {
  const { t } = useTranslation();

  return (tagType: TeaserType) => t(`resources.teaserType.${tagType}`);
};

export function TeaserListConfigPanel({
  value,
  onClose,
  onSelect,
}: TeaserListConfigPanelProps) {
  const previousType = useRef<TeaserType>();
  const [tagFilter, setTagFilter] = useState(value.filter.tags ?? []);
  const [take, setTake] = useState(value.take);
  const [skip, setSkip] = useState(value.skip);
  const [sort, setSort] = useState(value.sort);
  const [teaserType, setTeaserType] = useState(value.teaserType);
  const { t } = useTranslation();
  const teaserTypeText = useTeaserTypeText();

  const { NumberType, StringType } = Schema.Types;
  const validationModel = Schema.Model({
    skip: NumberType().min(0).isRequired(),
    take: NumberType().min(0).max(100).isRequired(),
    teaserType: StringType()
      .isOneOf([TeaserType.Article, TeaserType.Page, TeaserType.Event])
      .isRequired(),
  });

  const tagType = useMemo(() => {
    switch (teaserType) {
      case TeaserType.Article:
        return TagType.Article;
      case TeaserType.Page:
        return TagType.Page;
      case TeaserType.Event:
        return TagType.Event;
    }

    throw new Error('Somehow an unsupported teaser type was selected');
  }, [teaserType]);

  useEffect(() => {
    if (previousType.current && previousType.current !== teaserType) {
      setTagFilter([]);
      setSort(TeaserListBlockSort.PublishedAt);
    }

    previousType.current = teaserType;
  }, [teaserType]);

  return (
    <Form
      formValue={{ tagFilter, skip, take, sort, teaserType }}
      model={validationModel}
      onSubmit={validationPassed =>
        validationPassed &&
        onSelect({
          ...value,
          filter: { ...value.filter, tags: tagFilter },
          skip,
          sort,
          take,
          teaserType,
        })
      }
    >
      <Drawer.Header>
        <Drawer.Title>{t('blocks.teaserList.edit')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'ghost'}
            onClick={() => onClose()}
            type="button"
          >
            {t('close')}
          </Button>

          <Button
            appearance={'primary'}
            type="submit"
          >
            {t('saveAndClose')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <DrawerBody>
        <Form.Group controlId="teaserType">
          <Form.ControlLabel>
            {t('blocks.teaserList.teaserTypeLabel')}
          </Form.ControlLabel>

          <SelectPicker
            name="teaserType"
            cleanable={false}
            value={teaserType}
            onChange={value => setTeaserType(value!)}
            data={[
              {
                label: teaserTypeText(TeaserType.Article),
                value: TeaserType.Article,
              },
              {
                label: teaserTypeText(TeaserType.Event),
                value: TeaserType.Event,
              },
              {
                label: teaserTypeText(TeaserType.Page),
                value: TeaserType.Page,
              },
            ]}
            css={inputStyles}
          />
        </Form.Group>

        <Form.Group controlId="sort">
          <Form.ControlLabel>
            {t('blocks.teaserList.sortLabel')}
          </Form.ControlLabel>

          <SelectPicker
            name="sort"
            cleanable={false}
            value={sort}
            defaultValue={TeaserListBlockSort.PublishedAt}
            onChange={value => setSort(value!)}
            data={[
              {
                label: t(
                  `resources.teaserSort.${TeaserListBlockSort.PublishedAt}`
                ),
                value: TeaserListBlockSort.PublishedAt,
              },
              {
                label: t(
                  `resources.teaserSort.${TeaserListBlockSort.UpdatedAt}`
                ),
                value: TeaserListBlockSort.UpdatedAt,
              },
              ...(teaserType === TeaserType.Article ?
                [
                  {
                    label: t(
                      `resources.teaserSort.${TeaserListBlockSort.HotAndTrending}`
                    ),
                    value: TeaserListBlockSort.HotAndTrending,
                  },
                ]
              : []),
            ]}
            css={inputStyles}
          />
        </Form.Group>

        <Form.Group controlId="skip">
          <Form.ControlLabel>
            {t('blocks.teaserList.skipLabel')}
          </Form.ControlLabel>

          <Form.Control
            name="skip"
            type="number"
            value={skip}
            onChange={s => setSkip(+s)}
            css={inputStyles}
          />
        </Form.Group>

        <Form.Group controlId="take">
          <Form.ControlLabel>
            {t('blocks.teaserList.takeLabel')}
          </Form.ControlLabel>

          <Form.Control
            name="take"
            type="number"
            value={take}
            onChange={t => setTake(+t)}
            css={inputStyles}
          />
        </Form.Group>

        {sort !== TeaserListBlockSort.HotAndTrending && (
          <Form.Group controlId="tags">
            <Form.ControlLabel>
              {t('blocks.teaserList.tagsLabel')}
            </Form.ControlLabel>

            <SelectTags
              defaultTags={value.filter.tagObjects}
              name="tags"
              tagType={tagType}
              setSelectedTags={setTagFilter}
              selectedTags={tagFilter}
              css={inputStyles}
            />
          </Form.Group>
        )}
      </DrawerBody>
    </Form>
  );
}
