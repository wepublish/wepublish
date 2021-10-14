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

// test('Check Front site', async t => {
// await t
//   .navigateTo(`${WEBSITE_URL}`)
//   .expect(Selector('a').withAttribute('href', 'https://www.facebook.com/wepublish').getAttribute('target')).eql('_blank')
// })

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
  .click(createButton)

const path = await getPath()
pageID = path.substr(path.lastIndexOf('/') + 1)
await t.expect(path).contains('/page/edit')

await t
  .click(metadataButton)
  .click(closeButton)
  .click(publishButton)
  .click(Selector('.react-datepicker__input-container'))
  .click(Selector('.react-datepicker__navigation--next'))
  .click(Selector('.react-datepicker__day').withText('30'))
  .click(confirmButton)
})


test('Test Website', async t => {
  await t
    .navigateTo(`${WEBSITE_URL}`)
    .expect(Selector('h1').innerText).eql('404')
})

test('Publish page', async t => {
await t
  .click(Selector('a').withAttribute('href',`/page/edit/${pageID}`))
  .click(publishButton)
  .click(confirmButton)
  .expect(Selector('div.rs-alert-container').exists).ok()
  .click(Selector('div.rs-alert-item-close'))
  .expect(Selector('div.rs-tag-default').child('span.rs-tag-text').innerText).contains('Page published')
});


test('Test Website', async t => {
  const h1Title = Selector('h1')

  await t
    .navigateTo(`${WEBSITE_URL}`)
    .expect(h1Title.innerText).eql('This is the page Title')
})
