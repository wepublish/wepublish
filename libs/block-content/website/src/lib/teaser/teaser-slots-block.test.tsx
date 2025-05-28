import React from 'react'
import {render, screen} from '@testing-library/react'
import {ThemeProvider} from '@mui/material'
import {
  isTeaserSlotsBlock,
  TeaserSlotsBlock,
  TeaserSlotsBlockWrapper,
  TeaserSlotsBlockTeasers
} from './teaser-slots-block'
import {createTheme} from '@mui/material/styles'
import {BuilderTeaserSlotsBlockProps} from '@wepublish/website/builder'

// Mock the useWebsiteBuilder hook
jest.mock('@wepublish/website/builder', () => ({
  useWebsiteBuilder: () => ({
    elements: {
      H5: ({children, component}: {children: React.ReactNode; component: string}) => (
        <h5 data-testid="h5-component" data-component={component}>
          {children}
        </h5>
      )
    },
    blocks: {
      Teaser: ({teaser, alignment, blockStyle}: any) => (
        <div
          data-testid="teaser-component"
          data-alignment={alignment}
          data-block-style={blockStyle?.id || 'no-style'}>
          {teaser?.title || 'Teaser'}
        </div>
      )
    }
  })
}))

// Mock alignmentForTeaserBlock function
jest.mock('./teaser-grid-block', () => ({
  alignmentForTeaserBlock: jest.fn().mockImplementation(() => 'center')
}))

describe('TeaserSlotsBlock', () => {
  // Create a theme for testing styled components
  const theme = createTheme({
    spacing: (factor: number) => `${0.25 * factor}rem`,
    breakpoints: {
      up: (key: string) => {
        const breakpoints = {
          sm: '@media (min-width:600px)',
          md: '@media (min-width:900px)'
        }
        return breakpoints[key as keyof typeof breakpoints] || ''
      }
    }
  })

  // Setup wrapper component with theme
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
  }

  describe('isTeaserSlotsBlock', () => {
    // Test for line 7-8: The type guard function
    it('should return true for a TeaserSlotsBlock', () => {
      const block = {__typename: 'TeaserSlotsBlock'}
      expect(isTeaserSlotsBlock(block)).toBe(true)
    })

    it('should return false for other block types', () => {
      const block = {__typename: 'TextBlock'}
      expect(isTeaserSlotsBlock(block)).toBe(false)
    })
  })

  describe('TeaserSlotsBlockWrapper', () => {
    // Test for line 10-13: The styled component
    it('should render with correct styles', () => {
      renderWithTheme(<TeaserSlotsBlockWrapper data-testid="wrapper" />)

      const wrapper = screen.getByTestId('wrapper')
      expect(wrapper).toHaveStyle('display: grid')
      // Note: We can't fully test the theme-based styles in Jest, but we can check the component renders
    })
  })

  describe('TeaserSlotsBlockTeasers', () => {
    // Test for line 15-32: The styled component with responsive grid
    it('should render with correct styles', () => {
      renderWithTheme(<TeaserSlotsBlockTeasers data-testid="teasers" />)

      const teasers = screen.getByTestId('teasers')
      expect(teasers).toHaveStyle('display: grid')
      expect(teasers).toHaveStyle('grid-template-columns: 1fr')
      expect(teasers).toHaveStyle('align-items: stretch')
      // Note: We can't fully test the responsive CSS media queries in Jest
    })
  })

  describe('TeaserSlotsBlock component', () => {
    // Test for line 34-64: The main component
    it('should render with title when provided', () => {
      const props: BuilderTeaserSlotsBlockProps = {
        title: 'Test Title',
        teasers: [],
        className: 'custom-class'
      }

      renderWithTheme(<TeaserSlotsBlock {...props} />)

      const titleElement = screen.getByTestId('h5-component')
      expect(titleElement).toBeInTheDocument()
      expect(titleElement).toHaveTextContent('Test Title')
      expect(titleElement).toHaveAttribute('data-component', 'h1')
    })

    it('should not render title when not provided', () => {
      const props: BuilderTeaserSlotsBlockProps = {
        teasers: [],
        className: 'custom-class'
      }

      renderWithTheme(<TeaserSlotsBlock {...props} />)

      const titleElement = screen.queryByTestId('h5-component')
      expect(titleElement).not.toBeInTheDocument()
    })

    it('should render teasers correctly', () => {
      const props: BuilderTeaserSlotsBlockProps = {
        teasers: [{title: 'Teaser 1'}, {title: 'Teaser 2'}, {title: 'Teaser 3'}],
        blockStyle: {id: 'test-style'},
        className: 'custom-class'
      }

      renderWithTheme(<TeaserSlotsBlock {...props} />)

      const teaserElements = screen.getAllByTestId('teaser-component')
      expect(teaserElements).toHaveLength(3)
      expect(teaserElements[0]).toHaveAttribute('data-block-style', 'test-style')
      expect(teaserElements[0]).toHaveAttribute('data-alignment', 'center')
    })

    it('should handle empty teasers array', () => {
      const props: BuilderTeaserSlotsBlockProps = {
        teasers: [],
        className: 'custom-class'
      }

      renderWithTheme(<TeaserSlotsBlock {...props} />)

      const teaserElements = screen.queryAllByTestId('teaser-component')
      expect(teaserElements).toHaveLength(0)
    })

    it('should handle undefined teasers', () => {
      const props: BuilderTeaserSlotsBlockProps = {
        className: 'custom-class'
      }

      renderWithTheme(<TeaserSlotsBlock {...props} />)

      const teaserElements = screen.queryAllByTestId('teaser-component')
      expect(teaserElements).toHaveLength(0)
    })
  })
})
