'use client';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, FormLabel, MenuItem, TextField } from '@mui/material';
import {
  TagType,
  TeaserSlotsAutofillConfigInput,
  TeaserType,
} from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SelectTags } from '../../atoms/tag/selectTags';
import { useTeaserTypeText } from '../../panel/teaserListConfigPanel';

interface TeaserSlotsConfigPanelProps {
  config: TeaserSlotsAutofillConfigInput;
  onChange: (config: TeaserSlotsAutofillConfigInput) => void;
}

const ConfigContainer = styled('form')`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled(Box)`
  margin-bottom: 12px;
`;

const HelpText = styled('div')`
  font-size: 12px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
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
        <FormLabel>{t('blocks.teaserSlots.autofillType')}</FormLabel>
        <TextField
          select
          name="teaserType"
          value={teaserType}
          onChange={event =>
            handleTeaserTypeChange(event.target.value as TeaserType)
          }
          fullWidth
          css={inputStyles}
        >
          <MenuItem value={TeaserType.Article}>
            {teaserTypeText(TeaserType.Article)}
          </MenuItem>

          <MenuItem value={TeaserType.Event}>
            {teaserTypeText(TeaserType.Event)}
          </MenuItem>
        </TextField>
      </FormGroup>

      {tagType && (
        <FormGroup>
          <FormLabel>{t('blocks.teaserSlots.filter')}</FormLabel>

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
