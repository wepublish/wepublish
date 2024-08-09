import {Config, mailchimpMemberType} from './mailchimp-synchronisation.type'
import {Injectable} from '@nestjs/common'
import {MemberPlan, PrismaClient, Subscription, User} from '@prisma/client'
const mailchimp = require('@mailchimp/mailchimp_marketing')
const punycode = require('punycode')

/**
const executeCustomModules = async () => {

    if(!config.customModules) {
        Sentry.captureMessage('Skiping load of custom module because none are configured!')
        return
    }

    for (const customModule of config.customModules) {
        Sentry.captureMessage(`load custom moduel ${customModule.name}`)
        const func = require(`./modules/${customModule.fileName}`)
        await func.execute(mailchimp,config,customModule,Sentry)
    }
}
**/

@Injectable()
export class MailchimpSynchronizationService {
  constructor(private readonly prismaService: PrismaClient) {
    mailchimp.setConfig({
      apiKey: config.mailchimpToken,
      server: config.mailchimpDC
    })
  }

  public async execute() {
    // Query WEP for all existing users
    let wepUsers = await this.prismaService.user.findMany({
      include: {
        Subscription: {
          include: {
            memberPlan: true
          }
        }
      }
    })

    // Query Mailchimp for all existing user
    const members = await this.getAllMailchimpUsers()

    // Iterate over wep users
    for (const wepUser of wepUsers) {
      // Ensure that mail address is correctly encoded
      wepUser.email = punycode.toASCII(wepUser.email)

      // Check if a wep user exists in mailchimp
      const foundMember: any = members.find(
        member =>
          punycode.toASCII(member.email_address.toLowerCase()) === wepUser.email.toLowerCase()
      )

      // prevent firstname form being null
      if (!wepUser.firstName) {
        wepUser.firstName = ''
      }

      if (foundMember) {
        const membership = this.getMemberPlanMapKey(wepUser, foundMember)

        // Check merged fields for updates
        let haveMergedFieldsChanged = false
        for (const mergeField of Object.keys(membership)) {
          // @ts-ignore
          if (foundMember.merge_fields[mergeField] !== membership[mergeField]) {
            haveMergedFieldsChanged = true
            break
          }
        }

        // Update user if fields have changed
        // console.log("wepUser:", JSON.stringify(wepUser))
        // console.log("foundMember:", JSON.stringify(foundMember))

        if (
          foundMember!.merge_fields[config.personalInfoFields.firstName.mergeField] !==
            wepUser.firstName.trim() ||
          foundMember!.merge_fields[config.personalInfoFields.lastName.mergeField] !==
            wepUser.name.trim() ||
          haveMergedFieldsChanged
        ) {
          const pf = config.personalInfoFields
          console.log('UPDATE ################### ' + wepUser.email + ' ########################')
          if (foundMember!.merge_fields[pf.firstName.mergeField] !== wepUser.firstName.trim())
            console.log(
              `FIRSTNAME: |${
                foundMember!.merge_fields[pf.firstName.mergeField]
              }| => |${wepUser.firstName.trim()}|`
            )
          if (foundMember!.merge_fields[pf.lastName.mergeField] !== wepUser.name.trim())
            console.log(
              `NACHNAME: |${
                foundMember!.merge_fields[pf.lastName.mergeField]
              }| => |${wepUser.name.trim()}|`
            )

          for (const field of config.subscriptions) {
            if (foundMember!.merge_fields[field.mergeField] !== membership[field.mergeField])
              console.log(
                `${field.searchKey.toUpperCase()}: |${
                  foundMember!.merge_fields[field.mergeField]
                }| => |${membership[field.mergeField]}|`
              )
          }
          if (
            foundMember!.merge_fields[config.hasSubscription.mergeField] !==
            membership[config.hasSubscription.mergeField]
          )
            console.log(
              'HAS SUB: |',
              foundMember!.merge_fields[config.hasSubscription.mergeField],
              '| => |',
              membership[config.hasSubscription.mergeField],
              '|'
            )
          if (
            foundMember!.merge_fields[config.retarget.mergeField] !==
            membership[config.retarget.mergeField]
          )
            console.log(
              'RETARGET: |',
              foundMember!.merge_fields[config.retarget.mergeField],
              '| => |',
              membership[config.retarget.mergeField],
              '|'
            )

          await this.mailchimpUpdateUser(foundMember.id, wepUser, membership)
        }
      } else {
        await this.mailchimpCreateUser(wepUser)
      }
    }

    // At the end execute custom modules if configured
    // await executeCustomModules()
  }

  private async getAllMailchimpUsers(): Promise<mailchimpMemberType[]> {
    // Function to get all mailchimp users
    let members: mailchimpMemberType[] = []
    let membersLastResponse: mailchimpMemberType[] = []
    let offset = 0

    // Fetch users until no more users can be fetched
    while (membersLastResponse.length > 0 || offset === 0) {
      console.log('Getting next <' + (offset + 1000) + '> mailchimp users...')
      const response = await mailchimp.lists.getListMembersInfo(config.mailchimpListID, {
        count: 1000,
        offset: offset
      })
      membersLastResponse = response.members
      members = members.concat(membersLastResponse)
      offset = offset + 1000
    }
    return members
  }

  private async mailchimpUpdateUser(
    mailchimpId: string,
    user: User & {Subscription: (Subscription & {memberPlan: MemberPlan})[]},
    mergeFields: any
  ) {
    const userObj = {
      merge_fields: {
        [config.personalInfoFields.firstName.mergeField]:
          user.firstName === '' ? 'Unbekannt' : user.firstName,
        [config.personalInfoFields.lastName.mergeField]: user.name,
        ...mergeFields
      }
    }

    // return // SAFETY SWITCH
    /* eslint-disable-next-line no-unreachable */
    try {
      await mailchimp.lists.updateListMember(config.mailchimpListID, mailchimpId, userObj)
    } catch (e) {
      console.log(e)
      console.log(`Failed to update user ${JSON.stringify(userObj)} with error: ${e}`)
    }
  }

  private async mailchimpCreateUser(
    user: User & {Subscription: (Subscription & {memberPlan: MemberPlan})[]}
  ) {
    const userObj = {
      email_address: user.email,
      merge_fields: {
        [config.personalInfoFields.firstName.mergeField]:
          user.firstName === '' ? 'Unbekannt' : user.firstName,
        [config.personalInfoFields.lastName.mergeField]: user.name,
        ...this.getMemberPlanMapKey(user)
      },
      status: 'subscribed'
    }
    console.log('CREATE ################### ' + user.email + ' ########################')
    console.log(userObj)
    // return // SAFETY SWITCH
    /* eslint-disable-next-line no-unreachable */
    try {
      await mailchimp.lists.addListMember(config.mailchimpListID, userObj)
    } catch (e) {
      console.log(e)
      console.log(`Failed to create new user ${JSON.stringify(userObj)} with error: ${e}`)
    }
  }

  private getMemberPlanMapKey(
    wepUser: User & {Subscription: (Subscription & {memberPlan: MemberPlan})[]},
    mailchimpMember: mailchimpMemberType | undefined = undefined
  ) {
    // Generate empty list of merge fields
    const mergeFields = this.getAllUsedMergeFieldsFromConfig(config)
    let membership: any = {}
    mergeFields.forEach(value => (membership[value] = ''))

    let latelyExpired = []
    for (const subscription of wepUser.Subscription) {
      const subscriptionState = this.getSubscriptionValue(subscription)
      latelyExpired.push(subscriptionState.latelyExpired)

      // Iterate over all configured fields and assign them in case of match
      for (const field of config.subscriptions) {
        if (subscription.memberPlan.slug.includes(field.searchKey)) {
          membership[field.mergeField] = this.upgradeMemberStatusOnly(
            membership[field.mergeField],
            subscriptionState.active
          )
        }
      }
    }

    const mergeFieldsToSumUp = this.getAllUsedMergeFieldsFromConfig(config, true)
    // Set unterstützer field
    let expiredUnterstutzer = false
    for (const FieldKey in membership) {
      if (mergeFieldsToSumUp.includes(FieldKey)) {
        if (membership[FieldKey] === 1) {
          membership[config.hasSubscription.mergeField] = 1
        } else if (membership[FieldKey] === -1) {
          expiredUnterstutzer = true
        }
      }
    }
    if (expiredUnterstutzer && membership[config.hasSubscription.mergeField] === '') {
      membership[config.hasSubscription.mergeField] = -1
    }

    // Set retarget field
    if (membership[config.hasSubscription.mergeField] !== 1 && latelyExpired.includes(1)) {
      membership[config.retarget.mergeField] = 1
    }
    return membership
  }

  private getSubscriptionValue(subscription: Subscription) {
    let latelyExpired: number | string = ''
    let active = -1
    if (!subscription.paidUntil) {
      return {
        active,
        latelyExpired
      }
    }
    if (new Date(subscription.paidUntil) >= new Date()) {
      active = 1
    } else {
      if (
        new Date(subscription.paidUntil).getTime() >=
        new Date().getTime() - config.retarget.days * 24 * 60 * 60 * 1000
      ) {
        latelyExpired = 1
      }
    }

    return {
      active,
      latelyExpired
    }
  }

  private upgradeMemberStatusOnly(originalValue: number | string, newValue: number) {
    if (originalValue === '' || originalValue === -1) return newValue
    else return originalValue
  }

  private getAllUsedMergeFieldsFromConfig(config: Config, onlyFields: boolean = false): string[] {
    const mergeFields: string[] = []
    if (!onlyFields) {
      mergeFields.push(config.retarget.mergeField)
      mergeFields.push(config.hasSubscription.mergeField)
    }
    config.subscriptions.forEach(value => mergeFields.push(value.mergeField))
    return mergeFields
  }
}
