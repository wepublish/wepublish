import PencilIcon from '@rsuite/icons/legacy/Pencil'
import InnerHTML from 'dangerously-set-html-content'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Drawer, IconButton, Panel} from 'rsuite'

import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {HtmlEditPanel} from '../panel/htmlEditPanel'
import {HTMLBlockValue} from './types'

export const HTMLBlock = ({value, onChange, autofocus}: BlockProps<HTMLBlockValue>) => {
  const [isHtmlDialogOpen, setHtmlDialogOpen] = useState(false)
  const isEmpty = !value.html
  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus && isEmpty) {
      setHtmlDialogOpen(true)
    }
  }, [])

  return (
    <>
      <Panel
        bodyFill
        bordered
        style={{
          height: isEmpty ? 200 : undefined,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#f7f9fa'
        }}>
        <PlaceholderInput onAddClick={() => setHtmlDialogOpen(true)}>
          {!isEmpty && (
            <div
              style={{
                position: 'relative',
                width: '100%'
              }}>
              <div
                style={{
                  position: 'absolute',
                  zIndex: 100,
                  height: '100%',
                  right: 0
                }}>
                <IconButton
                  size={'lg'}
                  icon={<PencilIcon />}
                  onClick={() => setHtmlDialogOpen(true)}>
                  {t('blocks.html.edit')}
                </IconButton>
              </div>
              <div style={{marginTop: '30px'}}>
                <InnerHTML html={value.html} />
              </div>
            </div>
          )}
        </PlaceholderInput>
      </Panel>

      <Drawer size={'sm'} open={isHtmlDialogOpen} onClose={() => setHtmlDialogOpen(false)}>
        <HtmlEditPanel
          value={value}
          onClose={() => setHtmlDialogOpen(false)}
          onConfirm={value => {
            setHtmlDialogOpen(false)
            onChange(value)
          }}
        />
      </Drawer>
    </>
  )
}
