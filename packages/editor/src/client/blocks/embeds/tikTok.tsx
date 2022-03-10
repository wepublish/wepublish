import React, {useEffect, useState} from 'react'

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
    <div
      style={{
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgb(247, 249, 250)'
      }}>
      <a href={tikTokData?.author_url} target="_blank" rel="noreferrer">
        <p style={{fontWeight: 'bold'}}>@{userID}</p>
      </a>
      <p style={{fontWeight: 'bold'}}>{tikTokData?.author_name}</p>
      <a
        href={`https://www.tiktok.com/@${userID}/video/${videoID}`}
        rel="noreferrer"
        target="_blank">
        <img
          src={tikTokData?.thumbnail_url}
          style={{
            maxWidth: '605px',
            maxHeight: '500px',
            display: 'block',
            marginRight: 'auto',
            marginLeft: 'auto'
          }}
        />
      </a>
      <p>{tikTokData?.title}</p>
    </div>
  )
}
