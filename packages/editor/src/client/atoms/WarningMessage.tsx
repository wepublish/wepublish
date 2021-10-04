import React, {ReactNode} from 'react';
import { Icon } from 'rsuite';
import {useTranslation} from 'react-i18next';



export interface WarningMessageProps {
  children?: ReactNode
}

export function WarningMessage({children}: WarningMessageProps) {
  const {t} = useTranslation()
  return (
    <div style={{backgroundColor: '#fffaf2', padding: '20px'}}>
      <div style={{fontSize: '16px'}}>
        <span style={{marginRight: '10px'}}><Icon icon="remind"></Icon></span>
        <span>{t('articleEditor.overview.warningLabel')}</span>
      </div>
      <p style={{margin: '5px 0 0 25px', fontSize: '14px'}}>
          {children}
      </p>
    </div>
  )
}
