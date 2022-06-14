import {Context} from '../../context'
import {authorise, CanCreatePayment} from '../permissions'
import {PaymentState, PrismaClient} from '@prisma/client'

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
  dbAdapter: Context['dbAdapter'],
  paymentClient: PrismaClient['payment']
) => {
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
      state: PaymentState.created,
      modifiedAt: new Date()
    }
  })

  const intent = await paymentProvider.createIntent({
    paymentID: payment.id,
    invoice,
    saveCustomer: true,
    successURL,
    failureURL
  })

  return await dbAdapter.payment.updatePayment({
    id: payment.id,
    input: {
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
