import {Meta} from '@storybook/react'
import {Banner} from './banner'
import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'

const banner = {
  id: '16ca80ce-a2d0-44dc-8c87-b735e4b08877',
  title: 'Bla',
  text: 'We need money. You are our only hope.',
  cta: 'Subscribe now!',
  active: true,
  showOnArticles: true,
  actions: [{label: 'Foo'}, {label: 'Bar'}],
  image: {
    __typename: 'Image',
    id: 'ljh9FHAvHAs0AxC',
    createdAt: '2023-04-18T12:38:56.369Z',
    modifiedAt: '2023-04-18T12:38:56.371Z',
    filename: 'DSC07717',
    extension: '.JPG',
    width: 4000,
    height: 6000,
    fileSize: 8667448,
    description: null,
    tags: [],
    source: null,
    link: null,
    license: null,
    focalPoint: {
      x: 0.5,
      y: 0.5
    },
    title: null,
    url: 'https://unsplash.it/500/500',
    xl: 'https://unsplash.it/1200/400',
    l: 'https://unsplash.it/1000/400',
    m: 'https://unsplash.it/800/400',
    s: 'https://unsplash.it/500/300',
    xs: 'https://unsplash.it/300/200',
    xxs: 'https://unsplash.it/200/100',
    xlSquare: 'https://unsplash.it/1200/1200',
    lSquare: 'https://unsplash.it/1000/1000',
    mSquare: 'https://unsplash.it/800/800',
    sSquare: 'https://unsplash.it/500/500',
    xsSquare: 'https://unsplash.it/300/300',
    xxsSquare: 'https://unsplash.it/200/200',
    format: 'jpg',
    mimeType: 'image/jpg'
  }
}

export default {
  component: Banner,
  title: 'Components/Banner'
} as Meta

export const Default = {
  args: {
    data: {primaryBanner: banner}
  }
}

export const WithLoading = {
  args: {
    data: undefined,
    loading: true
  }
}

export const WithError = {
  args: {
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}

export const WithClassName = {
  args: {
    data: {
      primaryBanner: banner
    },
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    data: {
      primaryBanner: banner
    },
    css: css`
      background-color: #f00;
    `
  }
}

export const WithoutImage = {
  args: {
    data: {
      primaryBanner: {...banner, image: null}
    }
  }
}
