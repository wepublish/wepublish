import { Selector } from "testcafe";

import {
    admin,
    getPath,
    EDITOR_URL,
    WEBSITE_URL,
    metadataButton,
    publishButton,
    closeButton,
    confirmButton,
    metaPreTitleInput,
    metaTitleInput,
    metaLeadInput,
    createArticle,
    addTestingContent,
    checkTestingContentOnWebsite,
    checkIfLoggedIn, 
    loginName,
    loginPassword,
    userNameInput,
    createPage,
    metaSlugInput,
    addContentButton
} from './common'

fixture`Test peering`
  .disablePageCaching
//   .beforeEach(async t => {
//     await t.useRole(admin)

//   })
//   .page(`${EDITOR_URL}`)

let token = ''
  test('Create token in test editor', async t => {
    await t
    .navigateTo(`https://editor.demo.wepublish.media`)
    await t
    .typeText(loginName, 'dev@wepublish.ch')
    .typeText(loginPassword, '123')
    .click('form > button')
    .navigateTo(`https://editor.demo.wepublish.media/tokens`)
    .click(Selector('a').withAttribute('href', '/tokens/generate'))
    .typeText(Selector('input'), 'testPeering')
    .click(closeButton)
    token = await Selector('.rs-panel').textContent
    console.log('token is: ', token)
  })

test('Login to local editor, create peer', async t => {
    await t.useRole(admin)
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
    // to do - select a published article
    .click(Selector('div').withText('Published').parent().parent().parent())
    // .click(Selector('div.rs-list-item'))
    .click(Selector(closeButton))
    .click(Selector('button').child('i.rs-icon-save'))
    const path = await getPath()
    pageID = path.substr(path.lastIndexOf('/') + 1)
    await t
    .click(metadataButton)
    .typeText(metaSlugInput, pageID)
    .click(closeButton)
    .click(publishButton)
    .click(Selector('button').withText('Confirm'))
})