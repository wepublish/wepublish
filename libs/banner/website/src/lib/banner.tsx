import {styled, Theme} from '@mui/material'
import {Button, Link} from '@wepublish/ui'
import {BuilderBannerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {differenceInHours} from 'date-fns'
import {useEffect, useState} from 'react'

interface BannerContainerProps {
  hasImage?: boolean
}

const BannerContainer = styled('div')<BannerContainerProps & {theme?: Theme}>`
  position: relative;
  display: grid;
  grid-template-columns: ${props => (props.hasImage ? 'minmax(auto, 50%) 1fr' : '1fr')};
  background-color: #ddd;
`

const BannerImage = styled('div')`
  background-size: cover;
  background-position: center;
`

const BannerContent = styled('div')`
  padding: ${({theme}) => theme.spacing(9)};
`

const BannerCta = styled('p')`
  font-weight: 700;
  text-align: center;
`

const BannerCloseButton = styled('span')`
  position: absolute;
  top: ${({theme}) => theme.spacing(3)};
  right: ${({theme}) => theme.spacing(3)};
  cursor: pointer;
  font-size: 2rem;
  width: 2rem;
  height: 2rem;
  line-height: 2rem;
`

const BannerTitle = styled('h2')`
  margin-top: 0;
  margin-bottom: ${({theme}) => theme.spacing(2)};
`

const BannerText = styled('div')`
  font-family: sans-serif;
  margin-bottom: ${({theme}) => theme.spacing(3)};
`

const BannerActions = styled('div')`
  display: flex;
  justify-content: center;
  a + a {
    margin-left: ${({theme}) => theme.spacing(3)};
  }
`

export const Banner = ({data, loading, error, className}: BuilderBannerProps) => {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  const [display, setDisplay] = useState(false)

  const storageKey = `banner-last-closed-${data?.primaryBanner.id}`

  useEffect(() => {
    const lastClosedTime = Number(localStorage.getItem(storageKey)) ?? 0
    const currentTime = new Date().getTime()

    const isNotClosedRecently = differenceInHours(currentTime, lastClosedTime) > 24

    setDisplay(isNotClosedRecently)
  }, [data])

  const handleClose = () => {
    setDisplay(false)
    localStorage.setItem(storageKey, new Date().getTime().toString())
  }

  if (!data?.primaryBanner || loading || error || !display) {
    return <></>
  }

  return (
    <BannerContainer hasImage={!!data?.primaryBanner.image} className={className}>
      <BannerCloseButton onClick={handleClose}>&#x2715;</BannerCloseButton>
      {data?.primaryBanner.image && (
        <BannerImage style={{backgroundImage: `url(${data?.primaryBanner.image.url})`}}>
          {/*<Image image={data?.primaryBanner.image} fetchPriority="high" />*/}
        </BannerImage>
      )}
      <BannerContent>
        <BannerTitle>{data?.primaryBanner.title}</BannerTitle>
        <BannerText>{data?.primaryBanner.text}</BannerText>
        <BannerCta>{data?.primaryBanner.cta}</BannerCta>
        <BannerActions>
          {data?.primaryBanner.actions &&
            data?.primaryBanner.actions.map(a => {
              return (
                <Link href={a.url} className={a.style}>
                  <Button>{a.label}</Button>
                </Link>
              )
            })}
        </BannerActions>
      </BannerContent>
    </BannerContainer>
  )
}
