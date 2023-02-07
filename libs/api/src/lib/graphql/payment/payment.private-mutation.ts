import {Context} from '../../context'
import {authorise} from '../permissions'
import {Payment, PaymentState, PrismaClient} from '@prisma/client'
import {CanCreatePayment} from '@wepublish/permissions/api'

export const createPaymentFromInvoice = async (
  input: {
    invoiceID: string
    paymentMethodID: string
    successURL: string
    failureURL: string
  },
  authenticate: Context['authenticate'],
  paymentProviders: Context['paymentProviders'],
  invoicesByID: Context['loaders']['invoicesByID'],
  paymentMethodsByID: Context['loaders']['paymentMethodsByID'],
  paymentClient: PrismaClient['payment']
): Promise<Payment> => {
  const {roles} = authenticate()
  authorise(CanCreatePayment, roles)

  const {invoiceID, paymentMethodID, successURL, failureURL} = input
  const paymentMethod = await paymentMethodsByID.load(paymentMethodID)
  const paymentProvider = paymentProviders.find(pp => pp.id === paymentMethod?.paymentProviderID)

  const invoice = await invoicesByID.load(invoiceID)

  if (!invoice || !paymentProvider) {
    throw new Error('Invalid data') // TODO: better error handling
  }

  const payment = await paymentClient.create({
    data: {
      paymentMethodID,
      invoiceID,
      state: PaymentState.created
    }
  })

  const intent = await paymentProvider.createIntent({
    paymentID: payment.id,
    invoice,
    saveCustomer: true,
    successURL,
    failureURL
  })

  return await paymentClient.update({
    where: {id: payment.id},
    data: {
      state: intent.state,
      intentID: intent.intentID,
      intentData: intent.intentData,
      intentSecret: intent.intentSecret,
      paymentData: intent.paymentData,
      paymentMethodID: payment.paymentMethodID,
      invoiceID: payment.invoiceID
    }
  })
}
