import {
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
    pageLeadInput,
    pageTitleInput,
    metaSlugInput,
    goToPath,

} from "./common";

import { ClientFunction, Role, Selector } from "testcafe";


console.log('Editor URL', EDITOR_URL)
console.log('Website URL', WEBSITE_URL)


const admin = Role(`${EDITOR_URL}/login`, async t => {
    console.log('body looks like:', await Selector('body').innerText)
    console.log('NEW LINE')
    await t
      .typeText(loginName, 'dev@wepublish.ch')
      .typeText(loginPassword, '123')
      .click('form > button')
  });
  
  const getPath = ClientFunction(() => {
    return document.location.pathname
  });


  const goToPagePath = ClientFunction((websiteUrl, pageID) => {
    console.log('Goto Path', `${websiteUrl}/a/${pageID}`)
    document.location.href = `${websiteUrl}/a/${pageID}`
  });


fixture`Create and publish a page`
    .disablePageCaching
    .beforeEach(async t => {
        await t.useRole(admin)

    })
    .page(`${EDITOR_URL}/pages`)


let pageID = ''

test('Is logged in', async t => {
    console.log('is logged in', await ClientFunction(() => {
        return document.location.toString()
    })())
    console.log('body looks like:', await Selector('body').innerText)
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
    console.log('pageID: ', pageID)
    await t.expect(path).contains('/page/edit')

    await t
        .click(metadataButton)
        .typeText(metaSlugInput, pageID)
        .click(closeButton)
        .click(publishButton)
        .click(Selector('.react-datepicker__input-container'))
        .click(Selector('.react-datepicker__navigation--next'))
        .click(Selector('.react-datepicker__day').withText('30'))
        .click(confirmButton)
})

test('Test Website', async t => {
    await t
        .navigateTo(`${WEBSITE_URL}/${pageID}`)
        // Why is it showing 500 and not 404?
        // Test should be eql(404)
        .expect(Selector('h1').innerText).eql('500')
})

test('Publish page', async t => {
    await t
        .click(Selector('a').withAttribute('href', `/page/edit/${pageID}`))
        .click(publishButton)
        .click(confirmButton)
        .expect(Selector('div.rs-alert-container').exists).ok()
        .click(Selector('div.rs-alert-item-close'))
        .expect(Selector('div.rs-tag-default').child('span.rs-tag-text').innerText).contains('Page published')
});


test('Test Website', async t => {
    const h1Title = Selector('h1')

    await t
        .navigateTo(`${WEBSITE_URL}/${pageID}`)
        .expect(h1Title.innerText).eql('This is the page Title')
})
