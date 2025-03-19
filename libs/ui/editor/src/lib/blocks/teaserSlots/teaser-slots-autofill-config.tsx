'use client'

import styled from '@emotion/styled'
import {FlexboxGrid, Form, InputNumber} from 'rsuite'
import {TagType, TeaserSlotsAutofillConfig} from '@wepublish/editor/api'
import {SelectTags} from '../../atoms/tag/selectTags'

interface TeaserSlotsConfigPanelProps {
  config: TeaserSlotsAutofillConfig
  onChange: (config: TeaserSlotsAutofillConfig) => void
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
  const handleChange = (key: keyof TeaserSlotsAutofillConfig, value: any) => {
    onChange({
      ...config,
      [key]: value
    })
  }

  const sortOptions = [
    {label: 'Published date', value: 'publishedAt'},
    {label: 'Created date', value: 'createdAt'},
    {label: 'Title', value: 'title'}
  ]

  return (
    <ConfigContainer>
      <FormGroup>
        <Form.ControlLabel>Filter by tags</Form.ControlLabel>
        <SelectTags
          defaultTags={[]}
          name="tags"
          tagType={TagType.Article}
          setSelectedTags={tags => handleChange('tags', tags ?? [])}
          selectedTags={config.tags}
        />
        <HelpText>Enter tags separated by commas. Leave empty for no tag filtering.</HelpText>
      </FormGroup>

      <FlexboxGrid>
        <FlexboxGrid.Item colspan={12} style={{paddingLeft: 8}}>
          <FormGroup>
            <Form.ControlLabel>Skip</Form.ControlLabel>
            <InputNumber
              min={0}
              value={config.skip as number}
              onChange={value => handleChange('skip', +value)}
              style={{width: '100%'}}
            />
          </FormGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </ConfigContainer>
  )
}
