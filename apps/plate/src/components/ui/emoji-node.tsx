'use client'

import type {PlateElementProps} from 'platejs/react'

import {EmojiInlineIndexSearch, insertEmoji} from '@platejs/emoji'
import {EmojiPlugin} from '@platejs/emoji/react'
import {PlateElement, usePluginOption} from 'platejs/react'

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem
} from './inline-combobox'
import {useState, useMemo} from 'react'
import {useDebounce} from '../../hooks/use-debounce'

export function EmojiInputElement(props: PlateElementProps) {
  const {children, editor, element} = props
  const data = usePluginOption(EmojiPlugin, 'data')!
  const [value, setValue] = useState('')
  const debouncedValue = useDebounce(value, 100)
  const isPending = value !== debouncedValue

  const filteredEmojis = useMemo(() => {
    if (debouncedValue.trim().length === 0) return []

    return EmojiInlineIndexSearch.getInstance(data).search(debouncedValue.replace(/:$/, '')).get()
  }, [data, debouncedValue])

  return (
    <PlateElement as="span" {...props}>
      <InlineCombobox
        value={value}
        element={element}
        filter={false}
        setValue={setValue}
        trigger=":"
        hideWhenNoValue>
        <InlineComboboxInput />

        <InlineComboboxContent>
          {!isPending && <InlineComboboxEmpty>No results</InlineComboboxEmpty>}

          <InlineComboboxGroup>
            {filteredEmojis.map(emoji => (
              <InlineComboboxItem
                key={emoji.id}
                value={emoji.name}
                onClick={() => insertEmoji(editor, emoji)}>
                {emoji.skins[0].native} {emoji.name}
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {children}
    </PlateElement>
  )
}
