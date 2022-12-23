import styled from '@emotion/styled'
import InnerHTML from 'dangerously-set-html-content'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdEdit} from 'react-icons/md'
import {Drawer, IconButton, Panel} from 'rsuite'

import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {HtmlEditPanel} from '../panel/htmlEditPanel'
import {HTMLBlockValue} from './types'

const StyledPanel = styled(Panel)<{isEmpty: boolean}>`
  height: ${({isEmpty}) => (isEmpty ? '200px' : undefined)};
  padding: 0;
  overflow: hidden;
  background-color: #f7f9fa;
`

const StyledWrapper = styled.div`
  position: relative;
  width: 100%;
`

const StyledIconWrapper = styled.div`
  position: absolute;
  z-index: 100;
  height: 100%;
  right: 0;
`

const StyledInnerHtmlWrapper = styled.div`
  margin-top: 30px;
`

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
      <StyledPanel isEmpty={isEmpty} bodyFill bordered>
        <PlaceholderInput onAddClick={() => setHtmlDialogOpen(true)}>
          {!isEmpty && (
            <StyledWrapper>
              <StyledIconWrapper>
                <IconButton size="lg" icon={<MdEdit />} onClick={() => setHtmlDialogOpen(true)}>
                  {t('blocks.html.edit')}
                </IconButton>
              </StyledIconWrapper>
              <StyledInnerHtmlWrapper>
                <InnerHTML html={value.html} />
              </StyledInnerHtmlWrapper>
            </StyledWrapper>
          )}
        </PlaceholderInput>
      </StyledPanel>

      <Drawer size="sm" open={isHtmlDialogOpen} onClose={() => setHtmlDialogOpen(false)}>
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
