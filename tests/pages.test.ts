import { ClientFunction, Selector } from "testcafe";
import {
    admin,
    EDITOR_URL,
    WEBSITE_URL,
    createPage,
    metadataButton,
    createButton,
    publishButton,
    closeButton,
    confirmButton,
    pageLeadInput,
    pageTitleInput,
    metaSlugInput,
    addContentButton,
    getPath,
    addTestingContent,
    checkTestingContentOnWebsite,
} from "./common";


console.log('Editor URL', EDITOR_URL)
console.log('Website URL', WEBSITE_URL)


fixture`Create and publish a page`
    .disablePageCaching
    .beforeEach(async t => {
        await t.useRole(admin)

    })
    .page(`${EDITOR_URL}/pages`)

test('Check Front site', async t => {
    await t
        .navigateTo(`${WEBSITE_URL}`)
        .expect(Selector('a').withAttribute('href', 'https://www.facebook.com/wepublish').getAttribute('target')).eql('_blank')
})

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

    await addTestingContent()

    const path = await getPath()
    // retrieve ID automatically created
    pageID = path.substr(path.lastIndexOf('/') + 1)
    console.log('path', path)
    console.log('pageID: ', pageID)
    await t.expect(path).contains('/page/edit')

    await t
        .click(metadataButton)
        .typeText(metaSlugInput, pageID)
        .click(closeButton)
        .click(publishButton)
        // Change this to next monday when date picker fixed
        .click(Selector('.react-datepicker__input-container'))
        .click(Selector('.react-datepicker__navigation--next'))
        .click(Selector('.react-datepicker__day').withText('30'))
        .click(confirmButton)
})


test('Test Website', async t => {
    await t
        .navigateTo(`${WEBSITE_URL}/${pageID}`)
        // Gives 500 error 
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
    await checkTestingContentOnWebsite()

})