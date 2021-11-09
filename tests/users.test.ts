import { ClientFunction, Selector, Role } from "testcafe";

import {
    admin,
    getPath,
    EDITOR_URL,
    drawerConfirmButton,
    loginName,
    loginPassword,
    userName,
    userEmail,
    userPassword,
    userNameInput,
    userEmailInput,
    userPasswordInput,
    cogIcon,
} from "./common"


fixture`Create a user`
    .disablePageCaching
    .page(`${EDITOR_URL}/users`)

test('create user', async t => {
    await t
        .useRole(admin)
        .navigateTo(`${EDITOR_URL}/users`)
        .click(Selector('a').withAttribute('href', '/user/create'))

    await t
        .expect(await getPath()).contains('/user/create')

    await t
        .typeText(userNameInput, userName)
        .typeText(userEmailInput, userEmail)
        .typeText(userPasswordInput, userPassword)
        .click(drawerConfirmButton)
        .useRole(Role.anonymous())
})

test('try logging in with no role', async t => {

    await t
        .typeText(loginName, userEmail)
        .typeText(loginPassword, userPassword)
        .click('form > button')
        .expect(Selector('div.rs-alert-container').exists).ok()
})

test('log in as admin and give user an admin role', async t => {
        await t
        .useRole(admin)
        .navigateTo(`${EDITOR_URL}/users`)
        .click(Selector('a').withText(userName))
        .click(Selector('a').withAttribute('name', 'User Roles'))
        .click(Selector('label').withText('Admin'))
        .click(Selector('input').withAttribute('name', 'Preferred Name'))
        .click(drawerConfirmButton)
        .useRole(Role.anonymous())
})

test('log in with admin role', async t => {
    await t
        .typeText(loginName, userEmail)
        .typeText(loginPassword, userPassword)
        .click('form > button')
        .expect(cogIcon.exists).ok()
})

