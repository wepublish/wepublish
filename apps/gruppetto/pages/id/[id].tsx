import {GetStaticPaths} from 'next'

export {default, getStaticProps} from '../[slug]'

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking'
  }
}
