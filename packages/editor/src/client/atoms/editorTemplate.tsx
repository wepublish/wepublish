import React, {ReactNode} from 'react'

const contentMaxWidth = 880

export interface EditorTemplateProps {
  navigationChildren?: ReactNode
  children?: ReactNode
}

export function EditorTemplate({children, navigationChildren}: EditorTemplateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',

        width: '100%',
        minHeight: '100%'
      }}>
      <div
        style={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          zIndex: 3,
          width: '100%'
        }}>
        {navigationChildren}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          paddingTop: 40,
          paddingBottom: 60,
          paddingLeft: 40,
          paddingRight: 40
        }}>
        <div
          style={{
            display: 'flex',
            width: '100%',
            maxWidth: contentMaxWidth + 40
          }}>
          {children}
        </div>
      </div>
    </div>
  )
}
