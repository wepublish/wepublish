import {Row} from './row'
import {PaymentPeriodicity, UserListQuery} from '../../api/private'
import {differenceInDays, differenceInMonths} from 'date-fns'
import {createSubscription, deleteSubscription, findMemberPlanByName} from './private-api'

export async function migrateSubscription(user: UserListQuery['users']['nodes'][number], row: Row) {
  const {productName, email} = row
  const {startsAt, paidUntil} = extractPaidUntil(row)
  const {paymentPeriodicity, monthlyAmount} = extractPeriodicityAndMonthlyAmount(row)

  const memberPlan = await findMemberPlanByName(productName)
  if (!memberPlan) {
    throw new Error(`Member plan "${productName}" not found`)
  }

  const existingSubscription = user.subscriptions.find(s => s.memberPlan.id === memberPlan.id)
  if (existingSubscription) {
    console.debug(' subscription exists ', [email, memberPlan.slug].join(' / '))
    return existingSubscription
  }

  console.debug(' subscription create ', [email, memberPlan.slug].join(' / '))
  return await createSubscription({
    autoRenew: false,
    deactivation: undefined,
    extendable: true,
    memberPlanID: memberPlan.id,
    monthlyAmount: +(monthlyAmount * 100).toFixed(0),
    paidUntil,
    paymentMethodID: memberPlan.availablePaymentMethods[0].paymentMethods[0].id,
    paymentPeriodicity,
    properties: [],
    startsAt,
    userID: user.id
  })
}

export async function deleteUserSubscriptions(user: UserListQuery['users']['nodes'][number]) {
  const {email} = user
  await Promise.all(
    user.subscriptions.map(({id, memberPlan}) => {
      console.debug(' subscription delete ', [email, memberPlan.slug].join(' / '))
      return deleteSubscription(id)
    })
  )
}

function extractPeriodicityAndMonthlyAmount(row: Row): {
  paymentPeriodicity: PaymentPeriodicity
  monthlyAmount: number
} {
  const {start, end, periodAmount} = row
  const startDate = convertToDate(start)
  const endDate = convertToDate(end)

  if (differenceInDays(endDate, startDate) < 35) {
    return {
      paymentPeriodicity: PaymentPeriodicity.Monthly,
      monthlyAmount: +periodAmount
    }
  }

  if (differenceInMonths(endDate, startDate) < 4) {
    return {
      paymentPeriodicity: PaymentPeriodicity.Quarterly,
      monthlyAmount: +periodAmount / 3
    }
  }

  if (differenceInMonths(endDate, startDate) < 7) {
    return {
      paymentPeriodicity: PaymentPeriodicity.Biannual,
      monthlyAmount: +periodAmount / 6
    }
  }
  return {
    paymentPeriodicity: PaymentPeriodicity.Yearly,
    monthlyAmount: +periodAmount / 12
  }
}

function extractPaidUntil(row: Row) {
  const {start, end, status} = row
  const startsAt = convertToDate(start).toISOString()
  const endDate = convertToDate(end).toISOString()
  return {
    startsAt,
    paidUntil: status === 'Bezahlt' ? endDate : undefined
  }
}

function convertToDate(dateString: string) {
  const [day, month, year] = dateString.split('.')
  return new Date(2000 + +year, +month - 1, +day, 12, 0, 0, 0)
}
