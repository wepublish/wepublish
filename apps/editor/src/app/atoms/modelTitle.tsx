import styled from '@emotion/styled'
import {ReactChild} from 'react'
import {MdChevronLeft} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {Button, Col as RCol, FlexboxGrid, Loader as RLoader, Row} from 'rsuite'

const Col = styled(RCol)`
  padding-top: 3px;
`

const FlexGrid = styled(FlexboxGrid)`
  padding-right: 5px;
  padding-bottom: 20px;
`

const FlexboxItem = styled(FlexboxGrid.Item)`
  margin-left: 40px;
`

const Loader = styled(RLoader)`
  margin-right: 5px;
`

const SaveButton = styled(Button)`
  margin-right: 10px;
`

interface modelTitleProps {
  title?: string
  loading: boolean
  loadingTitle: string
  saveBtnTitle: string
  saveAndCloseBtnTitle: string
  closePath: string
  additionalMenu?: ReactChild
  setCloseFn(close: boolean): void
}

export function ModelTitle({
  title,
  loading,
  loadingTitle,
  saveBtnTitle,
  saveAndCloseBtnTitle,
  closePath,
  additionalMenu,
  setCloseFn
}: modelTitleProps) {
  /**
   * UI helpers
   */
  function titleView() {
    if (loading) {
      return (
        <>
          <Loader />
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
        <SaveButton appearance="ghost" loading={loading} type="submit" data-testid="saveButton">
          {saveBtnTitle}
        </SaveButton>
        {/* save and close button */}
        <Button
          appearance="primary"
          loading={loading}
          type="submit"
          data-testid="saveAndCloseButton"
          onClick={() => setCloseFn(true)}>
          {saveAndCloseBtnTitle}
        </Button>
      </>
    )
  }

  return (
    <FlexGrid align="middle">
      {/* title */}
      <FlexboxGrid.Item colspan={12}>
        <Row>
          <Col xs={2}>
            <Link to={closePath}>
              <h1>
                <MdChevronLeft />
              </h1>
            </Link>
          </Col>
          <RCol xs={16}>
            <h2>{titleView()}</h2>
          </RCol>
        </Row>
      </FlexboxGrid.Item>

      {/* actions */}
      <FlexboxGrid.Item colspan={12}>
        <FlexboxGrid justify="end" align="middle">
          {/* additional menu content */}
          <FlexboxGrid.Item>{additionalMenu}</FlexboxGrid.Item>

          {/* save btns */}
          <FlexboxItem>{actionsView()}</FlexboxItem>
        </FlexboxGrid>
      </FlexboxGrid.Item>
    </FlexGrid>
  )
}
