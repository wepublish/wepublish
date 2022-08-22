import {ArrowLeftLine} from '@rsuite/icons'
import React from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {Button, Col, FlexboxGrid, Loader, Row} from 'rsuite'

interface modelTitleProps {
  title?: string
  loading: boolean
  loadingTitle: string
  saveTitle: string
  saveAndCloseTitle: string
  closePath: string
}

export function ModelTitle({
  title,
  loading,
  loadingTitle,
  saveTitle,
  saveAndCloseTitle,
  closePath
}: modelTitleProps) {
  const navigate = useNavigate()

  /**
   * FUNCTIONS
   */
  function close(): void {
    navigate(closePath)
  }

  /**
   * UI helpers
   */
  function titleView() {
    if (loading) {
      return (
        <>
          <Loader style={{marginRight: '5px'}} />
          {loadingTitle}
        </>
      )
    }
    return title
  }

  function actionsView() {
    return (
      <>
        {/* save button */}
        <Button
          appearance="ghost"
          loading={loading}
          type="submit"
          data-testid="saveButton"
          style={{marginRight: '10px'}}>
          {saveTitle}
        </Button>
        {/* save and close button */}
        <Button
          appearance="primary"
          loading={loading}
          type="submit"
          data-testid="saveAndCloseButton"
          onClick={() => close()}>
          {saveAndCloseTitle}
        </Button>
      </>
    )
  }

  return (
    <>
      <FlexboxGrid align="middle" style={{paddingRight: '5px', paddingBottom: '20px'}}>
        {/* title */}
        <FlexboxGrid.Item colspan={12}>
          <Row>
            <Col xs={2} style={{paddingTop: '3px'}}>
              <Link to={closePath}>
                <h1>
                  <ArrowLeftLine />
                </h1>
              </Link>
            </Col>
            <Col xs={16}>
              <h2>{titleView()}</h2>
            </Col>
          </Row>
        </FlexboxGrid.Item>
        {/* actions */}
        <FlexboxGrid.Item colspan={12} style={{textAlign: 'right'}}>
          {actionsView()}
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  )
}
