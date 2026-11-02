import styled from '@emotion/styled';

export const LinkedTemplateFrame = styled.div`
  position: relative;
  min-height: 48px;
  outline: 1px dashed rgba(25, 118, 210, 0.6);
  outline-offset: -1px;
`;

export const LinkedTemplateBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(25, 118, 210, 0.9);
  color: #fff;
  font:
    600 12px/1.6 system-ui,
    sans-serif;
  pointer-events: none;
`;

export const LinkedTemplateContent = styled.div`
  pointer-events: none;
`;

export const LinkedTemplateHint = styled.p`
  margin: 0;
  padding: 16px;
  color: rgba(0, 0, 0, 0.6);
  font:
    14px/1.4 system-ui,
    sans-serif;
  text-align: center;
`;
