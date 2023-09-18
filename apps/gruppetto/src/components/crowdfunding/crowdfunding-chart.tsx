import {css, styled, useMediaQuery, useTheme} from '@mui/material'
import {ApiV2} from '@wepublish/website'
import getConfig from 'next/config'
import {ComponentProps, memo, useMemo} from 'react'
import {Area, ComposedChart, ResponsiveContainer, XAxis, YAxis} from 'recharts'
import {FinishPin} from './finish-pin'
import {MountainTopPin} from './mountain-pin'
import {PelotonPin} from './peloton-pin'
import {MountainName} from './mountain-name'
import {formatChf} from '../memberships/format-chf'
import {formatNumber} from '../../formatNumber'

const data = [
  {
    x: 0,
    y: 15 / 145
  },

  {
    x: 1 / 1125,
    y: 15 / 145
  },

  {
    x: 79 / 1125,
    y: 15 / 145
  },
  {
    x: 184 / 1125,
    y: 49 / 145
  },

  {
    x: 262 / 1125,
    y: 28 / 145
  },

  {
    x: 320 / 1125,
    y: 42 / 145
  },

  {
    x: 359 / 1125,
    y: 39 / 145
  },

  {
    x: 477 / 1125,
    y: 102 / 145
  },

  {
    x: 576 / 1125,
    y: 55 / 145
  },

  {
    x: 608 / 1125,
    y: 62 / 145
  },

  {
    x: 721 / 1125,
    y: 32 / 145
  },

  {
    x: 929 / 1125,
    y: 145 / 145
  },

  {
    x: 1125 / 1125,
    y: 32 / 145
  }
] as const

const milestones = {
  0: data[0],
  1000: data[3],
  2000: data[7],
  3000: data[11],
  3200: data[12]
} as const

const eligibleMemberPlans = [
  'Trichtenhausenstutz',
  'Stelvio',
  'Swiss Cycling',
  'Gruppetto',
  'Sankt Luzisteig',
  'Bernina'
]

const supporterOffset = 400

const calculateAmountSupporters = (
  subscriberData: ApiV2.SubscriptionsQuery | undefined
): number => {
  if (!subscriberData) return 0
  else {
    return (
      subscriberData.activeSubscribers.filter(s => eligibleMemberPlans.includes(s.memberPlan))
        .length + supporterOffset
    )
  }
}

const getPositon = (supporters: number) => (supportersScale: number, min: number, max: number) => {
  const scale = max - min
  const percent = supporters / supportersScale

  return Math.min(min + scale * percent, 1)
}

const calculationPosition = (supporters: number): number => {
  const keys = Object.keys(milestones) as `${keyof typeof milestones}`[]
  const vales = Object.values(milestones)

  if (!supporters) {
    return 0
  }

  try {
    for (let i = 0; i < keys.length; i++) {
      const key = +keys[i]
      const prevKey = +keys[i - 1]

      if (supporters <= key) {
        return getPositon(supporters - prevKey)(key - prevKey, vales[i - 1].x, vales[i]?.x ?? 0)
      }
    }
  } catch {
    //
  }

  return 1
}

const CrowdfundingChartWrapper = styled('div')`
  padding: ${({theme}) => theme.spacing(2)};
  // enable hardware acceleration to fix performance issues on mobile
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000;
`

const CrowdfundingChartInnerWrapper = styled('div')`
  display: grid;
  align-items: flex-end;
  position: relative;
  margin-top: 315px;
  width: 100%;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      margin-top: 200px;
    }
  `}
`

const CrowdfundingChart = (props: ComponentProps<typeof CrowdfundingChartWrapper>) => {
  const theme = useTheme()
  const enableAnimations = useMediaQuery(theme.breakpoints.up('lg'))
  const {data: subscriberData} = ApiV2.useSubscriptionsQuery()

  const amountSupporters = calculateAmountSupporters(subscriberData)
  const position = calculationPosition(amountSupporters)
  const gradientOffset = `${position * 100}%`
  const margin = useMemo(() => ({top: 0, bottom: 0, left: 0, right: 0}), [])

  return (
    <CrowdfundingChartWrapper {...props}>
      <CrowdfundingChartInnerWrapper>
        <ResponsiveContainer width="100%" height={195}>
          <ComposedChart data={data as any} margin={margin}>
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
              <linearGradient id="gradient">
                <stop offset={gradientOffset} stopColor={theme.palette.primary.main} />
                <stop offset={gradientOffset} stopColor={theme.palette.grey[300]} />
              </linearGradient>
            </svg>

            <XAxis dataKey={'x'} scale="linear" hide />
            <YAxis dataKey={'y'} scale="linear" hide />

            <Area
              type="linear"
              dataKey="y"
              fill={`url(#gradient)`}
              fillOpacity={1}
              stroke="transparent"
              isAnimationActive={enableAnimations}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <PelotonPin x={position} text={formatNumber(amountSupporters)} subText={`Fahrer:innen`} />

        <MountainTopPin {...milestones[1000]} pill="2" text={formatNumber(1000)} />
        <MountainTopPin {...milestones[2000]} pill="1" text={formatNumber(2000)} />
        <MountainTopPin {...milestones[3000]} pill="HC" text={formatNumber(3000)} />
        <FinishPin {...milestones[3200]} />

        <MountainName {...milestones[1000]} name={'Gempen'} />
        <MountainName {...milestones[2000]} name={'Ibergeregg'} />
        <MountainName {...milestones[3000]} name={'Umbrailpass'} />
      </CrowdfundingChartInnerWrapper>
    </CrowdfundingChartWrapper>
  )
}

const {publicRuntimeConfig} = getConfig()
const ConnectedCrowdfundingChart = memo(
  ApiV2.createWithV2ApiClient(publicRuntimeConfig.env.API_URL!)(CrowdfundingChart)
)
export {ConnectedCrowdfundingChart as CrowdfundingChart}
