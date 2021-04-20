import React from 'react'
import {EditorConfig} from './interfaces/extensionConfig'

export const ConfigContext = React.createContext<EditorConfig | undefined>(undefined)
