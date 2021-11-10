import { Selector } from "testcafe";
import {
    admin,
    EDITOR_URL,
    WEBSITE_URL,
    createPage,
    metadataButton,
    publishButton,
    drawerConfirmButton,
    modalCoonfirmButton,
    metaSlugInput,
    getPath,
    addTestingContent,
    checkTestingContentOnWebsite,
    createArticle,
    addTitleAndLead,
    metaPreTitleInput,
    checkOneColArticleOnWebsite,
    checkIfLoggedIn,
    addSlugButton
} from "./common";

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
    await checkIfLoggedIn()
})

// Create an article for later testing purposes
test('Create an article', async t => {
    await t
        .navigateTo(EDITOR_URL)
        .click(createArticle)

    await
        addTitleAndLead()

    await t
        .click(metadataButton)
        .typeText(metaPreTitleInput, 'Test article on page')
        .click(addSlugButton)
        .click(drawerConfirmButton)
        .click(publishButton)
        .click(modalCoonfirmButton)
});

test('Create a page', async t => {
    await t
        .click(createPage)

    await t
        .expect(await getPath()).contains('/page/create')

    await addTestingContent()

    const path = await getPath()
    pageID = path.substr(path.lastIndexOf('/') + 1)
    await t.expect(path).contains('/page/edit')

    await t
        .click(metadataButton)
        .typeText(metaSlugInput, pageID)
        .click(drawerConfirmButton)
        .click(publishButton)
        .click(Selector('.react-datepicker__input-container'))
        .click(Selector('.react-datepicker__navigation--next'))
        .click(Selector('.react-datepicker__day').withText('30'))
        .click(modalCoonfirmButton)
})


test('Test Website', async t => {
    await t
        .navigateTo(`${WEBSITE_URL}/${pageID}`)
        .expect(Selector('h1').innerText).eql('404')
})

test('Publish page', async t => {
    await t
        .click(Selector('a').withAttribute('href', `/page/edit/${pageID}`))
        .click(publishButton)
        .click(modalCoonfirmButton)
        .expect(Selector('div.rs-tag-default').child('span.rs-tag-text').innerText).contains('Page published')
});


test('Test Website', async t => {
    await t
        .navigateTo(`${WEBSITE_URL}/${pageID}`)
    await checkTestingContentOnWebsite()
    await checkOneColArticleOnWebsite()

})