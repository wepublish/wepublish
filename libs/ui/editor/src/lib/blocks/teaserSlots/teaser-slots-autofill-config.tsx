'use client';

import styled from '@emotion/styled';
import { TagType } from '@wepublish/editor/api-v2';
import { TeaserSlotsAutofillConfigInput } from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { Form } from 'rsuite';

import { SelectTags } from '../../atoms/tag/selectTags';

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

export function TeaserSlotsAutofillConfigPanel({
  config,
  onChange,
}: TeaserSlotsConfigPanelProps) {
  const { t } = useTranslation();

  const handleChange = (
    key: keyof TeaserSlotsAutofillConfigInput,
    value: any
  ) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const sortOptions = [{ label: 'Published date', value: 'PublishedAt' }];

  return (
    <ConfigContainer>
      <FormGroup>
        <Form.ControlLabel>{t('blocks.teaserSlots.filter')}</Form.ControlLabel>
        <SelectTags
          defaultTags={[]}
          name="tags"
          tagType={TagType.Article}
          setSelectedTags={tags => handleChange('filter', { tags })}
          selectedTags={config.filter?.tags}
        />

        <HelpText>{t('blocks.teaserSlots.filterHelpText')}</HelpText>
      </FormGroup>
    </ConfigContainer>
  );
}
