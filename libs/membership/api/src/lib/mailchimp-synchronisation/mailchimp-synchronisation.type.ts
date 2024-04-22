export type ConfigMergeFields = {
  searchKey: string
  mergeField: string
}

export type CostumModuleConfigProperties = {
  key: string
  value: string
}

export type CustomModuleConfig = {
  name: string
  fileName: string
  properties: CostumModuleConfigProperties[]
}

export type Config = {
  mailchimpListID: string | undefined
  mailchimpToken: string | undefined
  mailchimpDC: string | undefined
  wepUser: string | undefined
  wepPassword: string | undefined
  wepApiUrl: string | undefined
  subscriptions: ConfigMergeFields[]
  personalInfoFields: {
    firstName: {
      mergeField: string
    }
    lastName: {
      mergeField: string
    }
  }
  retarget: {
    days: number
    mergeField: string
  }
  hasSubscription: {
    mergeField: string
  }
  customModules?: CustomModuleConfig[]
}

export type mailchimpMergeFieldsType = {
  VORNAME: string
  NACHNAME: string
  PHONE: string
  MMERGE6: string | number // => "PLZ / Ort"
  MMERGE8: string | number // => "Strasse / Nr"
  MMERGE3: string | number
  MMERGE5: string | number
  MMERGE7: string | number
  MMERGE9: string | number // => "Member"
  MMERGE10: string | number //  => "Goenner"
  MMERGE11: string | number // => "spender"
  MMERGE12: string | number
  MMERGE13: string | number
  MMERGE14: string | number
  MMERGE15: string | number
  MMERGE16: string | number
  MMERGE17: string | number // => "unterstuetzer"
  MMERGE18: string | number
  MMERGE19: string | number
  MMERGE20: string | number
  MMERGE21: string | number
  MMERGE22: string | number
  MMERGE23: string | number
  MMERGE24: string | number
  MMERGE25: string | number
  MMERGE26: string | number
  MMERGE27: string | number
  MMERGE28: string | number
  MMERGE29: string | number // => Retarget
}

export type mailchimpMemberType = {
  id: string
  /* eslint-disable-next-line camelcase */
  email_address: string
  /* eslint-disable-next-line camelcase */
  full_name: string
  /* eslint-disable-next-line camelcase */
  merge_fields: mailchimpMergeFieldsType
}
