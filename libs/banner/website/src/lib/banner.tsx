import {Link} from '@mui/material'
import styled from '@emotion/styled'
import {Button} from '@wepublish/ui'
import {BannerAction, BannerActionRole} from '@wepublish/website/api'
import {BuilderBannerProps} from '@wepublish/website/builder'
import {differenceInHours} from 'date-fns'
import {useEffect, useState} from 'react'

export const BannerImage = styled('div')(
  ({theme}) => `
  background-size: cover;
  background-position: center;
  height: ${theme.spacing(18)};
  order: 1;
  ${theme.breakpoints.up('md')} {
    order: 0;
    height: unset;
  }
`
)

export const BannerContent = styled('div')`
  padding: ${({theme}) => theme.spacing(9)};
`

export const BannerCta = styled('p')`
  font-weight: 700;
  text-align: center;
`

export const BannerCloseButton = styled('span')`
  position: absolute;
  top: ${({theme}) => theme.spacing(9)};
  right: ${({theme}) => theme.spacing(9)};
  cursor: pointer;
  font-size: 2rem;
  width: 2rem;
  height: 2rem;
  line-height: 2rem;
`

export const BannerTitle = styled('h2')`
  margin-top: 0;
  margin-bottom: ${({theme}) => theme.spacing(2)};
  line-height: 1.2;
`

export const BannerText = styled('div')`
  font-family: sans-serif;
  margin-bottom: ${({theme}) => theme.spacing(3)};
`

const BannerActions = styled('div')`
  display: flex;
  gap: ${({theme}) => theme.spacing(3)};
  justify-content: center;
`

type BannerWrapperProps = {
  hasImage?: boolean
}

const BannerWrapper = styled('div')<BannerWrapperProps>(
  ({theme, hasImage}) => `
  z-index: 11;
  position: sticky;
  top: var(--navbar-height);
  display: grid;
  grid-template-columns: 1fr;
  background-color: ${theme.palette.secondary.main};
  color: ${theme.palette.secondary.contrastText};
  width: 100%;

  &[data-collapsed='true'] {
    display: none;
  }

  ${theme.breakpoints.up('md')} {
    grid-template-columns: ${hasImage ? 'minmax(auto, 50%) 1fr' : '1fr'};
  }
`
)

export const Banner = ({data, loading, error, className}: BuilderBannerProps) => {
  const [showBanner, setShowBanner] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const storageKey = `banner-last-closed-${data?.primaryBanner?.id}`

  useEffect(() => {
    if (!data?.primaryBanner) {
      return
    }

    const timer = setTimeout(() => {
      setShowBanner(true)
    }, (data?.primaryBanner?.delay ?? 0) * 1000)

    return () => clearTimeout(timer)
  }, [data?.primaryBanner])

  useEffect(() => {
    const lastClosedTime = Number(localStorage.getItem(storageKey)) ?? 0
    const currentTime = new Date().getTime()

    const isClosedRecently = differenceInHours(currentTime, lastClosedTime) < 24

    setCollapsed(isClosedRecently)
  }, [data])

  const handleClose = () => {
    setCollapsed(true)
    localStorage.setItem(storageKey, new Date().getTime().toString())
  }

  const handleActionClick = (e: React.MouseEvent, action: BannerAction) => {
    if (action.role === BannerActionRole.Cancel) {
      e.preventDefault()
      handleClose()
    }
  }

  if (!data?.primaryBanner || loading || error) {
    return <></>
  }

  if (!showBanner) {
    return <></>
  }

  return (
    <BannerWrapper
      hasImage={!!data?.primaryBanner.image}
      className={className}
      data-collapsed={collapsed}>
      <BannerCloseButton onClick={handleClose}>&#x2715;</BannerCloseButton>

      {data?.primaryBanner.image && (
        <BannerImage
          style={{backgroundImage: `url(${data?.primaryBanner.image.url})`}}></BannerImage>
      )}

      <BannerContent>
        <BannerTitle>{data?.primaryBanner.title}</BannerTitle>
        <BannerText>{data?.primaryBanner.text}</BannerText>
        {data?.primaryBanner.cta && <BannerCta>{data?.primaryBanner.cta}</BannerCta>}

        <BannerActions>
          {data?.primaryBanner.actions &&
            data?.primaryBanner.actions.map(a => (
              <Link
                href={a.url}
                key={a.url}
                onClick={e => handleActionClick(e, a)}
                data-role={a.role}>
                <Button color={a.role === BannerActionRole.Primary ? 'primary' : 'secondary'}>
                  {a.label}
                </Button>
              </Link>
            ))}
        </BannerActions>
      </BannerContent>
    </BannerWrapper>
  )
}
