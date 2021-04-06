import React, {memo} from 'react'
import {Form, FormGroup, Row, Col} from 'rsuite'

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
  readonly value?: any
  readonly display?: any
  readonly children: any
}

export const I18nWrapper = memo(function I18nWrapper({children, display}: I18nProps) {
  return (
    <Row className="show-grid">
      <Col xs={12}>
        <Form
          style={{
            width: '100%'
          }}>
          <FormGroup>{children}</FormGroup>
        </Form>
      </Col>
      <Col xs={12}>{display}</Col>
    </Row>
  )
})
