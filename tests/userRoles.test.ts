import { ClientFunction, Role, Selector, t } from "testcafe";

import {
    admin,
    getPath,
    EDITOR_URL,
    closeButton,
    userName,
    userEmail,
    userPassword,
    userNameInput,
    userEmailInput,
    userPasswordInput,
    createArticle,
    createButton,
    testUser,
    addTitleAndLead,

} from "./common"

fixture`Create a user role`
    .disablePageCaching
    .page(`${EDITOR_URL}/userroles`)

const userRoleName = userName
test('create a role', async t => {
    await t
        .useRole(admin)
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
        .useRole(admin)
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
        .useRole(Role.anonymous())
})

test('login with testUser, fail to create article', async t => {
    await t
        .useRole(testUser)
        .navigateTo(EDITOR_URL)
        .click(createArticle)
    await addTitleAndLead()
    await t
        .click(createButton)
    // How can I get this as a successfull test? 
})

test('fail to delete article', async t => {
    await t
        .useRole(testUser)
        .navigateTo(EDITOR_URL)
        .click(Selector('i.rs-icon-trash'))
        .click(Selector('button').withText('Confirm'))
    // No alert with error message ? 
})

test('add article permissions to testUser', async t => {
    await t
        .useRole(admin)
        .navigateTo(`${EDITOR_URL}/userroles`)
        .click(Selector('a').withText(userName))
        .click(Selector('a').withAttribute('role', 'combobox'))
        .click(Selector('label').withText('Allows to create article'))
        .click(Selector('label').withText('Allows to delete article'))
        .click(closeButton)
})

test('add and delete article with testUser', async t => {
    let articleID = ''
    await t
        .useRole(testUser)
        .navigateTo(EDITOR_URL)
        .click(createArticle)
    await addTitleAndLead()
    await t.click(createButton)
    const path = await getPath()
    articleID = path.substr(path.lastIndexOf('/') + 1)
    await t
        .navigateTo(EDITOR_URL)
    await t
        .expect(Selector('a').withAttribute('href', `/article/edit/${articleID}`).exists).ok()
    
        const articleBox = Selector('a').withAttribute('href', `/article/edit/${articleID}`).parent()
    await t
        .click(articleBox.parent().parent().parent().child(1)
            .child().child().child().child('i.rs-icon-trash'))
        .click(Selector('button').withText('Confirm'))
        .expect(articleBox.exists).notOk()
})

