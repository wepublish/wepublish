
import { ClientFunction, Role, Selector, t } from "testcafe";
import { slugify } from '../config/utilities'
import * as process from "process";

const loginName = Selector('input').withAttribute('autocomplete', 'username')
const loginPassword = Selector('input').withAttribute('autocomplete', 'currentPassword')
const createArticle = Selector('a').withAttribute('href', '/article/create')
const metadataButton = Selector('button').child('i.rs-icon-newspaper-o')
const createButton = Selector('button').child('i.rs-icon-save')
const publishButton = Selector('button').child('i.rs-icon-cloud-upload')
const addContentButton = Selector('button').child('i.rs-icon-plus')
const richtTextElement = Selector('h1').withAttribute('data-slate-node', 'element')

const closeButton = Selector('.rs-drawer-footer').child('button.rs-btn-primary')
const confirmButton = Selector('.rs-modal-footer').child('button.rs-btn-primary')
const deleteButton = Selector('button').child('i.rs-icon-trash')
const metaPreTitleInput = Selector('input.preTitle')
const metaTitleInput = Selector('input.title')
const metaLeadInput = Selector('textarea.lead')

const articleTitleInput = Selector('textarea').withAttribute('placeholder', 'Title')
const articleLeadInput = Selector('textarea').withAttribute('placeholder', 'Lead Text ')

const createPage = Selector('a').withAttribute('href', '/page/create')
const pageTitleInput = Selector('textarea').withAttribute('placeholder', 'Title')
const pageLeadInput = Selector('textarea').withAttribute('placeholder', 'Lead Text ')
const metaSlugInput = Selector('.metaSlugInput')

const EDITOR_URL = process.env.BRANCH_NAME ? `https://editor.${slugify(process.env.BRANCH_NAME.substring(0, 12))}.wepublish.dev` : process.env.E2E_TEST_EDITOR_URL
const WEBSITE_URL = process.env.BRANCH_NAME ? `https://www.${slugify(process.env.BRANCH_NAME.substring(0, 12))}.wepublish.dev` : process.env.E2E_TEST_WEBSITE_URL

const userName = getRandomString(7)
const userEmail = userName + '@mail.com'
const userPassword = getRandomString(3)

const userNameInput = Selector('input').withAttribute('name', 'Name')
const userEmailInput = Selector('input').withAttribute('name', 'Email')
const userPasswordInput = Selector('input').withAttribute('name', 'Password')

const videoUrl = '<iframe width="560" height="315" src="https://www.youtube.com/embed/evS8294sOXg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'

export function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
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


const testUser = Role(`${EDITOR_URL}/login`, async t => {
    await t
        .typeText(loginName, userEmail)
        .typeText(loginPassword, userPassword)
        .click('form > button')
});

export const demoEditorUser = Role('https://editor.demo.wepublish.media/login', async t => {
    await t
    // .navigateTo(`https://editor.demo.wepublish.media`)
    .typeText(loginName, 'dev@wepublish.ch')
    .typeText(loginPassword, '123')
    .click('form > button')
})

const getPath = ClientFunction(() => {
    return document.location.pathname
});

const goToPath = ClientFunction((websiteUrl, articleID) => {
    document.location.href = `${websiteUrl}/a/${articleID}`
});

const goToPagePath = ClientFunction((websiteUrl, pageID) => {
    document.location.href = `${websiteUrl}/a/${pageID}`
});

function getRandomString(length) {
    var randomChars = 'abcdefghijklmnopqrstuvwxyz';
    var result = '';
    for (var i = 0; i < length; i++) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return result;
}

export async function checkIfLoggedIn() {
    await t
    console.log('is logged in', await ClientFunction(() => {
        return document.location.toString()
    })())
    await t
        .expect(Selector('i.rs-icon-cog').exists).ok()
}


async function addTitleAndLead() {
    await t
        .click(addContentButton)
        .click(Selector('a').child('i.rs-icon-header'))
        .typeText(pageTitleInput, 'This is the Title')
        .typeText(pageLeadInput, 'This is the lead')
}

async function addImgGallery() {
    await t
        .click(addContentButton)
        .click(Selector('a').child('i.rs-icon-clone'))
        .click(Selector('.rs-drawer-content button i.rs-icon-plus-circle'))
        .setFilesToUpload(Selector('input').withAttribute('type', 'file'), './testPhoto1.JPG')
        .click(Selector('button').withText('Upload'))
        .click(Selector('button').withText('Save'))
}

async function addImg() {
    await t
        .click(addContentButton)
        .click(Selector('a').child('i.rs-icon-image'))
        .setFilesToUpload(Selector('input').withAttribute('type', 'file'), './testPhoto2.JPG')
        .click(Selector('button').withText('Upload'))
}

async function addListicle() {
    await t
        .click(addContentButton)
        .click(Selector('a').child('i.rs-icon-th-list'))
        .typeText(Selector('div').withAttribute('role', 'textbox'), 'Hello World')
}

async function addQuote() {
    await t
        .click(addContentButton)
        .click(Selector('a').child('i.rs-icon-quote-left'))
        .typeText(Selector('textarea').withAttribute('placeholder', 'Quote'), 'Hello World')
        .typeText(Selector('textarea').withAttribute('placeholder', 'Author'), 'Great author')
}

async function addEmbeddedVideo() {
    await t
        .click(addContentButton)
        .click(Selector('a').child('i.rs-icon-code'))
        .typeText(Selector('textarea').withAttribute('placeholder', 'Embed'), videoUrl)
        .click(Selector(closeButton))
}

export async function addOneColArticle() {
    await t
        .click(addContentButton)
        .click(Selector('a').child('i.rs-icon-ellipsis-v'))
        .click(Selector('button').child('i.rs-icon-plus-circle'))
        .click(Selector('div.rs-list-item'))
        .click(Selector(closeButton))
}

async function addRichText() {
    await t
        .click(addContentButton)
        .click(Selector('a').child('i.rs-icon-file-text'))
        .click(Selector('svg.bi-type-h1'))
        .typeText(Selector('h1'), 'This is a rich text element')
        .pressKey('ctrl+a')
        .click(Selector('i.rs-icon-italic'))
}


export async function addTestingContent() {
    await addTitleAndLead()
    await addImgGallery()
    await addImg()
    await addListicle()
    await addQuote()
    await addEmbeddedVideo()
    await addOneColArticle()
    await addRichText()
    await t
        .click(createButton);
}

export async function checkTitleAndLeadOnWebsite() {
    await t
        .expect(Selector('h1').withText('This is the Title').exists).ok()
        .expect(Selector('div').child().withText('This is the lead').exists).ok()
}

async function checkImgOnWebsite() {
    const imgSrc = Selector('img').getAttribute('src')
    const imgSrcCheck = (await imgSrc).slice(-14)
    console.log(imgSrcCheck)
    await t
        .expect(imgSrcCheck).eql('testPhoto2.JPG')
}

async function checkListicleOnWebsite() {
    await t
        .expect(Selector('div').withText('1').exists).ok()
        .expect(Selector('span').withAttribute('data-slate-string', "true")
            .withText('Hello\u00a0World').exists).ok()
}

async function checkQuoteOnWebsite() {
    await t
        .expect(Selector('blockquote').child().withText('Hello World').exists).ok()
        .expect(Selector('blockquote').child().withText('Great author').exists).ok()
}

async function checkEmbedVideoOnWebsite() {
    await t
        .expect(Selector('iframe')
            .withAttribute('src', 'https://www.youtube.com/embed/evS8294sOXg')
            .exists).ok()
}

async function checkImgGalleryOnWebsite() {
    await t
        .expect(Selector('svg').withAttribute('xmlns', 'http://www.w3.org/2000/svg').exists).ok()
}

async function checkRichTextOnWebsite() {
    await t
        .expect(richtTextElement
            .child().child().child().withText('This\u00a0is\u00a0a\u00a0rich\u00a0text\u00a0element').exists).ok()
        .expect(richtTextElement
            .child().child().child('em').exists).ok()
}

export async function checkOneColArticleOnWebsite() {
    await t
        .expect(Selector('span').withText('Test article on page').exists).ok()
}

export async function checkTestingContentOnWebsite() {
    await checkTitleAndLeadOnWebsite()
    await checkListicleOnWebsite()
    await checkEmbedVideoOnWebsite()
    await checkQuoteOnWebsite()
    await checkImgOnWebsite()
    await checkImgGalleryOnWebsite()
    await checkRichTextOnWebsite()
}


export {
    getRandomString,
    admin,
    createArticle,
    getPath,
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
    pageTitleInput,
    pageLeadInput,
    metaSlugInput,
    goToPath,
    goToPagePath,
    articleTitleInput,
    articleLeadInput,
    deleteButton,
    addContentButton,
    userName,
    userPassword,
    userEmail,
    userNameInput,
    userPasswordInput,
    userEmailInput,
    testUser,
    addTitleAndLead,
}

