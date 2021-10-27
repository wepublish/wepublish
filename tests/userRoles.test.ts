import { ClientFunction, Selector, t } from "testcafe";

import {
    admin,
    getPath,
    EDITOR_URL,
    closeButton,
    loginName,
    loginPassword,
    userName,
    userEmail,
    userPassword,
    userNameInput,
    userEmailInput,
    userPasswordInput,
    createArticle,
    articleTitleInput,
    articleLeadInput,
    createButton,
    userOne
    // isLoggedIn
} from "./common"


// login as an admin and add the create and delete article permission to the user role,
//  login as the user again and create a new article, save the article. Expect the 
// article to be saved. Delete the article and expect it to be deleted.

fixture`Create a user role`
    .disablePageCaching
    .beforeEach(async t => {
        await t.useRole(admin)

    })
    .page(`${EDITOR_URL}/userroles`)

const userRoleName = userName
test('create a role', async t => {
    await t
        .navigateTo(`${EDITOR_URL}/userroles`)
        .click(Selector('a').withAttribute('href', '/userrole/create'))

    await t
        .expect(await getPath()).contains('/userrole/create')

    await t
        .typeText(userNameInput, userName)
        .typeText(Selector('input').withAttribute('name', 'Description'), userName + ' role')
        .click(Selector('a').withAttribute('role', 'combobox'))
        .click(Selector('label').withText('Allows to get article'))
        .click(Selector('label').withText('Allows to get all articles'))
        .click(Selector('.rs-picker-search-bar-input'))
        .typeText(Selector('.rs-picker-search-bar-input'), 'editor')
        .click(Selector('label').withText('Allows to login editor'))
        .click(closeButton)
})

test('create new user and add user role', async t => {
    await t
        .navigateTo(`${EDITOR_URL}/users`)
        .click(Selector('a').withAttribute('href', '/user/create'))

    await t
        .expect(await getPath()).contains('/user/create')

    await t
        .typeText(userNameInput, userName)
        .typeText(userEmailInput, userEmail)
        .typeText(userPasswordInput, userPassword)
        .click(Selector('a').withAttribute('name', 'User Roles'))
        .click(Selector('label').withText(userRoleName))
        .click(Selector('input').withAttribute('name', 'Preferred Name'))
        .click(Selector('.rs-drawer-footer').child().withText('Create'))
        .navigateTo(`${EDITOR_URL}/users`)
        .expect(Selector('a').withText(userName).exists).ok()
})

// login as user, try to create a new article and expect an error, try to delete an article and expect an error.

// test('log in as user and create article', async t => {
//     console.log(userEmail, userPassword)
//     await t
//         .click(Selector('i.rs-icon-cog'))
//         .click(Selector('a').withAttribute('href', '/logout'))
//     await t
//         .typeText(loginName, userEmail)
//         .typeText(loginPassword, userPassword)
//         .click('form > button')
//         .expect(Selector('i.rs-icon-cog').exists).ok()
//         .navigateTo(EDITOR_URL)
//         .click(createArticle)
//         .typeText(articleTitleInput, 'This is the article Title')
//         .typeText(articleLeadInput, 'This is the article lead')
//         .click(createButton)
//         // expect error ok
//         .click(Selector('a').child('i').withText('Back'))
//         .click(Selector('button').child('i.rs-icon-trash').nth(0))
//     // expect no delete possible

// })

test('login with userOne', async T => {
    await t
        .useRole(userOne)
        .navigateTo(EDITOR_URL)
        .click(createArticle)
        .typeText(articleTitleInput, 'This is the article Title')
        .typeText(articleLeadInput, 'This is the article lead')
        .click(createButton)
        // Here I get logged out after getting the message error
})

// test('delete an article', async t => {
//     await t
//         .navigateTo(EDITOR_URL)
//         .click(Selector('button').child('i.rs-icon-trash'))
// })
// test('create an article', async t => {

//     await t
//         .navigateTo(EDITOR_URL)
//         .click(createArticle)
//         .typeText(articleTitleInput, 'This is the article Title')
//         .typeText(articleLeadInput, 'This is the article lead')
//         .click(createButton)
//     await t
//     window.addEventListener('error', function (e) {
//         console.error(e.message);
//     });
// })(`Skip error but log it`, async t => {
//     console.log(await t.getBrowserConsoleMessages());

// });


// })


// test('log in with admin role', async t => {
//     await t
//         .typeText(loginName, userEmail)
//         .typeText(loginPassword, userPassword)
//         .click('form > button')
//         .expect(Selector('i.rs-icon-cog').exists).ok()
// })
