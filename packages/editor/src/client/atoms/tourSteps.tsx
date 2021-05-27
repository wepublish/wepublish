import {Step} from 'react-shepherd'
import {wait} from '../utility'

const navButtons = {
  exit: {
    text: 'Exit',
    type: 'cancel'
  },
  back: {
    text: 'Back',
    type: 'back'
  },
  next: {
    text: 'Next',
    type: 'next'
  }
}

export const steps: Step.StepOptions[] = [
  {
    buttons: [navButtons.exit, navButtons.next],
    // classes: 'custom-class-name-1 custom-class-name-2',
    title: 'Welcome to We.Publish Editor!',
    text: ['Get a guided tour of the editor']
    /*   when: {
               show: () => {
                   console.log('show step')
               },
               hide: () => {
                   console.log('hide step')
               }
           }
        */
  },
  {
    buttons: [navButtons.back],
    title: 'click on articles',
    text: ['go to articles tab'],
    attachTo: {element: '.rs-nav-item-content', on: 'auto'},
    advanceOn: {selector: '.rs-nav-item-content', event: 'click'},
    showOn: () => {
      return !window.location.href.includes('/articles')
    }
  },
  {
    arrow: true,
    attachTo: {element: '.rs-btn-primary', on: 'auto'},
    advanceOn: {selector: '.rs-btn-primary', event: 'click'},
    buttons: [navButtons.back],
    title: 'Create an article',
    text: ['Click here to get started writing a new article']
  },
  {
    buttons: [navButtons.next],
    title: 'Create an article',
    text: ['Get started writing a new article here']
  },
  {
    arrow: true,
    attachTo: {element: '.rs-icon-plus', on: 'bottom'},
    advanceOn: {selector: '.rs-icon-plus', event: 'click'},
    buttons: [navButtons.back],
    title: 'Create an article',
    text: [
      'Articles are made up of blocks. Click the + icon to add a block element to your article.'
    ]
  },
  {
    arrow: true,
    beforeShowPromise: wait(100),
    attachTo: {element: '.rs-dropdown-item:nth-child(2)', on: 'bottom'},
    advanceOn: {selector: '.rs-dropdown-item:nth-child(2)', event: 'click'},
    buttons: [navButtons.back],
    title: 'Create a new Richtext',
    text: ['(options...)']
  },
  {
    arrow: true,
    beforeShowPromise: wait(100),
    attachTo: {element: 'p[data-slate-node="element"]', on: 'bottom'},
    // advanceOn: {selector: '.rs-dropdown-item:nth-child(2)', event: 'click'},
    buttons: [navButtons.back, navButtons.next],
    title: 'Write something',
    text: ['(options...)']
  }
]

export const options = {
  defaultStepOptions: {
    // classes: 'shepherd-theme-arrows',
    scrollTo: true,
    cancelIcon: {enabled: true},
    highlightClass: 'highlight'
  },
  useModalOverlay: true
}
