import { ClientFunction, Role, Selector, t } from "testcafe";
import {slugify} from '../config/utilities'
import * as process from "process";

const loginName = Selector('input.username')
const loginPassword = Selector('input.password')
const createArticle = Selector('a').withAttribute('href', '/article/create')
const metadataButton = Selector('button').child('i.rs-icon-newspaper-o')
const createButton = Selector('button').child('i.rs-icon-save')
const publishButton = Selector('button').child('i.rs-icon-cloud-upload')

const closeButton = Selector('.rs-drawer-footer').child('button.rs-btn-primary')
const confirmButton = Selector('.rs-modal-footer').child('button.rs-btn-primary')
const metaPreTitleInput = Selector('input.preTitle')
const metaTitleInput = Selector('input.title')
const metaLeadInput = Selector('textarea.lead')

const articleTitleInput = Selector('textarea').withAttribute('placeholder', 'Title')
const articleLeadInput = Selector('textarea').withAttribute('placeholder', 'Lead Text ')

const EDITOR_URL = process.env.BRANCH_NAME ? `https://editor.${slugify(process.env.BRANCH_NAME.substring(0,12))}.wepublish.dev` : process.env.E2E_TEST_EDITOR_URL
const WEBSITE_URL = process.env.BRANCH_NAME ? `https://www.${slugify(process.env.BRANCH_NAME.substring(0,12))}.wepublish.dev` : process.env.E2E_TEST_WEBSITE_URL


const admin = Role(`${EDITOR_URL}/login`, async t => {
  await t
    .typeText(loginName, 'dev@wepublish.ch')
    .typeText(loginPassword, '123')
    .click('form > button')
});

const getPath = ClientFunction(() => {
  return document.location.pathname
});

fixture `Create and publish an article`
  .disablePageCaching
  .beforeEach(async t => {
    await t.useRole(admin)
  })
  .page`${EDITOR_URL}`


let articleID = ''

test('Check Front site', async t => {
  await t
    .navigateTo(`${WEBSITE_URL}`)
    .expect(Selector('a').withAttribute('href', 'https://www.facebook.com/wepublish').getAttribute('target')).eql('_blank')
})


test('Create an article', async t => {
  await t.navigateTo(EDITOR_URL)

  await t
    .click(createArticle)

  await t
    .expect(await getPath()).contains('/article/create')

  await t
    .typeText(articleTitleInput, 'This is the article Title')
    .typeText(articleLeadInput, 'This is the article lead')
    .click(createButton);

  const path = await getPath()
  articleID = path.substr(path.lastIndexOf('/') + 1)
  console.log('articleID', articleID)
  await t.expect(path).contains('/article/edit')

  await t
    .click(metadataButton)
    .expect(metaTitleInput.value).contains('This is the article Title')
    .expect(metaLeadInput.value).contains('This is the article lead')
    .typeText(metaPreTitleInput, 'This is a Pre-title')
    .click(closeButton)
});

test('Test Website', async t => {
    await t
      .navigateTo(`${WEBSITE_URL}/a/${articleID}`)
      .expect(Selector('h1').innerText).eql('404')
  })

test('Publish article', async t => {
  await t.navigateTo(EDITOR_URL).useRole(admin)

  await t
    .click(Selector('a').withAttribute('href',`/article/edit/${articleID}`))
    .click(publishButton)
    .expect(Selector('button').withAttribute('disabled').exists).ok()
    .click(Selector('button').withText('Close'))
           

  await t
    .click(metadataButton)
    .click(Selector('button').child('i.rs-icon-magic'))
    .click(closeButton)
    .click(publishButton)
    .click(confirmButton)
    .expect(Selector('div.rs-tag-default').child('span.rs-tag-text').innerText).contains('Article published')
})

test('Test Website', async t => {
    const h1Title = Selector('h1')

    await t
      .navigateTo(`${WEBSITE_URL}/a/${articleID}`)
      .expect(h1Title.innerText).eql('This is the article Title')
})
