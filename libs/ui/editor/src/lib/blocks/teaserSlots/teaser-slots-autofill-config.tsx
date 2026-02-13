'use client';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  TagType,
  TeaserSlotsAutofillConfigInput,
  TeaserType,
} from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, SelectPicker } from 'rsuite';

import { SelectTags } from '../../atoms/tag/selectTags';
import { useTeaserTypeText } from '../../panel/teaserListConfigPanel';

interface TeaserSlotsConfigPanelProps {
  config: TeaserSlotsAutofillConfigInput;
  onChange: (config: TeaserSlotsAutofillConfigInput) => void;
}

const ConfigContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled(Form.Group)`
  margin-bottom: 12px;
`;

const HelpText = styled('div')`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
`;

const inputStyles = css`
  width: 100%;
`;

export function TeaserSlotsAutofillConfigPanel({
  config,
  onChange,
}: TeaserSlotsConfigPanelProps) {
  const [teaserType, setTeaserType] = useState(config.teaserType);
  const { t } = useTranslation();
  const teaserTypeText = useTeaserTypeText();

  const handleChange = (
    partialConfig: Partial<TeaserSlotsAutofillConfigInput>
  ) => {
    onChange({
      ...config,
      ...partialConfig,
    });
  };

  const handleTeaserTypeChange = (value: TeaserType) => {
    setTeaserType(value);
    handleChange({
      filter: {
        tags: [],
      },
      teaserType: value,
    });
  };

  const tagType = useMemo(() => {
    switch (teaserType) {
      case TeaserType.Article:
        return TagType.Article;
      case TeaserType.Page:
        return TagType.Page;
      case TeaserType.Event:
        return TagType.Event;
      default:
        return undefined;
    }
  }, [teaserType]);

  const sortOptions = [{ label: 'Published date', value: 'PublishedAt' }];

  return (
    <ConfigContainer>
      <FormGroup>
        <Form.ControlLabel>
          {t('blocks.teaserSlots.autofillType')}
        </Form.ControlLabel>
        <SelectPicker
          name="teaserType"
          cleanable={false}
          value={teaserType}
          onChange={value => handleTeaserTypeChange(value!)}
          data={[
            {
              label: teaserTypeText(TeaserType.Article),
              value: TeaserType.Article,
            },
            {
              label: teaserTypeText(TeaserType.Event),
              value: TeaserType.Event,
            },
            /*
            not supported yet
            {
              label: teaserTypeText(TeaserType.Page),
              value: TeaserType.Page,
            },
            */
          ]}
          css={inputStyles}
        />
      </FormGroup>
      {tagType && (
        <FormGroup>
          <Form.ControlLabel>
            {t('blocks.teaserSlots.filter')}
          </Form.ControlLabel>
          <SelectTags
            defaultTags={[]}
            name="tags"
            tagType={tagType}
            setSelectedTags={tags => handleChange({ filter: { tags } })}
            selectedTags={config.filter?.tags}
          />
          <HelpText>{t('blocks.teaserSlots.filterHelpText')}</HelpText>
        </FormGroup>
      )}
    </ConfigContainer>
  );
}
