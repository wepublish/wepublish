import {parse} from 'csv-parse'
import {ReadStream} from 'fs'
import {
  createSubscription,
  createUser,
  deleteSubscription,
  deleteUser,
  findMemberPlanByName,
  findUserByEmail
} from './private-api'
import {randomUUID} from 'crypto'
import {convertColumnsToRow, Row} from './row'

import {differenceInDays, differenceInMonths} from 'date-fns'
import {PaymentPeriodicity} from '../../api/private'

function oneAtOnce(stream: ReadStream, processor: (data: string[]) => Promise<void>) {
  return async function (data: string[]) {
    stream.pause()
    try {
      await processor(data)
    } catch (error) {
      console.error('Error processing data:', error)
    } finally {
      stream.resume()
    }
    return
  }
}

export async function migrateSubscriptionsFromStream(stream: ReadStream) {
  return new Promise((resolve, reject) => {
    stream
      .pipe(parse({delimiter: ';', fromLine: 2}))
      .on('data', oneAtOnce(stream, processRow))
      .on('end', resolve)
      .on('error', reject)
  })
}

export async function processRow(columns: string[]) {
  const row = convertColumnsToRow(columns)
  await migrateUser(row)
}

function convertToDate(dateString: string) {
  const [day, month, year] = dateString.split('.')
  return new Date(2000 + +year, +month - 1, +day, 12, 0, 0, 0)
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

async function migrateSubscription(userId: string, row: Row) {
  const {productName, email} = row
  const {startsAt, paidUntil} = extractPaidUntil(row)
  const {paymentPeriodicity, monthlyAmount} = extractPeriodicityAndMonthlyAmount(row)
  const memberPlan = await findMemberPlanByName(productName)
  if (!memberPlan) {
    throw new Error(`Member plan "${productName}" not found`)
  }

  console.log('   subscription create', email)
  await createSubscription({
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
    userID: userId
  })
}

const deleteUserWhenFound = true

async function migrateUser(row: Row) {
  const {email, streetAddress, zipCode, city, country, firstName, companyOrLastName} = row

  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    console.log('   user exists', email)
    if (deleteUserWhenFound) {
      console.log('   user delete', email)

      await Promise.all(
        existingUser.subscriptions.map(({id}) => {
          console.log('   subscription delete', email, id)
          return deleteSubscription(id)
        })
      )
      await deleteUser(existingUser.id)
    } else {
      return existingUser
    }
  }

  console.log('   user create', email)
  const user = await createUser({
    active: true,
    address: {
      streetAddress,
      zipCode,
      city,
      country
    },
    email,
    emailVerifiedAt: new Date().toISOString(),
    firstName,
    flair: undefined,
    name: companyOrLastName,
    preferredName: undefined,
    properties: [],
    roleIDs: undefined,
    userImageID: undefined,
    password: randomUUID()
  })

  if (!user) {
    console.error(`Adding user ${email} failed`)
    return
  }

  await migrateSubscription(user.id, row)
  return
}
