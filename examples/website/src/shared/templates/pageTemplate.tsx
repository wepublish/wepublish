import React, {ReactNode} from 'react'
import {useStyle, cssRule} from '@karma.run/react'
import {PageHeader} from '../atoms/pageHeader'

const PageTemplateContentStyle = cssRule({
  margin: '0 auto'
})

export interface PageTemplateProps {
  title?: string
  children?: ReactNode
}

export function PageTemplate({title, children, ...props}: PageTemplateProps) {
  const css = useStyle()

  return (
    <>
      {title && <PageHeader title={title} />}
      <div className={css(PageTemplateContentStyle)}>{children}</div>
    </>
  )
}
