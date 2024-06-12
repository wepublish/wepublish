import {PrismaClient} from '@prisma/client'
import {SettingName} from '../../settings/api/src/lib/setting'

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
      name: SettingName.MAKE_NEW_SUBSCRIBERS_API_PUBLIC
    },
    update: {},
    create: {
      name: SettingName.MAKE_NEW_SUBSCRIBERS_API_PUBLIC,
      value: false,
      settingRestriction: {allowedValues: {boolChoice: true}}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.MAKE_ACTIVE_SUBSCRIBERS_API_PUBLIC
    },
    update: {},
    create: {
      name: SettingName.MAKE_ACTIVE_SUBSCRIBERS_API_PUBLIC,
      value: false,
      settingRestriction: {allowedValues: {boolChoice: true}}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.MAKE_RENEWING_SUBSCRIBERS_API_PUBLIC
    },
    update: {},
    create: {
      name: SettingName.MAKE_RENEWING_SUBSCRIBERS_API_PUBLIC,
      value: false,
      settingRestriction: {allowedValues: {boolChoice: true}}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.MAKE_NEW_DEACTIVATIONS_API_PUBLIC
    },
    update: {},
    create: {
      name: SettingName.MAKE_NEW_DEACTIVATIONS_API_PUBLIC,
      value: false,
      settingRestriction: {allowedValues: {boolChoice: true}}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.MAKE_EXPECTED_REVENUE_API_PUBLIC
    },
    update: {},
    create: {
      name: SettingName.MAKE_EXPECTED_REVENUE_API_PUBLIC,
      value: false,
      settingRestriction: {allowedValues: {boolChoice: true}}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.MAKE_REVENUE_API_PUBLIC
    },
    update: {},
    create: {
      name: SettingName.MAKE_REVENUE_API_PUBLIC,
      value: false,
      settingRestriction: {allowedValues: {boolChoice: true}}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.COMMENT_CHAR_LIMIT
    },
    update: {},
    create: {
      name: SettingName.COMMENT_CHAR_LIMIT,
      value: 1000,
      settingRestriction: {allowedValues: {minValue: 0, maxValue: 10000}}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.ALLOW_COMMENT_EDITING
    },
    update: {},
    create: {
      name: SettingName.ALLOW_COMMENT_EDITING,
      value: false,
      settingRestriction: {allowedValues: {boolChoice: true}}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.HEAD_SCRIPT
    },
    update: {},
    create: {
      name: SettingName.HEAD_SCRIPT,
      value: '',
      settingRestriction: {inputLength: 10000}
    }
  }),
  prisma.setting.upsert({
    where: {
      name: SettingName.BODY_SCRIPT
    },
    update: {},
    create: {
      name: SettingName.BODY_SCRIPT,
      value: '',
      settingRestriction: {inputLength: 10000}
    }
  }),

  // remove non-used settings
  prisma.setting.deleteMany({
    where: {
      name: 'invoiceReminderMaxTries'
    }
  }),
  prisma.setting.deleteMany({
    where: {
      name: 'invoiceFreqReminder'
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

export async function seed(prisma: PrismaClient) {
  return prisma.$transaction([...seedRoles(prisma), ...seedSettings(prisma)])
}
