
import { ClientFunction, Role, Selector } from "testcafe";
import { slugify } from '../config/utilities'
import * as process from "process";

const loginName = Selector('input').withAttribute('autocomplete', 'username')
const loginPassword = Selector('input').withAttribute('autocomplete', 'currentPassword')
const createArticle = Selector('a').withAttribute('href', '/article/create')
const metadataButton = Selector('button').child('i.rs-icon-newspaper-o')
const createButton = Selector('button').child('i.rs-icon-save')
const publishButton = Selector('button').child('i.rs-icon-cloud-upload')
const addContentButton = Selector('button').child('i.rs-icon-plus')

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
const userEmail = userName+'@mail.com'
const userPassword = getRandomString(3)

const userNameInput = Selector('input').withAttribute('name', 'Name')
const userEmailInput = Selector('input').withAttribute('name', 'Email')
const userPasswordInput = Selector('input').withAttribute('name', 'Password')

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

const goToPath = ClientFunction((websiteUrl, articleID) => {
    console.log('Goto Path', `${websiteUrl}/a/${articleID}`)
    document.location.href = `${websiteUrl}/a/${articleID}`
});

const goToPagePath = ClientFunction((websiteUrl, pageID) => {
    console.log('Goto Path', `${websiteUrl}/a/${pageID}`)
    document.location.href = `${websiteUrl}/a/${pageID}`
});

function getRandomString(length) {
    var randomChars = 'abcdefghijklmnopqrstuvwxyz';
    var result = '';
    for ( var i = 0; i < length; i++ ) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return result;
}


// not used 

// function makeid(length) {
//   let result = '';
//   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   const charactersLength = characters.length;
//   for (let i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * charactersLength));
//   }
//   return result;
// }


// const isLoggedIn = test('Is logged in', async t => {
//     console.log('is logged in', await ClientFunction(() => {
//       return document.location.toString()
//     })())
//     console.log('body looks like:', await Selector('body').innerText)
//     await t
//       .expect(Selector('i.rs-icon-cog').exists).ok()
//   })


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
    userEmailInput
    // isLoggedIn
}

