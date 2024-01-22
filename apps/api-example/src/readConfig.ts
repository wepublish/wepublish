import fs from 'fs'
import YAML from 'yaml'

type General = {
  apolloPlayground: boolean
  apolloIntrospection: boolean
  bcryptHashCostFactor: number
  urlAdapter: string
  sessionTTLDays: number
}
type MailProvider = {
  id: string
  fromAddress: string
  replyToAddress: string
  webhookURL: string
  apiKey: string
  baseDomain: string
  webhookEndpointSecret: string
  mailDomain: string
  baseURL: string
}
type OAuthProvider = {
  name: string
  discoverUrl: string
  clientId: string
  clientKey: string
  redirectUri: string[]
  scopes: string[]
}
type PaymentProvider = {
  id: string
  type: string
  name: string
  offSessionPayments: boolean
  secretKey: string
  webhookEndpointSecret: string
  instanceName: string
  instanceAPISecret: string
  webhookApiKey: string
  psp: number[]
  pm: string[]
  vatRate: number
  apiKey: string
  userId: number
  countryId: number
  invoiceTemplateNewMembership: string
  invoiceTemplateRenewalMembership: string
  unitId: number
  taxId: number
  accountId: number
  invoiceTitleNewMembership: string
  invoiceTitleRenewalMembership: string
  invoiceMailSubjectNewMembership: string
  invoiceMailBodyNewMembership: string
  invoiceMailSubjectRenewalMembership: string
  invoiceMailBodyRenewalMembership: string
  markInvoiceAsOpen: boolean
}
type Challenge = {
  secret: string
  validTime: number
  width: number
  height: number
  background: string
  noise: number
  minValue: number
  maxValue: number
  operandAmount: number
  operandTypes: string[]
  mode: string
  targetSymbol: string
}

type Config = {
  general: General
  mailProvider: MailProvider
  OAuthProviders: OAuthProvider[]
  paymentProviders: PaymentProvider[]
  challenge: Challenge
}

export async function readConfig(path: string): Promise<Config> {
  const file = fs.readFileSync(path, 'utf8')
  return YAML.parse(file)
}
