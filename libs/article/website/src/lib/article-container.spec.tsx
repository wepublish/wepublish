import {render} from '@testing-library/react'
import {ArticleContainer} from './article-container'
import {MockedProvider} from '@apollo/client/testing'

describe('ArticleContainer', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <MockedProvider addTypename={false}>
        <ArticleContainer slug="123" />
      </MockedProvider>
    )

    expect(baseElement).toBeTruthy()
  })
})
