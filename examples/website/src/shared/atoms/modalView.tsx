import React, {ReactNode} from 'react'
import {BlockIcon, IconType} from './icon'
import {cssRule, useStyle} from '@karma.run/react'
import {Link, useRoute, Route} from '../route/routeContext'

const ModalStyle = cssRule({
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  background: 'rgba(0, 0, 0, 0.6)',
  zIndex: 3
})

const ModalMailStyle = cssRule({
  position: 'fixed',
  background: 'white',
  width: '80%',
  height: '90%',
  maxHeight: '100%',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  borderRadius: '8px',
  overflow: 'hidden'
})

const ModalWrapperStyle = cssRule({
  height: '100%',
  overflow: 'auto',
  paddingTop: '45px'
})

const IconStyle = cssRule({
  paddingTop: '26px',
  paddingBottom: '10px',
  width: '96%',
  display: 'flex',
  justifyContent: 'flex-end',
  position: 'absolute',
  zIndex: 1,
  background: 'white'
})

export interface ModalProps {
  children: ReactNode
}

function closeRouteForRoute(route: Route) {
  return route
}

export function Modal({children}: ModalProps) {
  const css = useStyle()
  const {current} = useRoute()

  return (
    <div className={css(ModalStyle)}>
      <section className={css(ModalMailStyle)}>
        <div className={css(IconStyle)}>
          <Link route={{...closeRouteForRoute(current!), hash: '', query: undefined}}>
            <BlockIcon type={IconType.Close} />
          </Link>
        </div>
        <div className={css(ModalWrapperStyle)}>{children}</div>
      </section>
    </div>
  )
}
