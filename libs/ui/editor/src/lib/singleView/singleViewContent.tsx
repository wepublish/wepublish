import React, { ReactNode } from 'react';
import { Col, Row } from 'rsuite';

interface SingleViewContentProps {
  children: ReactNode;
}
export function SingleViewContent({ children }: SingleViewContentProps) {
  return (
    <Row>
      <Col xs={24}>{children}</Col>
    </Row>
  );
}
