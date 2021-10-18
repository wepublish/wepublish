
    import { ClientFunction, Role, Selector } from "testcafe";
    import { slugify } from '../config/utilities'
    import * as process from "process";

    const loginName = Selector('input').withAttribute('autocomplete', 'username')
    const loginPassword = Selector('input').withAttribute('autocomplete', 'currentPassword')
    const createArticle = Selector('a').withAttribute('href', '/article/create')
    const metadataButton = Selector('button').child('i.rs-icon-newspaper-o')
    const createButton = Selector('button').child('i.rs-icon-save')
    const publishButton = Selector('button').child('i.rs-icon-cloud-upload')
    
    const closeButton = Selector('.rs-drawer-footer').child('button.rs-btn-primary')
    const confirmButton = Selector('.rs-modal-footer').child('button.rs-btn-primary')
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
  
    
    export {
        admin, 
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
        goToPagePath
      }

