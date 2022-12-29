import styled from '@emotion/styled'
import React, {useEffect, useState} from 'react'

const StyledImage = styled.img`
  max-width: 605px;
  max-height: 500px;
  display: block;
  margin-right: auto;
  margin-left: auto;
`

const BoldParagraph = styled.p`
  font-weight: bold;
`

const StyledTikTokEmbed = styled.div`
  justify-content: center;
  padding: 20;
  background-color: rgb(247, 249, 250);
`

export interface TikTokVideoEmbedProps {
  userID: string
  videoID: string
}

export function TikTokVideoEmbed({userID, videoID}: TikTokVideoEmbedProps) {
  const [tikTokData, setTikTokData] = useState<any>()

  const fetchTiktokData = async () => {
    const response = await fetch(
      `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${userID}/video/${videoID}`
    )
    await response.json().then(value => setTikTokData(value))
  }

  useEffect(() => {
    fetchTiktokData()
  }, [userID, videoID])

  return (
    <StyledTikTokEmbed>
      <a href={tikTokData?.author_url} target="_blank" rel="noreferrer">
        <BoldParagraph>@{userID}</BoldParagraph>
      </a>
      <BoldParagraph>{tikTokData?.author_name}</BoldParagraph>
      <a
        href={`https://www.tiktok.com/@${userID}/video/${videoID}`}
        rel="noreferrer"
        target="_blank">
        <StyledImage src={tikTokData?.thumbnail_url} />
      </a>
      <p>{tikTokData?.title}</p>
    </StyledTikTokEmbed>
  )
}
