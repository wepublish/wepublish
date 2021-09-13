import React, {useEffect} from 'react'
import {useScript} from '../utility'

export interface PolisEmbedProps {
  conversationID: string
}

export function PolisEmbed({conversationID}: PolisEmbedProps) {
  const {load} = useScript(`https://pol.is/embed.js`, () => false, false)

  useEffect(() => load(), [])

  return <div style={{width: '100%'}} className="polis" data-conversation_id={conversationID}></div>
}
