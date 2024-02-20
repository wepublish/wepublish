import {createContext, PropsWithChildren, useContext} from 'react'

type MailChimpProviderProps = PropsWithChildren<{campaigns: MailChimpCampaign[]}>

export interface MailchimpConfig {
  apiKey: string
  server: string
}

export interface MailChimpCampaignResponse {
  campaigns: MailChimpCampaign[]
}

export interface MailChimpCampaign {
  id: string
  long_archive_url: string
  settings: MailChimpCampaignSettings
}

export interface MailChimpCampaignSettings {
  subject_line: string
}

const MailChimpContext = createContext<MailChimpCampaign[]>([])

export const MailChimpProvider = ({children, campaigns}: MailChimpProviderProps) => {
  return <MailChimpContext.Provider value={campaigns}>{children}</MailChimpContext.Provider>
}

export const useMailChimpCampaigns = (): MailChimpCampaign[] => {
  const context = useContext(MailChimpContext)

  if (context == null) {
    throw new Error('MailChimpContext has not been provided.')
  }

  return context
}
