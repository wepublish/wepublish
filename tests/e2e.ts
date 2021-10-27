import { ClientFunction, Selector } from "testcafe";

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
  checkTestingContentOnWebsite
} from "./common"


fixture`Create and publish an article`
  .disablePageCaching
  .beforeEach(async t => {
    await t.useRole(admin)

  })
  .page(`${EDITOR_URL}`)


let articleID = ''

test('Is logged in', async t => {
  console.log('is logged in', await ClientFunction(() => {
    return document.location.toString()
  })())
  console.log('body looks like:', await Selector('body').innerText)
  await t
    .expect(Selector('i.rs-icon-cog').exists).ok()
})

test('Create an article', async t => {
  await t
    .click(createArticle)

  await t
    .expect(await getPath()).contains('/article/create')

  await 
      addTestingContent()

  const path = await getPath()
  articleID = path.substr(path.lastIndexOf('/') + 1)
  console.log('articleID', articleID)
  await t.expect(path).contains('/article/edit')

  await t
    .click(metadataButton)
    .expect(metaTitleInput.value).contains('This is the Title')
    .expect(metaLeadInput.value).contains('This is the lead')
    .typeText(metaPreTitleInput, 'This is a Pre-title')
    .click(closeButton)
});

test('Test Website', async t => {
  await t
    .navigateTo(`${WEBSITE_URL}/a/${articleID}`)
    .expect(Selector('h1').innerText).eql('404')
})

test('Publish article', async t => {
  await t
    .click(Selector('a').withAttribute('href', `/article/edit/${articleID}`))
    .click(publishButton)
    .click(confirmButton)
    .expect(Selector('div.rs-alert-container').exists).ok()
    .click(Selector('div.rs-alert-item-close'))

  await t
    .click(metadataButton)
    .click(Selector('button').child('i.rs-icon-magic'))
    .click(closeButton)
    .click(publishButton)
    .click(confirmButton)
    .expect(Selector('div.rs-tag-default').child('span.rs-tag-text').innerText).contains('Article published')
})

test('Test Website', async t => {
  await t
    .navigateTo(`${WEBSITE_URL}/a/${articleID}`)
  await checkTestingContentOnWebsite()
})

test('Delete article', async t => {
  const articleBox = Selector('a').withAttribute('href', `/article/edit/${articleID}`).parent()

  await t
    .click(articleBox.parent().parent().parent().child(1)
      .child().child().child().child('i.rs-icon-trash'))
    .click(Selector('button').withText('Confirm'))
    .expect(articleBox.exists).notOk()
})



