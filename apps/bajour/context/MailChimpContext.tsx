import React, {createContext, useContext} from 'react'

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

export const MailChimpProvider: React.FC<{
  children: React.ReactNode
  campaigns: MailChimpCampaign[]
}> = ({children, campaigns}) => {
  return <MailChimpContext.Provider value={campaigns}>{children}</MailChimpContext.Provider>
}

export const useMailChimpCampaigns = (): MailChimpCampaign[] => {
  const context = useContext(MailChimpContext)
  if (context === undefined) {
    throw new Error('useMailChimpCampaigns must be used within a MailChimpProvider')
  }
  return context
}
