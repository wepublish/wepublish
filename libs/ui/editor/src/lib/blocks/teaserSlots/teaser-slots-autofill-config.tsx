'use client'

import styled from '@emotion/styled'
import {Form} from 'rsuite'
import {TagType} from '@wepublish/editor/api'
import {SelectTags} from '../../atoms/tag/selectTags'
import {TeaserSlotsAutofillConfigInput} from '@wepublish/editor/api-v2'

interface TeaserSlotsConfigPanelProps {
  config: TeaserSlotsAutofillConfigInput
  onChange: (config: TeaserSlotsAutofillConfigInput) => void
}

const ConfigContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const FormGroup = styled(Form.Group)`
  margin-bottom: 12px;
`

const HelpText = styled('div')`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
`

export function TeaserSlotsAutofillConfigPanel({config, onChange}: TeaserSlotsConfigPanelProps) {
  const handleChange = (key: keyof TeaserSlotsAutofillConfigInput, value: any) => {
    onChange({
      ...config,
      [key]: value
    })
  }

  const sortOptions = [{label: 'Published date', value: 'PublishedAt'}]

  return (
    <ConfigContainer>
      <FormGroup>
        <Form.ControlLabel>Filter by tags</Form.ControlLabel>
        <SelectTags
          defaultTags={[]}
          name="tags"
          tagType={TagType.Article}
          setSelectedTags={tags => handleChange('filter', {tags})}
          selectedTags={config.filter?.tags}
        />
        <HelpText>Enter tags separated by commas. Leave empty for no tag filtering.</HelpText>
      </FormGroup>
    </ConfigContainer>
  )
}
