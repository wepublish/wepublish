import {CircularProgress, Typography} from '@mui/material'
import styled from '@emotion/styled'
import {ApiV1, useUser} from '@wepublish/website'
import {GetServerSideProps} from 'next'
import Link from 'next/link'
import {useRouter} from 'next/router'
import {useEffect, useState} from 'react'

const ProgressWrapper = styled('div')`
  display: flex;
  justify-content: center;
`

const PaymentSuccessWrapper = styled('article')`
  display: grid;
  grid-template-columns: minmax(auto, 700px);
  gap: ${({theme}) => theme.spacing(5)};
  justify-content: center;
  justify-items: center;
`

const PaymentIcon = styled('svg')`
  width: 100px;
`

const ShareWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  background-color: ${({theme}) => theme.palette.background.default};
  padding: ${({theme}) => theme.spacing(4)};
`

const ShareLinkWrapper = styled('div')`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 24px;
  gap: ${({theme}) => theme.spacing(2)};
  justify-content: center;
`

const UnstyledButton = styled('button')`
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
`

type PaymentSuccessProps = {host?: string}

export default function PaymentSuccess({host}: PaymentSuccessProps) {
  const router = useRouter()
  const {hasUser, user} = useUser()
  const [hasOpenInvoices, setHasOpenInvoices] = useState<boolean>()

  const [checkInvoice] = ApiV1.useCheckInvoiceStatusLazyQuery()
  const [getInvoices] = ApiV1.useInvoicesLazyQuery({
    onCompleted: async data => {
      const invoices = await Promise.all(
        data?.invoices.map(async ({id}) => {
          const {data} = await checkInvoice({variables: {id}})

          return data?.checkInvoiceStatus
        })
      )

      const hasUnpaid = invoices.some(invoice => {
        if (!invoice?.paidAt && !invoice?.canceledAt) {
          return true
        }

        return false
      })

      setHasOpenInvoices(hasUnpaid)
    }
  })

  useEffect(() => {
    if (hasUser) {
      getInvoices()
    } else {
      router.push('/')
    }
  }, [hasUser, getInvoices, router])

  useEffect(() => {
    if (hasOpenInvoices) {
      router.push('/')
    }
  }, [hasOpenInvoices, router])

  //   Also show loading spinner if true
  if (hasOpenInvoices !== false) {
    return (
      <ProgressWrapper>
        <CircularProgress />
      </ProgressWrapper>
    )
  }

  const shareMessage = `Unterstütze das neue Radsport-Magazin aus der Schweiz ${host}`

  return (
    <PaymentSuccessWrapper>
      <PaymentIcon xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="#F084AD" strokeWidth="10" />
        <path
          stroke="#F084AD"
          strokeLinecap="round"
          strokeWidth="10"
          d="M23 53.8421 38.1111 69 74 33"
        />
      </PaymentIcon>

      <div>
        <Typography component="h1" variant="h3" marginBottom={3}>
          Danke! Deine Unterstützung ist bei uns angekommen.
        </Typography>

        <Typography variant="body1" marginBottom={1}>
          Freue dich auf dein Dankeschön-Päckli und auf die erste Ausgabe des Gruppetto-Magazins.
          Ohne deine Unterstützung wäre es nur halb so schön.
        </Typography>

        <Typography variant="body1">
          Wir haben dir eine Bestätigungsmail auf {user?.email} gesendet.
        </Typography>
      </div>

      <ShareWrapper>
        <Typography component="h2" variant="h5">
          Teile diese Seite und mache das Magazin noch bekannter.
        </Typography>

        <ShareLinkWrapper>
          <Link href={`https://wa.me/?text=${encodeURI(shareMessage)}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 35 34">
              <g clipPath="url(#a)">
                <path
                  fill="#F084AD"
                  d="M18.5 1c-8.836 0-16 7.164-16 16 0 3.0016.84312 5.8001 2.28125 8.2005L2.64323 33l7.96617-2.0911C12.9391 32.2334 15.6287 33 18.5 33c8.836 0 16-7.164 16-16s-7.164-16-16-16Zm-5.4766 8.53646c.26 0 .5272-.00159.7579.01042.2853.00666.5958.02756.8932.68492.3533.7813 1.1227 2.7414 1.2213 2.9401.0987.1986.1686.4327.0313.6927-.1307.2667-.1986.428-.3906.664-.1987.2294-.4164.5142-.5964.6875-.1987.1987-.4038.4165-.1745.8125.2294.396 1.0258 1.6942 2.2031 2.7422 1.5134 1.352 2.7902 1.7675 3.1875 1.9662.3974.1986.6275.1677.8568-.099.236-.26.9912-1.1521 1.2578-1.5495.26-.3973.5255-.3285.8854-.1979.3654.1307 2.3137 1.0904 2.711 1.2891.3973.1987.6578.297.7578.4583.1027.1667.1028.9601-.2266 1.8854-.3293.924-1.9465 1.8176-2.6718 1.8802-.732.068-1.4152.3291-4.7578-.9869-4.032-1.588-6.5748-5.7177-6.7735-5.9844-.1987-.26-1.6146-2.1471-1.6146-4.0938 0-1.9533 1.0242-2.9099 1.3828-3.3073.3654-.39728.7933-.49474 1.0599-.49474Z"
                />
              </g>
              <defs>
                <clipPath id="a">
                  <path fill="#fff" d="M.5 0h34v34H.5z" />
                </clipPath>
              </defs>
            </svg>
          </Link>

          <UnstyledButton onClick={() => navigator.clipboard.writeText(shareMessage)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 34 33">
              <rect width="33" height="33" x=".5" fill="#F084AD" rx="16.5" />
              <path
                fill="#fff"
                d="M7.28 17c0-2.052 1.668-3.72 3.72-3.72h4.8V11H11c-3.312 0-6 2.688-6 6s2.688 6 6 6h4.8v-2.28H11c-2.052 0-3.72-1.668-3.72-3.72Zm4.92 1.2h9.6v-2.4h-9.6v2.4ZM23 11h-4.8v2.28H23c2.052 0 3.72 1.668 3.72 3.72 0 2.052-1.668 3.72-3.72 3.72h-4.8V23H23c3.312 0 6-2.688 6-6s-2.688-6-6-6Z"
              />
            </svg>
          </UnstyledButton>
        </ShareLinkWrapper>

        <Typography component="h2" variant="h5">
          Wie wäre es noch mit einem Klick auf einen von denen hier?
        </Typography>

        <ShareLinkWrapper>
          <Link href="https://www.instagram.com/gruppettomag/">
            <svg viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 16.9697C0 25.8063 7.16344 32.9697 16 32.9697C24.8366 32.9697 32 25.8063 32 16.9697C32 8.13317 24.8366 0.969727 16 0.969727C7.16344 0.969727 0 8.13317 0 16.9697Z"
                fill="#F084AD"
              />
              <path
                d="M16 10.1699C18.2 10.1699 18.5 10.1699 19.4 10.1699C20.2 10.1699 20.6 10.3699 20.9 10.4699C21.3 10.6699 21.6 10.7699 21.9 11.0699C22.2 11.3699 22.4 11.6699 22.5 12.0699C22.6 12.3699 22.7 12.7699 22.8 13.5699C22.8 14.4699 22.8 14.6699 22.8 16.9699C22.8 19.2699 22.8 19.4699 22.8 20.3699C22.8 21.1699 22.6 21.5699 22.5 21.8699C22.3 22.2699 22.2 22.5699 21.9 22.8699C21.6 23.1699 21.3 23.3699 20.9 23.4699C20.6 23.5699 20.2 23.6699 19.4 23.7699C18.5 23.7699 18.3 23.7699 16 23.7699C13.7 23.7699 13.5 23.7699 12.6 23.7699C11.8 23.7699 11.4 23.5699 11.1 23.4699C10.7 23.2699 10.4 23.1699 10.1 22.8699C9.79995 22.5699 9.59995 22.2699 9.49995 21.8699C9.39995 21.5699 9.29995 21.1699 9.19995 20.3699C9.19995 19.4699 9.19995 19.2699 9.19995 16.9699C9.19995 14.6699 9.19995 14.4699 9.19995 13.5699C9.19995 12.7699 9.39995 12.3699 9.49995 12.0699C9.69995 11.6699 9.79995 11.3699 10.1 11.0699C10.4 10.7699 10.7 10.5699 11.1 10.4699C11.4 10.3699 11.8 10.2699 12.6 10.1699C13.5 10.1699 13.8 10.1699 16 10.1699ZM16 8.66992C13.7 8.66992 13.5 8.66992 12.6 8.66992C11.7 8.66992 11.1 8.86992 10.6 9.06992C10.1 9.26992 9.59995 9.56992 9.09995 10.0699C8.59995 10.5699 8.39995 10.9699 8.09995 11.5699C7.89995 12.0699 7.79995 12.6699 7.69995 13.5699C7.69995 14.4699 7.69995 14.7699 7.69995 16.9699C7.69995 19.2699 7.69995 19.4699 7.69995 20.3699C7.69995 21.2699 7.89995 21.8699 8.09995 22.3699C8.29995 22.8699 8.59995 23.3699 9.09995 23.8699C9.59995 24.3699 9.99995 24.5699 10.6 24.8699C11.1 25.0699 11.7 25.1699 12.6 25.2699C13.5 25.2699 13.8 25.2699 16 25.2699C18.2 25.2699 18.5 25.2699 19.4 25.2699C20.3 25.2699 20.9 25.0699 21.4 24.8699C21.9 24.6699 22.4 24.3699 22.9 23.8699C23.4 23.3699 23.6 22.9699 23.9 22.3699C24.1 21.8699 24.1999 21.2699 24.2999 20.3699C24.2999 19.4699 24.2999 19.1699 24.2999 16.9699C24.2999 14.7699 24.2999 14.4699 24.2999 13.5699C24.2999 12.6699 24.1 12.0699 23.9 11.5699C23.7 11.0699 23.4 10.5699 22.9 10.0699C22.4 9.56992 22 9.36992 21.4 9.06992C20.9 8.86992 20.3 8.76992 19.4 8.66992C18.5 8.66992 18.3 8.66992 16 8.66992Z"
                fill="white"
              />
              <path
                d="M16 12.6699C13.6 12.6699 11.7 14.5699 11.7 16.9699C11.7 19.3699 13.6 21.2699 16 21.2699C18.4 21.2699 20.3 19.3699 20.3 16.9699C20.3 14.5699 18.4 12.6699 16 12.6699ZM16 19.7699C14.5 19.7699 13.2 18.5699 13.2 16.9699C13.2 15.4699 14.4 14.1699 16 14.1699C17.5 14.1699 18.8 15.3699 18.8 16.9699C18.8 18.4699 17.5 19.7699 16 19.7699Z"
                fill="white"
              />
              <path
                d="M20.4 13.5699C20.9522 13.5699 21.4 13.1222 21.4 12.5699C21.4 12.0176 20.9522 11.5699 20.4 11.5699C19.8477 11.5699 19.4 12.0176 19.4 12.5699C19.4 13.1222 19.8477 13.5699 20.4 13.5699Z"
                fill="white"
              />
            </svg>
          </Link>

          <Link href="https://twitter.com/GruppettoMag">
            <svg viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0 16.9697C0 8.13317 7.16344 0.969727 16 0.969727C24.8366 0.969727 32 8.13317 32 16.9697C32 25.8063 24.8366 32.9697 16 32.9697C7.16344 32.9697 0 25.8063 0 16.9697ZM22.1 12.4697C22.8 12.3697 23.4 12.2697 24 11.9697C23.6 12.6697 23 13.2697 22.3 13.6697C22.5 18.3697 19.1 23.4697 13 23.4697C11.2 23.4697 9.5 22.8697 8 21.9697C9.7 22.1697 11.5 21.6697 12.7 20.7697C11.2 20.7697 10 19.7697 9.6 18.4697C10.1 18.5697 10.6 18.4697 11.1 18.3697C9.6 17.9697 8.5 16.5697 8.5 15.0697C9 15.2697 9.5 15.4697 10 15.4697C8.6 14.4697 8.1 12.5697 9 11.0697C10.7 13.0697 13.1 14.3697 15.8 14.4697C15.3 12.4697 16.9 10.4697 19 10.4697C19.9 10.4697 20.8 10.8697 21.4 11.4697C22.2 11.2697 22.9 11.0697 23.5 10.6697C23.3 11.4697 22.8 12.0697 22.1 12.4697Z"
                fill="#F084AD"
              />
            </svg>
          </Link>

          <Link href="https://www.strava.com/clubs/1095563">
            <svg viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect y="0.969727" width="32" height="32" rx="16" fill="#F084AD" />
              <path
                d="M19.1739 22.4184L17.2164 18.6454H14.3441L19.1739 27.9697L24 18.6454H21.1269M14.5597 13.513L17.2173 18.6445H21.1269L14.5597 5.96973L8 18.6454H11.9068"
                fill="white"
              />
            </svg>
          </Link>
        </ShareLinkWrapper>
      </ShareWrapper>
    </PaymentSuccessWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async ({req}) => {
  const host = `https://${req.headers.host || ''}`

  return {props: {host}}
}
