import fs from 'fs'
import YAML from 'yaml'
import {MappedReplacer} from 'mapped-replacer'

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

type Payrexx = {
  type: 'payrexx'
  id: string
  name: string
  instanceName: string
  instanceAPISecret: string
  offSessionPayments: boolean
  webhookApiKey: string
  psp: number[]
  pm: string[]
  vatRate: number
}

type PayrexxSubscription = {
  type: 'payrexx-subscription'
  id: string
  name: string
  instanceName: string
  instanceAPISecret: string
  webhookEndpointSecret: string
}

type Stripe = {
  type: 'stripe'
  id: string
  name: string
  offSessionPayments: boolean
  secretKey: string
  webhookEndpointSecret: string
}

type StripeCheckout = {
  type: 'stripe-checkout'
  id: string
  name: string
  offSessionPayments: boolean
  secretKey: string
  webhookEndpointSecret: string
}

type Bexio = {
  type: 'bexio'
  id: string
  name: string
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

type noCharge = {
  type: 'no-charge'
  id: string
  name: string
  offSessionPayments: boolean
}

type PaymentProvider = Payrexx | PayrexxSubscription | Stripe | StripeCheckout | Bexio | noCharge

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

function extractReplacer(input: string): string[] {
  const regex = /\${\s*(.*?)\s*}/g
  let matches
  const results: string[] = []

  while ((matches = regex.exec(input)) !== null) {
    if (matches.index === regex.lastIndex) {
      regex.lastIndex++
    }

    results.push(matches[1])
  }

  return results
}

export async function readConfig(path: string): Promise<Config> {
  const stringReplaceMap = new MappedReplacer()
  const file = fs.readFileSync(path, 'utf8')
  const replacers = extractReplacer(file)

  for (const replacer of replacers) {
    const insertValue = process.env[replacer]

    if (typeof insertValue === 'undefined') {
      throw new Error(`In config yaml used envoirment variable <${replacer}> not definded! `)
    }

    stringReplaceMap.addRule(`$\{${replacer}}`, `${insertValue}`)
  }

  return YAML.parse(stringReplaceMap.rulesCount() ? stringReplaceMap.replace(file) : file)
}
