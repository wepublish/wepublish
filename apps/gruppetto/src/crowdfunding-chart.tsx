import {css, styled, useTheme} from '@mui/material'
import {Area, ComposedChart, ResponsiveContainer, XAxis, YAxis} from 'recharts'
import {FinishPin} from './finish-pin'
import {GruppettoPin} from './gruppetto-pin'
import {MountainTopPin} from './mountain-pin'
import {PelotonPin} from './peloton-pin'
import {DustBus} from './dust-bus'
import {MountainName} from './mountain-name'

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

  for (let i = 0; i < keys.length - 1; i++) {
    const key = +keys[i]
    const prevKey = +keys[i - 1]

    if (money <= key) {
      return getPositon(money - prevKey)(key - prevKey, vales[i - 1].x, vales[i]?.x ?? 0)
    }
  }

  return 1
}

const CrowdfundingChartWrapper = styled('div')`
  padding: ${({theme}) => theme.spacing(1)};

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      padding: ${theme.spacing(2)};
    }
  `}
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

export const CrowdfundingChart = () => {
  const theme = useTheme()

  const m = 30000
  const position = calculationPosition(m)
  const gradientOffset = `${position * 100}%`
  const gruppettoOffset = Math.max(0.1, position * 0.4)
  const dustBusOffset = Math.max(0.25, position * 0.5)

  return (
    <CrowdfundingChartWrapper>
      <CrowdfundingChartInnerWrapper>
        <ResponsiveContainer width="100%" height={195}>
          <ComposedChart data={data as any} margin={{top: 0, bottom: 0, left: 0, right: 0}}>
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
            />
          </ComposedChart>
        </ResponsiveContainer>

        <PelotonPin milestone={{x: position}} text="CHF 50'000.-" />
        {position > milestones[15000].x && (
          <GruppettoPin milestone={{x: position - gruppettoOffset}} />
        )}
        {position > milestones[15000].x && <DustBus milestone={{x: position - dustBusOffset}} />}

        <MountainTopPin milestone={milestones[15000]} pill="2" text="CHF 15'000.-" />
        <MountainTopPin milestone={milestones[30000]} pill="1" text="CHF 30'000.-" />
        <MountainTopPin milestone={milestones[50000]} pill="HC" text="CHF 50'000.-" />
        <FinishPin milestone={milestones[60000]} />

        <MountainName milestone={milestones[15000]} name={'Gempen'} />
        <MountainName milestone={milestones[30000]} name={'Ibergeregg'} />
        <MountainName milestone={milestones[50000]} name={'Umbrailpass'} />
      </CrowdfundingChartInnerWrapper>
    </CrowdfundingChartWrapper>
  )
}
