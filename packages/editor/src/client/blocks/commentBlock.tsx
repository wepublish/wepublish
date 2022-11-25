import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdEdit} from 'react-icons/md'
import {Drawer, IconButton, Panel} from 'rsuite'

import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {SelectCommentPanel} from '../panel/selectCommentsPanel'
import {CommentBlockValue} from './types'

export const CommentBlock = ({
  itemId,
  value: {filter, comments},
  onChange,
  autofocus
}: BlockProps<CommentBlockValue>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const {t} = useTranslation()

  const isEmpty = !comments.length

  useEffect(() => {
    if (autofocus && isEmpty) {
      setIsDialogOpen(true)
    }
  }, [])

  return (
    <>
      <Panel
        bodyFill
        bordered
        style={{
          height: 200,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#f7f9fa'
        }}>
        <PlaceholderInput onAddClick={() => setIsDialogOpen(true)}>
          {!isEmpty && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              <div
                style={{
                  position: 'absolute',
                  zIndex: 100,
                  height: '100%',
                  right: 0
                }}>
                <IconButton size={'lg'} icon={<MdEdit />} onClick={() => setIsDialogOpen(true)}>
                  {t('blocks.comment.edit')}
                </IconButton>
              </div>

              <p>
                {t('blocks.comment.comments', {
                  count: comments.length ? comments.length : filter.comments?.length ?? 0
                })}
              </p>
            </div>
          )}
        </PlaceholderInput>
      </Panel>

      <Drawer size="lg" open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <SelectCommentPanel
          itemId={itemId}
          selectedFilter={filter}
          onClose={() => setIsDialogOpen(false)}
          onSelect={(newFilter, newComments) => {
            setIsDialogOpen(false)
            onChange({filter: newFilter, comments: newComments})
          }}
        />
      </Drawer>
    </>
  )
}
