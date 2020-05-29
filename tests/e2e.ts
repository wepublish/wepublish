import { ClientFunction, Role, Selector } from "testcafe";

const loginName = Selector('input').withAttribute('placeholder','Email')
const loginPassword = Selector('input').withAttribute('placeholder','Password')
const createArticle = Selector('a').withAttribute('href', '/article/create')
const metadataButton = Selector('button.NavigationButton').child('span').withText('Metadata')
const createButton = Selector('button.NavigationButton').child('span').withText('Create')
const publishButton = Selector('button.NavigationButton').child('span').withText('Publish')
const backButton = Selector('a.NavigationButton').withAttribute('href', '/articles')

const closeButton = Selector('.Drawer button').child('span').withText('Close')
const metaPreTitleInput = Selector('.Drawer input').withAttribute('placeholder', 'Pre-title')
const metaTitleInput = Selector('.Drawer input').withAttribute('placeholder', 'Title')
const metaLeadInput = Selector('.Drawer textarea').withAttribute('placeholder', 'Lead')

const articleTitleInput = Selector('textarea').withAttribute('placeholder', 'Title')
const articleLeadInput = Selector('textarea').withAttribute('placeholder', 'Lead Text')
const lastAddButton = Selector('button.IconButton').withAttribute('title','Add Block').nth(2)
const richTextButton = Selector('button.NavigationButton').child('span').withText('Rich Text')
const richTextBox = Selector('div').withAttribute('role','textbox')

const confirmButton = Selector('.Modal button').child('span').withText('Confirm')

const EDITOR_URL = process.env.E2E_TEST_EDITOR_URL
const WEBSITE_URL = process.env.E2E_TEST_WEBSITE_URL

console.log('WeBSITE', WEBSITE_URL)

function makeid(length) {
  let result           = '';
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const admin = Role(`${EDITOR_URL}/login`, async t => {
  await t
    .typeText(loginName, 'dev@wepublish.ch')
    .typeText(loginPassword, '123')
    .click('form > button')
});

const getPath = ClientFunction(() => {
  return document.location.pathname
});

const goToPath = ClientFunction((websiteUrl, articleID,articleTitle) => {
  return document.location.href = `${websiteUrl}/a/${articleID}/${articleTitle}`
});

fixture `Create and publish an article`
  .disablePageCaching
  .beforeEach(async t => {
    await t.useRole(admin)

  })
  .page(`${EDITOR_URL}`)


let articleID = ''
const articleTitle = makeid(15)

test('Create an article', async t => {
  await t
    .click(createArticle)

  await t
    .expect(await getPath()).contains('/article/create')

  await t
    .click(metadataButton)
    .typeText(metaPreTitleInput, 'This is a Pre-title')
    .typeText(metaTitleInput, articleTitle)
    .typeText(metaLeadInput, 'A very clickbaity lead')
    .click(closeButton)
    .typeText(articleTitleInput, 'This is the article Title')
    .typeText(articleLeadInput, 'This is the article lead')
    .click(lastAddButton)
    .click(richTextButton)
    .typeText(richTextBox, 'This is some random text')
    .click(createButton);

  const path = await getPath()
  articleID = path.substr(path.lastIndexOf('/') + 1)
  await t.expect(path).contains('/article/edit')
});

test
  .page(`${WEBSITE_URL}`)
  ('Test Website', async t => {
    await goToPath(WEBSITE_URL, articleID, articleTitle)
    const h1404 = Selector('h1')
    await t.expect(h1404.innerText).eql('404')
  })

test('Publish article', async t => {
  const articleBox = Selector('div.Box').child('a').withAttribute('href', `/article/edit/${articleID}`)
  const h3Title = Selector('h3').withText(articleTitle)
  await t
    .click(h3Title)
    .click(publishButton)
    .click(confirmButton)
    .click(backButton)
    .expect(articleBox.child('div').withText('Published')).ok()
})

test
  .page(`${WEBSITE_URL}`)
  ('Test Website', async t => {
    const h1Title = Selector('h1')
    await goToPath(WEBSITE_URL, articleID, articleTitle)

    await t
      .expect(h1Title.innerText).eql('This is the article Title')
  })
