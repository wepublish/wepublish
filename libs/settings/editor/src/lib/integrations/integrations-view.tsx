import {
  createCheckedPermissionComponent,
  Heading,
  SingleView,
  SingleViewContent
} from '@wepublish/ui/editor'
import {useTranslation} from 'react-i18next'
import {MdMail, MdPayment, MdShield, MdShowChart, MdTrackChanges} from 'react-icons/md'
import {Col, Panel, Row} from 'rsuite'

function IntegrationsView() {
  const {t} = useTranslation()

  return (
    <SingleView>
      <Heading>External Integrations</Heading>
      <SingleViewContent>
        <Row>
          {/* first column */}
          <Col xs={8}>
            {/* tracking pixels */}
            <Row>
              <Col xs={24}>
                <Panel
                  bordered
                  header={
                    <strong>
                      <MdTrackChanges style={{marginRight: '4px'}} />
                      {'Tracking Pixels Provider'}
                    </strong>
                  }>
                  Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
                  tempor invidunt ut labore et dolore magna aliquyam
                </Panel>
              </Col>

              <Col xs={24}>
                <Panel
                  bordered
                  header={
                    <strong>
                      <MdShield style={{marginRight: '4px'}} />
                      {'Challenge Provider'}
                    </strong>
                  }>
                  Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
                  tempor invidunt ut labore et dolore magna aliquyam
                </Panel>
              </Col>
            </Row>
          </Col>

          {/* second column */}
          <Col xs={8}>
            {/* tracking pixels */}
            <Row>
              <Col xs={24}>
                <Panel
                  bordered
                  header={
                    <strong>
                      <MdMail style={{marginRight: '4px'}} />
                      {'Mail Provider'}
                    </strong>
                  }>
                  Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
                  tempor invidunt ut labore et dolore magna aliquyam
                </Panel>
              </Col>
              <Col xs={24}>
                <Panel
                  bordered
                  header={
                    <strong>
                      <MdShowChart style={{marginRight: '4px'}} />
                      {'Google Analytics'}
                    </strong>
                  }>
                  Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
                  tempor invidunt ut labore et dolore magna aliquyam
                </Panel>
              </Col>
            </Row>
          </Col>

          {/* second column */}
          <Col xs={8}>
            {/* tracking pixels */}
            <Row>
              <Col xs={24}>
                <Panel
                  bordered
                  header={
                    <strong>
                      <MdPayment style={{marginRight: '4px'}} />
                      {'Payment Provider'}
                    </strong>
                  }>
                  Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
                  tempor invidunt ut labore et dolore magna aliquyam
                </Panel>
              </Col>
            </Row>
          </Col>
        </Row>
      </SingleViewContent>
    </SingleView>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SETTINGS',
  'CAN_UPDATE_SETTINGS'
])(IntegrationsView)
export {CheckedPermissionComponent as IntegrationsView}
