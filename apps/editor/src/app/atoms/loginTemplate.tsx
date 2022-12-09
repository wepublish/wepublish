import React, {ReactNode} from 'react'

const contentMaxWidth = 520

export interface LoginTemplateProps {
  readonly children?: ReactNode
  readonly backgroundChildren?: ReactNode
}

export function LoginTemplate({backgroundChildren, children}: LoginTemplateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',

        width: '100%',
        height: '100%'
      }}>
      {backgroundChildren && (
        <div
          style={{
            marginBottom: 20,
            zIndex: 0
          }}>
          {backgroundChildren}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
          zIndex: 1,

          width: '100%',
          maxWidth: contentMaxWidth + 40,

          padding: 40,

          backgroundColor: 'white',
          borderRadius: 10,

          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.2)'
        }}>
        {children}
      </div>
    </div>
  )
}
