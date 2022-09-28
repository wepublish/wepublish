import {PrismaClient} from '@prisma/client'
import {SettingName} from '@wepublish/api'
import {hashPassword} from '../src'

const seedSettings = (prisma: PrismaClient) => [
  prisma.setting.upsert({
    where: {
      name: SettingName.PEERING_TIMEOUT_MS
    },
    update: {},
    create: {
      name: SettingName.PEERING_TIMEOUT_MS,
      value: 3000,
      settingRestriction: {minValue: 1000, maxValue: 10000}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.ALLOW_GUEST_COMMENTING
    },
    update: {},
    create: {
      name: SettingName.ALLOW_GUEST_COMMENTING,
      value: false,
      settingRestriction: {allowedValues: {boolChoice: true}}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.ALLOW_GUEST_COMMENT_RATING
    },
    update: {},
    create: {
      name: SettingName.ALLOW_GUEST_COMMENT_RATING,
      value: false,
      settingRestriction: {allowedValues: {boolChoice: true}}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.ALLOW_GUEST_POLL_VOTING
    },
    update: {},
    create: {
      name: SettingName.ALLOW_GUEST_POLL_VOTING,
      value: false,
      settingRestriction: {allowedValues: {boolChoice: true}}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN
    },
    update: {},
    create: {
      name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN,
      value: 10080,
      settingRestriction: {minValue: 1, maxValue: 10080}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN
    },
    update: {},
    create: {
      name: SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN,
      value: 1440,
      settingRestriction: {minValue: 1, maxValue: 10080}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.INVOICE_REMINDER_FREQ
    },
    update: {},
    create: {
      name: SettingName.INVOICE_REMINDER_FREQ,
      value: 3,
      settingRestriction: {minValue: 0, maxValue: 30}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.INVOICE_REMINDER_MAX_TRIES
    },
    update: {},
    create: {
      name: SettingName.INVOICE_REMINDER_MAX_TRIES,
      value: 5,
      settingRestriction: {minValue: 0, maxValue: 10}
    }
  })
]

const seedRoles = (prisma: PrismaClient) => [
  prisma.userRole.upsert({
    where: {
      id: 'admin'
    },
    update: {},
    create: {
      id: 'admin',
      systemRole: true,
      name: 'Admin',
      description: 'Administrator Role',
      permissionIDs: []
    }
  }),
  prisma.userRole.upsert({
    where: {
      id: 'editor'
    },
    update: {},
    create: {
      id: 'editor',
      systemRole: true,
      name: 'Editor',
      description: 'Editor Role',
      permissionIDs: []
    }
  }),
  prisma.userRole.upsert({
    where: {
      id: 'peer'
    },
    update: {},
    create: {
      id: 'peer',
      systemRole: true,
      name: 'Peer',
      description: 'Peer Role',
      permissionIDs: []
    }
  })
]

const seedUsers = async (prisma: PrismaClient) => [
  prisma.user.upsert({
    where: {
      id: 'admin'
    },
    update: {},
    create: {
      id: 'admin',
      email: 'admin@wepublish.ch',
      emailVerifiedAt: new Date(),
      name: 'Admin',
      active: true,
      roleIDs: ['admin'],
      password: await hashPassword('123')
    }
  })
]

export async function seedBase(prisma: PrismaClient) {
  return prisma.$transaction([
    ...seedRoles(prisma),
    ...seedSettings(prisma),
    ...(await seedUsers(prisma))
  ])
}
