import {GetStaticPaths} from 'next'

export {default, getStaticProps} from '../[slug]'

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking'
})
