import {PrismaClient} from '@prisma/client'
import {clearFullDatabase, defineCrowdfundingFactory, initialize} from '@wepublish/testing'
import {CrowdfundingService} from './crowdfunding.service'

describe('Crowdfunding Service ', () => {
  const prismaClient = new PrismaClient()
  initialize({prisma: prismaClient})
  const crowdfundingService = new CrowdfundingService(prismaClient)

  const CrowdfundingFactory = defineCrowdfundingFactory({
    defaultData: {
      name: 'multi-goal-cf',
      goals: {
        createMany: {
          data: [
            {
              title: '250',
              amount: 250 * 100
            },
            {
              title: '500',
              amount: 500 * 100
            },
            {
              title: '750',
              amount: 750 * 100
            },
            {
              title: '1000',
              amount: 1000 * 100
            }
          ]
        }
      }
    }
  })

  beforeAll(async () => {
    await clearFullDatabase(prismaClient)
  })

  afterAll(async () => {
    await prismaClient.$disconnect()
  })

  it(`it get's correct crowdfunding goals`, async () => {
    const additionalRevenues: number[] = [0, 800 * 100, 20000 * 100]

    const crowdfundings = await Promise.all(
      additionalRevenues.map(
        async additionalRevenue =>
          await CrowdfundingFactory.create({
            additionalRevenue
          })
      )
    )

    const crowdfundingsDatabase = await Promise.all(
      crowdfundings.map(async cf => crowdfundingService.getCrowdfundingById(cf.id))
    )

    expect(crowdfundingsDatabase[0].activeCrowdfundingGoal?.amount).toBe(250 * 100)
    expect(crowdfundingsDatabase[1].activeCrowdfundingGoal?.amount).toBe(1000 * 100)
    expect(crowdfundingsDatabase[2].activeCrowdfundingGoal?.amount).toBe(1000 * 100)
  })
})
