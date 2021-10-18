import { ClientFunction, Role, Selector } from "testcafe";


// function makeid(length) {
//   let result = '';
//   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   const charactersLength = characters.length;
//   for (let i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * charactersLength));
//   }
//   return result;
// }

// const admin = Role(`${EDITOR_URL}/login`, async t => {
//   console.log('body looks like:', await Selector('body').innerText)
//   console.log('NEW LINE')
//   await t
//     .typeText(loginName, 'dev@wepublish.ch')
//     .typeText(loginPassword, '123')
//     .click('form > button')
// });

// const getPath = ClientFunction(() => {
//   return document.location.pathname
// });

// const goToPath = ClientFunction((websiteUrl, articleID) => {
//   console.log('Goto Path', `${websiteUrl}/a/${articleID}`)
//   document.location.href = `${websiteUrl}/a/${articleID}`
// });

import {
admin, 
  getPath, 
  makeid, 
  EDITOR_URL, 
  WEBSITE_URL, 
  metadataButton,
  createButton,
  publishButton,
  closeButton,
  confirmButton,
  metaPreTitleInput,
  metaTitleInput,
  metaLeadInput,
  createArticle,
  articleTitleInput,
  articleLeadInput,
  deleteButton
} from "./common"


 fixture`Create and publish an article`
   .disablePageCaching
   .beforeEach(async t => {
     await t.useRole(admin)

   })
   .page(`${EDITOR_URL}`)


 let articleID = ''

// test('Check Front site', async t => {
//   await t
//     .navigateTo(`${WEBSITE_URL}`)
//     .expect(Selector('a').withAttribute('href', 'https://www.facebook.com/wepublish').getAttribute('target')).eql('_blank')
// })

 test('Is logged in', async t => {
   console.log('is logged in', await ClientFunction(() => {
     return document.location.toString()
   })())
   console.log('body looks like:', await Selector('body').innerText)
   await t
     .expect(Selector('i.rs-icon-cog').exists).ok()
 })

 test('Create an article', async t => {
   await t
     .click(createArticle)

   await t
     .expect(await getPath()).contains('/article/create')

   await t
     .typeText(articleTitleInput, 'This is the article Title')
     .typeText(articleLeadInput, 'This is the article lead')
     .click(createButton);

   const path = await getPath()
   articleID = path.substr(path.lastIndexOf('/') + 1)
   console.log('articleID', articleID)
   await t.expect(path).contains('/article/edit')

   await t
     .click(metadataButton)
     .expect(metaTitleInput.value).contains('This is the article Title')
     .expect(metaLeadInput.value).contains('This is the article lead')
     .typeText(metaPreTitleInput, 'This is a Pre-title')
     .click(closeButton)

//    await t
//     .click(lastAddButton)
//     .click(richTextButton)
//     .typeText(richTextBox, 'This is some random text') 

 });

 test('Test Website', async t => {
   await t
     .navigateTo(`${WEBSITE_URL}/a/${articleID}`)
     .expect(Selector('h1').innerText).eql('404')
 })

 test('Publish article', async t => {
   await t
     .click(Selector('a').withAttribute('href', `/article/edit/${articleID}`))
     .click(publishButton)
     .click(confirmButton)
     .expect(Selector('div.rs-alert-container').exists).ok()
     .click(Selector('div.rs-alert-item-close'))

   await t
     .click(metadataButton)
     .click(Selector('button').child('i.rs-icon-magic'))
     .click(closeButton)
     .click(publishButton)
     .click(confirmButton)
     .expect(Selector('div.rs-tag-default').child('span.rs-tag-text').innerText).contains('Article published')
 })

 test('Test Website', async t => {
   const h1Title = Selector('h1')

   await t
     .navigateTo(`${WEBSITE_URL}/a/${articleID}`)
     .expect(h1Title.innerText).eql('This is the article Title')
 })

test('Delete article', async t => {
  const articleBox = Selector('a').withAttribute('href', `/article/edit/${articleID}`).parent()
 
  await t
    // .click(articleBox.parent().parent().parent().child('i.rs-icon-trash'))
    .click(articleBox.child('div').nth(1).child('div').nth(4).child('button'))
    .click(deleteButton)
    .click(confirmButton)
    .expect(articleBox.exists).notOk()
}) 


// document.querySelector('a[href="/article/edit/IrHJUmTkvuVh0o3a"]').parentElement.parentElement.parentElement.parentElement
// .lastElementChild