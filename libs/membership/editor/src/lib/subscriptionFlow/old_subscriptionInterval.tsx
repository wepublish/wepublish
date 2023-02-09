import React from 'react'
import {IconButton, SelectPicker, Tag} from 'rsuite'
import {MdAdd, MdDescription, MdEdit, MdOutgoingMail, MdRemove, MdWarning} from 'react-icons/all'
import {SubscriptionNonUserAction} from './subscriptionFlows'
import {useTranslation} from 'react-i18next'

interface SubscriptionIntervalProps {
  subscriptionNonUserAction: SubscriptionNonUserAction
  editMode: boolean
}
export default function Old_subscriptionInterval({
  subscriptionNonUserAction,
  editMode
}: SubscriptionIntervalProps) {
  const {t} = useTranslation()
  const oneDayInPixel = 80

  /**
   * UI helper functions
   */
  function timelineView() {
    return (
      <div
        style={{
          width: `${
            oneDayInPixel *
            (subscriptionNonUserAction.subscriptionInterval?.daysAwayFromEnding || 0)
          }px`,
          textAlign: 'center',
          marginBottom: '10px'
        }}>
        <Tag color="green" size="sm">
          <b>{subscriptionNonUserAction.subscriptionInterval?.daysAwayFromEnding} d</b>
        </Tag>
      </div>
    )
  }

  function mailTemplatePreview() {
    return (
      <>
        <div style={{position: 'relative'}}>
          <Tag style={{wordBreak: 'break-word', textAlign: 'center'}}>
            {subscriptionNonUserAction.title}
          </Tag>
          {/* outgoing mail */}
          {subscriptionNonUserAction.subscriptionInterval && (
            <div style={{marginTop: '5px', textAlign: 'center'}}>
              <MdOutgoingMail /> {subscriptionNonUserAction.subscriptionInterval.mailTemplate.name}
            </div>
          )}
          {!subscriptionNonUserAction.subscriptionInterval && (
            <div style={{marginTop: '5px', textAlign: 'center'}}>
              <MdWarning color="red" />
              {t('subscriptionInterval.missingMailTemplate')}
            </div>
          )}

          {/** edit button */}
          <IconButton
            style={{position: 'absolute', top: '-20px', right: '-20px'}}
            circle
            appearance="primary"
            size="xs"
            icon={<MdEdit />}
          />
        </div>
      </>
    )
  }

  function editMailTemplateView() {
    return (
      <>
        <div>
          <IconButton circle appearance="primary" size="xs" icon={<MdRemove />} />
        </div>
        <div style={{textAlign: 'center'}}>
          <Tag
            color="orange"
            size="md"
            style={{
              marginBottom: '5px'
            }}>
            <MdDescription style={{marginRight: '4px'}} />
            {subscriptionNonUserAction.title}
          </Tag>
          <SelectPicker data={[]} />
        </div>
        <div>
          <IconButton circle appearance="primary" size="xs" icon={<MdAdd />} />
        </div>
      </>
    )
  }

  function selectMailTemplateView() {
    // the width representation of the days in pixels
    return (
      <div
        style={{
          position: 'absolute',
          width: '80px',
          right: '-40px',
          bottom: '45px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '5px',
          borderRadius: '5px',
          padding: '10px 5px',
          border: '1px solid black',
          wordBreak: 'break-word'
        }}>
        {editMode && editMailTemplateView()}
        {!editMode && mailTemplatePreview()}
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid black',
          alignItems: 'flex-end',
          height: '40px',
          borderRight: '1px solid black',
          position: 'relative',
          marginTop: '100px'
        }}>
        {/* mail template selection */}
        {selectMailTemplateView()}

        {/* day representation */}
        {timelineView()}
      </div>
    </>
  )
}
