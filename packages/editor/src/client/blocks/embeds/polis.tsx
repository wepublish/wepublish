import React, {useEffect} from 'react'
import {useScript} from '../../utility'

export interface PolisEmbedProps {
  conversationID: string
}

export function PolisEmbed({conversationID}: PolisEmbedProps) {
  const {load} = useScript(`https://pol.is/embed.js`, () => false, false)

  useEffect(() => load(), [])

  return (
    <div
      className="polis"
      data-page_id={conversationID}
      data-site_id="polis_site_id_ssFrYaCCx4UpbUX63X"></div>
  )
}
