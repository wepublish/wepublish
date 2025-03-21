import {useTagListQuery} from '@wepublish/editor/api'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {CheckPicker} from 'rsuite'

export interface TagRefFragment {
  id: string
  tag?: string | null
}

export interface TagCheckPickerProps {
  readonly list: TagRefFragment[]
  disabled?: boolean
  onClose?(): void
  onChange?(authors: TagRefFragment[]): void
}

export function TagCheckPicker({list, disabled, onChange}: TagCheckPickerProps) {
  const {t} = useTranslation()
  const [foundTags, setFoundTags] = useState<TagRefFragment[]>([])
  const [tagsFilter, setTagsFilter] = useState('')

  const {data} = useTagListQuery({
    variables: {},
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (data?.tags?.nodes) {
      const tagIds = data.tags.nodes.map(tag => tag.id)
      const selectedTags = list.filter(tag => !tagIds.includes(tag.id))
      setFoundTags([...data.tags.nodes, ...selectedTags])
    }
  }, [data?.tags, list])

  return (
    <CheckPicker
      disabled={disabled}
      virtualized
      cleanable
      value={list.map(tag => tag.id)}
      data={foundTags.map(tag => ({value: tag.id, label: tag.tag}))}
      placeholder={t('navbar.articleTags')}
      onSearch={searchKeyword => {
        setTagsFilter(searchKeyword)
      }}
      onChange={tagIds => {
        const tags = foundTags.filter(tag => tagIds.includes(tag.id))
        onChange?.(tags)
      }}
      onExit={() => {
        setTagsFilter('')
      }}
      block
    />
  )
}
