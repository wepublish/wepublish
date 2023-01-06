import styled from '@emotion/styled'
import {useEffect, useState} from 'react'

const Image = styled.img`
  max-width: 605px;
  max-height: 500px;
  display: block;
  margin-right: auto;
  margin-left: auto;
`

const BoldParagraph = styled.p`
  font-weight: bold;
`

const TikTokEmbed = styled.div`
  justify-content: center;
  padding: 20px;
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
    <TikTokEmbed>
      <a href={tikTokData?.author_url} target="_blank" rel="noreferrer">
        <BoldParagraph>@{userID}</BoldParagraph>
      </a>
      <BoldParagraph>{tikTokData?.author_name}</BoldParagraph>
      <a
        href={`https://www.tiktok.com/@${userID}/video/${videoID}`}
        rel="noreferrer"
        target="_blank">
        <Image src={tikTokData?.thumbnail_url} />
      </a>
      <p>{tikTokData?.title}</p>
    </TikTokEmbed>
  )
}
