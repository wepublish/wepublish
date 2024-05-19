import express from 'express'
import request from 'supertest'
import {PrismaClient} from '@prisma/client'
import {StaticRouter} from '../../src/lib/static'
import {SettingName} from '@wepublish/settings/api'

let app: any
let prisma: PrismaClient

beforeAll(async () => {
  prisma = new PrismaClient()
  await prisma.$connect()

  app = express()
  const staticRouter = new StaticRouter(prisma)
  app.use('/static', staticRouter.getRouter())
})

describe('static scripts', () => {
  test('returns empty script if settings are empty', async () => {
    await prisma.setting.deleteMany({where: {name: SettingName.HEAD_SCRIPT}})
    await prisma.setting.deleteMany({where: {name: SettingName.BODY_SCRIPT}})

    const res1 = await request(app).get('/static/head.js')
    expect(res1.text).toEqual('')
    expect(res1.statusCode).toEqual(200)

    const res2 = await request(app).get('/static/body.js')
    expect(res2.text).toEqual('')
    expect(res2.statusCode).toEqual(200)
  })

  test('returns head script as head.js', async () => {
    await prisma.setting.deleteMany({where: {name: SettingName.HEAD_SCRIPT}})
    await prisma.setting.create({
      data: {name: SettingName.HEAD_SCRIPT, value: 'alert("hello")', settingRestriction: {}}
    })

    const res = await request(app).get('/static/head.js')

    expect(res.text).toEqual('alert("hello")')
    expect(res.statusCode).toEqual(200)
  })

  test('returns body script as body.js', async () => {
    await prisma.setting.deleteMany({where: {name: SettingName.BODY_SCRIPT}})
    await prisma.setting.create({
      data: {name: SettingName.BODY_SCRIPT, value: 'alert("bye")', settingRestriction: {}}
    })

    const res = await request(app).get('/static/body.js')

    expect(res.text).toEqual('alert("bye")')
    expect(res.statusCode).toEqual(200)
  })

  test('security headers are set', async () => {
    await prisma.setting.deleteMany({where: {name: SettingName.BODY_SCRIPT}})
    await prisma.setting.create({
      data: {name: SettingName.BODY_SCRIPT, value: 'alert("bye")', settingRestriction: {}}
    })

    const res = await request(app).get('/static/body.js')

    expect(res.headers['referrer-policy']).toEqual('no-referrer')
    expect(res.headers['x-content-type-options']).toEqual('nosniff')
    expect(res.headers['x-frame-options']).toEqual('DENY')
    expect(res.headers['cache-control']).toEqual('public, max-age=86400')
  })
})
