import {render} from '@testing-library/react'

import {H1, H2, H3, Paragraph} from './typography'

describe('H1', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<H1>Foobar</H1>)
    expect(baseElement).toMatchSnapshot()
  })
})

describe('H2', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<H2>Foobar</H2>)
    expect(baseElement).toMatchSnapshot()
  })
})

describe('H3', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<H3>Foobar</H3>)
    expect(baseElement).toMatchSnapshot()
  })
})

describe('Paragraph', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<Paragraph>Foobar</Paragraph>)
    expect(baseElement).toMatchSnapshot()
  })
})
