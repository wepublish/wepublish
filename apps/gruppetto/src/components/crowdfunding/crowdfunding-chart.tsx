import {css, styled, useMediaQuery, useTheme} from '@mui/material'
import {ApiV2} from '@wepublish/website'
import getConfig from 'next/config'
import {ComponentProps, memo, useMemo} from 'react'
import {Area, ComposedChart, ResponsiveContainer, XAxis, YAxis} from 'recharts'
import {formatChf} from './donate'
import {DustBus} from './dust-bus'
import {FinishPin} from './finish-pin'
import {GruppettoPin} from './gruppetto-pin'
import {MountainName} from './mountain-name'
import {MountainTopPin} from './mountain-pin'
import {PelotonPin} from './peloton-pin'

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
  15000: data[3],
  30000: data[7],
  50000: data[11],
  60000: data[12]
} as const

const getPositon = (money: number) => (moneyScale: number, min: number, max: number) => {
  const scale = max - min
  const percent = money / moneyScale

  return Math.min(min + scale * percent, 1)
}

const calculationPosition = (money: number): number => {
  const keys = Object.keys(milestones) as `${keyof typeof milestones}`[]
  const vales = Object.values(milestones)

  if (!money) {
    return 0
  }

  try {
    for (let i = 0; i < keys.length; i++) {
      const key = +keys[i]
      const prevKey = +keys[i - 1]

      if (money <= key) {
        return getPositon(money - prevKey)(key - prevKey, vales[i - 1].x, vales[i]?.x ?? 0)
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
  const {data: revenueData} = ApiV2.useRevenueQuery({
    variables: {
      start: new Date('2023-01-01').toISOString()
    }
  })

  const money = revenueData?.revenue.reduce((sum, invoice) => (sum += invoice.amount), 0) ?? 0
  const amountSupporters = revenueData?.revenue.length ?? 0
  const position = calculationPosition(money / 100)
  const gradientOffset = `${position * 100}%`
  const gruppettoOffset = Math.max(0.1, position * (1 - milestones[50000].x))
  const dustBusOffset = Math.max(0.25, position * 0.2)
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

        <PelotonPin
          x={position}
          text={formatChf(money / 100)}
          subText={`${amountSupporters} Fahrer:innen`}
        />
        {position > milestones[15000].x && <GruppettoPin x={position - gruppettoOffset} />}
        {position > milestones[15000].x && <DustBus x={position - dustBusOffset} />}

        <MountainTopPin {...milestones[15000]} pill="2" text={formatChf(15000)} />
        <MountainTopPin {...milestones[30000]} pill="1" text={formatChf(30000)} />
        <MountainTopPin {...milestones[50000]} pill="HC" text={formatChf(50000)} />
        <FinishPin {...milestones[60000]} />

        <MountainName {...milestones[15000]} name={'Gempen'} />
        <MountainName {...milestones[30000]} name={'Ibergeregg'} />
        <MountainName {...milestones[50000]} name={'Umbrailpass'} />
      </CrowdfundingChartInnerWrapper>
    </CrowdfundingChartWrapper>
  )
}

const {publicRuntimeConfig} = getConfig()
const ConnectedCrowdfundingChart = memo(
  ApiV2.createWithV2ApiClient(publicRuntimeConfig.env.API_URL!)(CrowdfundingChart)
)
export {ConnectedCrowdfundingChart as CrowdfundingChart}
