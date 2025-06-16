'use client'

import {ListPlugin} from '@platejs/list/react'
import {KEYS} from 'platejs'

import {BlockList} from '../../ui/block-list'
import {IndentKit} from './indent-kit'

export const ListKit = [
  ...IndentKit,
  ListPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock, KEYS.toggle]
    },
    render: {
      belowNodes: BlockList
    }
  })
]
