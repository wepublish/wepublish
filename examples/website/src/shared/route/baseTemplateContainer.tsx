import React, {ReactNode, useEffect, useState} from 'react'

import gql from 'graphql-tag'
import {useQuery} from 'react-apollo'
import {BaseTemplate} from '../templates/baseTemplate'
import {NavigationItem} from '../types'
import {PageRoute, useRoute, RouteType} from './routeContext'
import {NewsletterModal} from '../molecules/newsletterModal'
import {IFrameModal} from '../molecules/iFrameModal'

const NavigationQuery = gql`
  {
    main: navigation(key: "main") {
      ...BaseNavigations
    }

    footer: navigation(key: "footer") {
      ...BaseNavigations
    }
  }

  fragment BaseNavigations on Navigation {
    links {
      __typename
      ... on PageNavigationLink {
        label
        page {
          slug
        }
      }
    }
  }
`

export interface BaseTemplateContainerProps {
  footerText?: string
  largeHeader?: boolean
  hideHeaderMobile?: boolean
  children?: ReactNode
}

function modalForRoute(routeType: RouteType) {
  switch (routeType) {
    case RouteType.Member:
      return 'memberwerden'
    case RouteType.Archiv:
      return 'briefingarchiv'
    case RouteType.PayRexxFull:
      return 'full'
    case RouteType.PayRexxGoenner:
      return 'goenner'
    case RouteType.PayRexxMember:
      return 'member'
    case RouteType.BaselBriefing:
      return 'baselbriefing'
    default:
      return null
  }
}

export function BaseTemplateContainer({
  hideHeaderMobile,
  largeHeader,
  children,
  footerText
}: BaseTemplateContainerProps) {
  const {data} = useQuery(NavigationQuery)

  const {current} = useRoute()
  const [modal, setModal] = useState<ReactNode | null>(null)

  useEffect(() => {
    const date = new Date()
    const day = date.getDay()
    const time = date.getHours()

    const modalName = modalForRoute(current!.type) ?? current?.query?.modal ?? current?.hash

    // check if current has same id as stored. if no: show
    if (current?.hash?.startsWith('briefing=')) {
      const idRegex = /briefing=([^&]+)(&|$)/
      const briefingMatch = idRegex.exec(current?.hash)
      const briefingId = briefingMatch ? briefingMatch![1] : null

      const cnameRegex = /cname=([^&]+)(&|$)/
      const cnameMatch = cnameRegex.exec(current?.hash)
      const cname = cnameMatch ? cnameMatch![1] : null

      if (briefingId && cname) {
        setModal(<IFrameModal src={`https://mailchi.mp/${briefingId}/${cname}`} />)
      }
    } else if (modalName) {
      switch (modalName) {
        case 'briefing': {
          const briefingId = current?.query?.id
          const cname = current?.query?.cname

          if (briefingId && cname) {
            setModal(<IFrameModal src={`https://mailchi.mp/${briefingId}/${cname}`} />)
          }

          break
        }

        case 'baselbriefing':
          setModal(<NewsletterModal />)
          break

        case 'member':
          setModal(<IFrameModal src="https://bajour.payrexx.com/pay?tid=e0967e96&amp;appview=1" />)
          break

        case 'goenner':
          setModal(<IFrameModal src="https://bajour.payrexx.com/pay?tid=0b435ae8&amp;appview=1" />)
          break

        case 'full':
          setModal(<IFrameModal src="https://bajour.payrexx.com/pay?tid=0b423ae7&amp;appview=1" />)
          break

        case 'briefingarchiv':
          setModal(
            // TODO use wenn basel briefing wieder da dein soll
            // <IFrameModal src="https://us3.campaign-archive.com/home/?u=c30add995be4a0a845d9e933a&id=bed6b33c61" />
            <IFrameModal src="https://unterstuetzen.bajour.ch/" />
          )
          break

        case 'memberwerden':
          setModal(<IFrameModal src="https://bajour.lpages.co/memberwerden/" />)
          break

        default:
          setModal(null)
      }
    } else if (day >= 1 && day <= 6 && time >= 4 && time <= 10) {
      fetch('/api/latest-mailchimp-campaign').then(async res => {
        const jsonRes = await res.json()
        if (jsonRes === null) return setModal(null)
        const {id} = jsonRes

        const readCampaignID = localStorage.getItem('readMailchimpCampaignID')

        if (readCampaignID !== id) {
          // TODO use wenn basel briefing wieder da dein soll
          //setModal(<IFrameModal src={longArchiveURL} />)
          setModal(<IFrameModal src="https://unterstuetzen.bajour.ch/" />)
          localStorage.setItem('readMailchimpCampaignID', id)
        } else {
          setModal(null)
        }
      })
    } else {
      setModal(null)
    }
  }, [current])

  const {main, footer} = data ?? {}

  const mainNavi = main ? dataToNavigation(main) : []
  const footerNavi = footer ? dataToNavigation(footer) : []

  return (
    <BaseTemplate
      footerText={footerText}
      largeHeader={largeHeader}
      hideHeaderMobile={hideHeaderMobile}
      navigationItems={mainNavi}
      headerNavigationItems={mainNavi}
      imprintNavigationItems={footerNavi}
      footerNavigationItems={footerNavi}>
      {children}
      {modal}
    </BaseTemplate>
  )
}

function dataToNavigation(data: any): NavigationItem[] {
  return data.links
    .filter((link: {__typename: string}) => link.__typename == 'PageNavigationLink')
    .map((link: any) => linkToNavigationItem(link))
}

function linkToNavigationItem(link: any): NavigationItem {
  return {
    title: link.label,
    route: PageRoute.create({slug: link.page?.slug ?? undefined}),
    isActive: false
  }
}
