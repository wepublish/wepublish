import {PrismaClient} from '@prisma/client'

export const getSetting = (name: string, setting: PrismaClient['setting']) =>
  setting.findUnique({
    where: {name}
  })

export const getSettings = (setting: PrismaClient['setting']) => setting.findMany({})
