import React from 'react'

export interface PolisEmbedProps {
  conversationID: string
}

export function PolisEmbed({conversationID}: PolisEmbedProps) {
  return (
    <iframe
      src={`https://pol.is/${conversationID}`}
      width="100%"
      height="600"
      scrolling="yes"
      frameBorder="0"
    />
  )
}
