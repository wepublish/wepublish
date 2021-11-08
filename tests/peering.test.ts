import { de } from "date-fns/locale";
import { Selector, Role } from "testcafe";

import {
  admin,
  getPath,
  EDITOR_URL,
  WEBSITE_URL,
  metadataButton,
  publishButton,
  closeButton,
  confirmButton,
  createArticle,
  userNameInput,
  createPage,
  metaSlugInput,
  addContentButton,
  demoEditorUser,
  addTitleAndLead,
  checkTitleAndLeadOnWebsite,
  loginName,
  loginPassword
} from './common'

fixture`Test peering`
  .disablePageCaching `Test peering`
// .beforeEach(async t => {
//     await t.useRole(Role.anonymous());
// })
  // .page(`${EDITOR_URL}`)
  
let articleID = ''
let token = ''

test('Login to demo editor, create article and token', async t => {
  await t
    // .useRole(demoEditorUser)
    .navigateTo(`https://editor.demo.wepublish.media`)
    .typeText(loginName, 'dev@wepublish.ch')
    .typeText(loginPassword, '123')
    .click('form > button')
    .navigateTo(`https://editor.demo.wepublish.media/articles`)
  await t
    .click(createArticle)
  await addTitleAndLead()
  await t
    .click(metadataButton)
    .click(Selector('button').child('i.rs-icon-magic'))
    // check peerable box - already set to true by default
    .click(closeButton)
  const path = await getPath()
  articleID = path.substr(path.lastIndexOf('/') + 1)
  await t
    .click(publishButton)
    .click(confirmButton)
    .navigateTo(`https://editor.demo.wepublish.media/tokens`)
    .click(Selector('a').withAttribute('href', '/tokens/generate'))
    .typeText(Selector('input'), 'testPeering')
    .click(closeButton)
  token = await Selector('.rs-panel').textContent
  // console.log('token is: ', token)
})

test('Login to local editor, create peer', async t => {
  await t.useRole(admin)
  // await t
  // .navigateTo(`${EDITOR_URL}/login`)
  // .typeText(loginName, 'dev@wepublish.ch')
  // .typeText(loginPassword, '123')
  // .click('form > button')
    .navigateTo(`${EDITOR_URL}/peering`)
    .click(Selector('a').withAttribute('href', '/peering/create'))
    .typeText(userNameInput, 'testPeer')
    .typeText(Selector('input').withAttribute('name', 'URL'), "https://api.demo.wepublish.media")
    .typeText(Selector('input').withAttribute('name', 'Token'), token)
    .click(Selector('.fetchButton'))
    .click(closeButton)
    .expect(Selector('h5').withText('testPeer').exists).ok()
    .expect(Selector('p').withText('We.Publish Demo').exists).ok()
})

let pageID = ''

test('Publish page with peered article', async t => {
  await t.useRole(admin)
    .navigateTo(`${EDITOR_URL}/pages`)
  await t
    .click(createPage)
    .click(addContentButton)
    .click(Selector('a').child('i.rs-icon-ellipsis-v'))
    .click(Selector('button').child('i.rs-icon-plus-circle'))
    .click(Selector('a').withText('Peer Article'))
    .expect(Selector('h3').withText('We.Publish Demo - This is the Title').exists).ok()
    .click(Selector('h3').withText('We.Publish Demo - This is the Title'))
    .click(Selector(closeButton))
    .click(Selector('button').child('i.rs-icon-save'))
  const path = await getPath()
  pageID = path.substr(path.lastIndexOf('/') + 1)
  await t
    .click(metadataButton)
    .typeText(metaSlugInput, pageID)
    .click(closeButton)
    .expect(Selector('img.rs-avatar-image').exists).ok()
    .click(publishButton)
    .click(Selector('button').withText('Confirm'))
})


test('Check peered article on website', async t => {
  await t
    .navigateTo(`${WEBSITE_URL}/${pageID}`)
    .expect(Selector('h2').withText('This is the Title').exists).ok()
    .expect(Selector('div').withText('This is the lead').exists).ok()
    .expect(Selector('a').withAttribute('href', 'https://demo.wepublish.media').exists).ok()
    .click(Selector('h2').withText('This is the Title'))
  await checkTitleAndLeadOnWebsite()
  await t
    .expect(Selector('a').withAttribute('href', `https://demo.wepublish.media/a/${articleID}/this-is-the-title`).exists).ok()
    // .expect(Selector('p').withText('We.Publish Demo').exists).ok()
    .click(Selector('a').withAttribute('href', `https://demo.wepublish.media/a/${articleID}/this-is-the-title`))
  // get full path
  const path = getPath()
  await t.expect(path).eql(`/a/${articleID}/this-is-the-title`)
})


test('Delete peered article in demo editor', async t => {
  await t
  // .navigateTo(`https://editor.demo.wepublish.media`)
  .useRole(demoEditorUser)
  .navigateTo(`https://editor.demo.wepublish.media/articles`)
  const articleBox = Selector('a').withAttribute('href', `/article/edit/${articleID}`).parent()
  await t
    .click(articleBox.parent().parent().parent().child(1)
      .child().child().child().child('i.rs-icon-trash'))
          .click(Selector('button').withText('Confirm'))
          .expect(articleBox.exists).notOk()
})

test('Peered article not peerable anymore', async t => {
  await t
  .useRole(admin)
  .navigateTo(`${EDITOR_URL}/pages`)
  .click(Selector('a').withAttribute('href', `/page/edit/${pageID}`))
  .click(addContentButton)
  .click(Selector('a').child('i.rs-icon-ellipsis-v'))
  .click(Selector('button').child('i.rs-icon-plus-circle'))
  .click(Selector('a').withText('Peer Article'))
  .expect(Selector('h3').withText('We.Publish Demo - This is the Title').exists).notOk()
  .click(Selector('button').withText('Close'))
  .click(publishButton)
  .click(Selector('button').withText('Confirm'))
  // navigate to website and expect article not to be there ?
})

test('Delete Peer', async t => {
  await t
  .useRole(admin)
  .navigateTo(`${EDITOR_URL}/peering`)
  // Select right peer ?
  .click(Selector('i.rs-icon-trash'))
  .click(Selector('button').withText('Confirm'))
  .expect(Selector('h5').withText('testPeer').exists).notOk()
})

test('Delete token', async t => {
  await t
  .useRole(demoEditorUser)
  await t
  .navigateTo(`https://editor.demo.wepublish.media/tokens`)
  await t
  .click(Selector('div.div.rs-flex-box-grid-item-23').parent().child().nth(1).child())
})


// create article in demo editor, peer it, check if displayed on website, then delete it, 
// check if not peerable anymore, delete token

