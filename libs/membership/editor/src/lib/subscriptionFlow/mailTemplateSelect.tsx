import React, {useMemo} from 'react'
import {FullMailTemplateFragment} from '@wepublish/editor/api-v2'
import {SelectPicker} from 'rsuite'

interface MailTemplateSelectProps {
  mailTemplates: FullMailTemplateFragment[]
  mailTemplateId?: number
}
export default function MailTemplateSelect({
  mailTemplates,
  mailTemplateId
}: MailTemplateSelectProps) {
  const inactiveMailTemplates = useMemo(
    () => mailTemplates.filter(mailTemplate => mailTemplate.remoteMissing),
    [mailTemplates]
  )

  return (
    <SelectPicker
      style={{width: '100%'}}
      data={mailTemplates.map(mailTemplate => ({label: mailTemplate.name, value: mailTemplate.id}))}
      disabledItemValues={inactiveMailTemplates.map(mailTemplate => mailTemplate.id)}
      defaultValue={mailTemplateId}
      onSelect={value => {
        /* TODO: save change */
      }}
    />
  )
}
