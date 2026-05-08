/* eslint-disable i18next/no-literal-string --
 * Admin-only diagnostic page. Labels mirror Postgres EXPLAIN ANALYZE
 * output (COUNT / FIND_MANY plans, code identifiers); not localized.
 */
import styled from '@emotion/styled';
import { useExplainTagPageQueryLazyQuery } from '@wepublish/editor/api';
import { ListViewContainer, ListViewHeader } from '@wepublish/ui/editor';
import { useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputGroup,
  InputNumber,
  Message,
  Panel,
  Stack,
} from 'rsuite';

const Pre = styled('pre')`
  background: #f5f5f5;
  border: 1px solid #ddd;
  padding: 12px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre;
  overflow: auto;
  max-height: 500px;
`;

export function DiagnosticsTagPage() {
  const [tagLabel, setTagLabel] = useState('');
  const [page, setPage] = useState<number>(90);
  const [take, setTake] = useState<number>(25);
  const [run, { data, loading, error }] = useExplainTagPageQueryLazyQuery({
    fetchPolicy: 'no-cache',
  });

  const canRun = !!tagLabel && !loading;

  return (
    <ListViewContainer>
      <ListViewHeader>
        <h2>EXPLAIN ANALYZE — tag-page query</h2>
      </ListViewHeader>

      <Panel
        bordered
        style={{ marginBottom: 16 }}
      >
        <p style={{ marginBottom: 8 }}>
          Runs <code>EXPLAIN (ANALYZE, BUFFERS)</code> on the{' '}
          <code>count(*)</code> and offset-paginated <code>findMany</code>{' '}
          queries that drive the tag-page paginator. Use to diagnose remaining
          DB-side bottlenecks (EXISTS join cost, OFFSET sort cost). Defaults
          match the website paginator (<code>page=90, take=25</code>).
        </p>
        <p>
          <small>
            Admin-only (gated by <code>CanCreateArticle</code>). Each run
            executes the underlying queries against the live DB.
          </small>
        </p>
      </Panel>

      <Form
        fluid
        onSubmit={() => {
          if (canRun) {
            run({ variables: { tagLabel, page, take } });
          }
        }}
      >
        <Stack
          spacing={12}
          alignItems="flex-end"
          style={{ marginBottom: 16 }}
        >
          <Form.Group style={{ flex: 1 }}>
            <Form.ControlLabel>Tag label</Form.ControlLabel>
            <InputGroup>
              <Input
                placeholder="e.g. politik"
                value={tagLabel}
                onChange={value => setTagLabel(value)}
              />
            </InputGroup>
          </Form.Group>

          <Form.Group>
            <Form.ControlLabel>Page</Form.ControlLabel>
            <InputNumber
              min={1}
              value={page}
              onChange={value => setPage(Number(value))}
            />
          </Form.Group>

          <Form.Group>
            <Form.ControlLabel>Take</Form.ControlLabel>
            <InputNumber
              min={1}
              max={100}
              value={take}
              onChange={value => setTake(Number(value))}
            />
          </Form.Group>

          <Button
            appearance="primary"
            type="submit"
            disabled={!canRun}
            loading={loading}
          >
            Run
          </Button>
        </Stack>
      </Form>

      {error && (
        <Message
          type="error"
          style={{ marginBottom: 16 }}
        >
          {error.message}
        </Message>
      )}

      {data?.explainTagPageQuery && (
        <Stack
          direction="column"
          spacing={16}
          alignItems="stretch"
        >
          <Panel
            bordered
            header={
              <strong>
                Tag: {data.explainTagPageQuery.tagLabel}{' '}
                <small style={{ color: '#888' }}>
                  ({data.explainTagPageQuery.tagId})
                </small>
              </strong>
            }
          >
            <h4>COUNT plan</h4>
            <Pre>{data.explainTagPageQuery.countPlan}</Pre>

            <h4 style={{ marginTop: 16 }}>FIND_MANY page-{page} plan</h4>
            <Pre>{data.explainTagPageQuery.findManyPlan}</Pre>
          </Panel>
        </Stack>
      )}
    </ListViewContainer>
  );
}
