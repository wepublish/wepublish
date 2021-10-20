/*import { ClientFunction, Selector } from "testcafe";

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
    // isLoggedIn
} from "./common"

// create new user role with permissions to get an article, get all articles and allow editor login, create new user and add user role, login as user, try to create a new article and expect an error, try to delete an article and expect an error.

// login as an admin and add the create and delete article permission to the user role, login as the user again and create a new article, save the article. Expect the article to be saved. Delete the article and expect it to be deleted.
fixture`Create a user role`
    .disablePageCaching
    .beforeEach(async t => {
        await t.useRole(admin)

    })
    .page(`${EDITOR_URL}/userroles`)

    const    userRoleName = userName
test('create a role', async t => {
    await t
        .navigateTo(`${EDITOR_URL}/userroles`)
        .click(Selector('a').withAttribute('href', '/userrole/create'))

    await t
        .expect(await getPath()).contains('/userrole/create')

    await t
        .typeText(userNameInput, userName)
        .typeText(Selector('input').withAttribute('name', 'Description'), userName+' role' )
        .click(Selector('a').withAttribute('role', 'combobox'))
        .click(Selector('label').withText('Allows to get article'))
        .click(Selector('label').withText('Allows to get all articles'))
        // this one is not working
        .scroll(Selector('.ReactVirtualized__Grid__innerScrollContainer'), 'bottom')
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
            // .click(Selector('div.rs-picker-check'))
            // .click(Selector('button').withText('Save'))
            // .click(closeButton)
})
console.log(userName)
console.log(userRoleName)
// test('try logging in with no role', async t => {
//     await t
//         .click(Selector('i.rs-icon-cog'))
//         .click(Selector('a').withAttribute('href', '/logout'))
//         .typeText(loginName, userEmail)
//         .typeText(loginPassword, userPassword)
//         .click('form > button')
//         .expect(Selector('div.rs-alert-container').exists).ok()
// })

// test('log in as admin and give user an admin role', async t => {
//     await t
//         .typeText(loginName, 'dev@wepublish.ch')
//         .typeText(loginPassword, '123')
//         .click('form > button')
//         .navigateTo(`${EDITOR_URL}/users`)
//         .click(Selector('a').withText(userName))
//         .click(Selector('a').withAttribute('name', 'User Roles'))
//         .click(Selector('label').withText('Admin'))
//         .click(Selector('input').withAttribute('name', 'Preferred Name'))
//         .click(Selector('button').withText('Save'))
//         .click(Selector('i.rs-icon-cog'))
//         .click(Selector('a').withAttribute('href', '/logout'))
// })

// test('log in with admin role', async t => {
//     await t
//         .typeText(loginName, userEmail)
//         .typeText(loginPassword, userPassword)
//         .click('form > button')
//         .expect(Selector('i.rs-icon-cog').exists).ok()
// })
*/
