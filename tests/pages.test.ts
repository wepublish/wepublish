import {
    admin, 
    getPath, 
    makeid, 
    EDITOR_URL, 
    WEBSITE_URL, 
    loginName,
    loginPassword,
    createPage,
    metadataButton,
    createButton,
    publishButton,
    closeButton,
    confirmButton,
    metaPreTitleInput,
    metaTitleInput,
    metaLeadInput,
    pageLeadInput,
    pageTitleInput,
    metaSlugInput
  } from "./e2e";

  import { ClientFunction, Role, Selector } from "testcafe";

fixture `Create and publish a page`
.disablePageCaching
.beforeEach(async t => {
  await t.useRole(admin)

})
.page(`${EDITOR_URL}/pages`)


let pageID = ''

test('Check Front site', async t => {
await t
  .navigateTo(`${WEBSITE_URL}`)
  .expect(Selector('a').withAttribute('href', 'https://www.facebook.com/wepublish').getAttribute('target')).eql('_blank')
})

test('Is logged in', async t => {
console.log('is logged in', await ClientFunction(() => {
  return document.location.toString()
})())
console.log('body looks like:',await Selector('body').innerText)
await t
  .expect(Selector('i.rs-icon-cog').exists).ok()
})

test('Create a page', async t => {
await t
  .click(createPage)

await t
  .expect(await getPath()).contains('/page/create')

await t
    .click(Selector('button').child('i.rs-icon-plus'))
    .click(Selector('a').child('i.rs-icon-header'))
  .typeText(pageTitleInput, 'This is the page Title')
  .typeText(pageLeadInput, 'This is the page lead')
  .click(createButton);

const path = await getPath()
pageID = path.substr(path.lastIndexOf('/') + 1)
console.log('pageID', pageID)
await t.expect(path).contains('/page/edit')

await t
  .click(metadataButton)
//   .expect(metaTitleInput.value).contains('This is the page Title')
//   .expect(metaLeadInput.value).contains('This is the page lead')
//   .typeText(metaPreTitleInput, 'This is a Pre-title')
  .typeText('input.metaSlugInput', pageID)
  .click(closeButton)
  .navigateTo(`${EDITOR_URL}/pages`)
//   change to have status set to draft (or add)
//   .expect(Selector('a').withAttribute(`/page/edit/${pageID}`).innerText).contains('This is the page Title')
})

/* await t
  .click(lastAddButton)
  .click(richTextButton)
  .typeText(richTextBox, 'This is some random text') */


// });

test('Test Website', async t => {
  await t
    .navigateTo(`${WEBSITE_URL}/a/${pageID}`)
    .expect(Selector('h1').innerText).eql('404')
})

test('Publish page', async t => {
await t
  .click(Selector('a').withAttribute('href',`/page/edit/${pageID}`))
  .click(publishButton)
  .click(confirmButton)
  .expect(Selector('div.rs-alert-container').exists).ok()
  .click(Selector('div.rs-alert-item-close'))

await t
  .click(metadataButton)
//   .click(Selector('button').child('i.rs-icon-magic'))
  .click(closeButton)
  .click(publishButton)
  .click(confirmButton)
  .expect(Selector('div.rs-tag-default').child('span.rs-tag-text').innerText).contains('Page published')
})

test('Test Website', async t => {
  const h1Title = Selector('h1')

  await t
    .navigateTo(`${WEBSITE_URL}/a/${pageID}`)
    // .expect(h1Title.innerText).eql('This is the page Title')
})

/* test('Delete article', async t => {
const articleBox = Selector('a').withAttribute('href', `/article/edit/${articleID}`).parent(1)
await t
  .click(articleBox.child('div').nth(1).child('div').nth(4).child('button'))
  .click(deleteButton)
  .click(confirmButton)
  .expect(articleBox.exists).notOk()
}) */
