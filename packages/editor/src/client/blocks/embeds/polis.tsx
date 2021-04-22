import React from 'react'

export interface PolisEmbedProps {
  conversationID: string
}

export function PolisEmbed({conversationID}: PolisEmbedProps) {
  return (
    <iframe
      src={`https://pol.is/${conversationID}`}
      width="100%"
      height="100%"
      scrolling="yes"
      frameBorder="0"
    />
  )
}
