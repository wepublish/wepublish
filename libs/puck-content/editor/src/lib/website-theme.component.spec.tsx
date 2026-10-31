import styled from '@emotion/styled';
import { createTheme } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { WebsiteThemeContext } from './website-theme';
import { WebsiteThemePreview } from './website-theme.component';

const Probe = styled.p`
  color: rgb(1, 2, 3);
`;

const frameStyles = (frameDocument: Document) =>
  Array.from(
    frameDocument.head.querySelectorAll('style[data-emotion^="website"]')
  )
    .map(style => style.textContent)
    .join('');

describe('WebsiteThemePreview', () => {
  it('writes the styles of the preview into the frame document', () => {
    const frameDocument = document.implementation.createHTMLDocument('frame');

    render(
      <WebsiteThemeContext.Provider value={createTheme()}>
        <WebsiteThemePreview document={frameDocument}>
          <Probe>Preview</Probe>
        </WebsiteThemePreview>
      </WebsiteThemeContext.Provider>
    );

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(frameStyles(frameDocument)).toContain('rgb(1, 2, 3)');
  });

  it('writes into the frame document without a website theme too', () => {
    const frameDocument = document.implementation.createHTMLDocument('frame');

    render(
      <WebsiteThemePreview document={frameDocument}>
        <Probe>Preview</Probe>
      </WebsiteThemePreview>
    );

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(frameStyles(frameDocument)).toContain('rgb(1, 2, 3)');
  });
});
