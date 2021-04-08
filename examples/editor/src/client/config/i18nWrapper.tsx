import React, {memo} from 'react'
import {
  Form,
  FormGroup,
  Input,
  IconButton,
  Icon,
  Whisper,
  Tooltip,
  ControlLabel,
  Row,
  Col
} from 'rsuite'

export interface ArticleMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface ArticleMetadata {
  readonly evaluationBodyId: string
  readonly evaluationBodyNumber: string
  readonly evaluationBodyName: string
  readonly personName: string
  readonly academicDegree: string
  readonly personNumber: string
  readonly isResearchCouncilMember: string
  readonly university: string
  readonly website: string
  readonly _function: string
  readonly membershipValidFrom: string
  readonly membershipValidUntil: string
  readonly evaluationBodyType: string
  readonly evaluationBodyPublishedFromDate: string
  readonly evaluationBodyPublishedUntilDate: string
  readonly evaluationBodySortNumber: string
  readonly functionSortNumber: string
}

export interface I18nProps {
  readonly label: string
  readonly value?: any
  readonly display?: any
  readonly children: any
}

export const tooltip = (
  <Tooltip>
    <p>
      Translate text with <b>Deepl</b>.<br />
      Attention: All formatting will be lost
    </p>
  </Tooltip>
)

export const I18nWrapper = memo(function I18nWrapper({label, children, display}: I18nProps) {
  let preview = null
  if (!display || typeof display === 'string') {
    preview = <Input className="wep-input-disabled" value={display} disabled />
  } else {
    preview = display
  }
  return (
    <Row className="show-grid" style={{display: 'flex', alignItems: 'center'}}>
      <Col xs={11}>
        <Form fluid>
          <FormGroup>
            <ControlLabel>{label}</ControlLabel>
            {children}
          </FormGroup>
        </Form>
      </Col>
      <Col xs={2} style={{textAlign: 'center', paddingTop: '5px'}}>
        <Whisper placement="top" trigger="hover" speaker={tooltip}>
          <IconButton icon={<Icon icon="left" />} circle size="sm" />
        </Whisper>
      </Col>
      <Col xs={11}>
        <Form>
          <FormGroup>
            <ControlLabel>{label}</ControlLabel>
            {preview}
          </FormGroup>
        </Form>
      </Col>
    </Row>
  )
})
