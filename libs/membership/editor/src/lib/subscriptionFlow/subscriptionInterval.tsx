import React from 'react'
import {IconButton, SelectPicker, Tag} from 'rsuite'
import {MdAdd, MdDescription, MdRemove} from 'react-icons/all'
import {SubscriptionIntervalFragment} from '@wepublish/editor/api-v2'

interface SubscriptionIntervalProps {
  subscriptionInterval?: SubscriptionIntervalFragment | null
}
export default function SubscriptionInterval({subscriptionInterval}: SubscriptionIntervalProps) {
  const oneDayInPixel = 80
  function selectMailTemplateView() {
    // the width representation of the days in pixels
    return (
      <>
        <div
          style={{
            position: 'absolute',
            width: '190px',
            right: '-95px',
            bottom: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '5px',
            borderRadius: '5px',
            padding: '10px 5px',
            border: '1px solid black'
          }}>
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
              {subscriptionInterval?.mailTemplate?.name}
            </Tag>
            <SelectPicker data={[]} />
          </div>
          <div>
            <IconButton circle appearance="primary" size="xs" icon={<MdAdd />} />
          </div>
        </div>
      </>
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
        <div
          style={{
            width: `${oneDayInPixel * (subscriptionInterval?.daysAwayFromEnding || 1)}px`,
            textAlign: 'center',
            marginBottom: '10px'
          }}>
          <Tag color="green" size="sm">
            <b>{subscriptionInterval?.daysAwayFromEnding} d</b>
          </Tag>
        </div>
      </div>
    </>
  )
}
