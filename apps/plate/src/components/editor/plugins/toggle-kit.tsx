'use client'

import {TogglePlugin} from '@platejs/toggle/react'

import {ToggleElement} from '../../ui/toggle-node'
import {IndentKit} from './indent-kit'

export const ToggleKit = [...IndentKit, TogglePlugin.withComponent(ToggleElement)]
