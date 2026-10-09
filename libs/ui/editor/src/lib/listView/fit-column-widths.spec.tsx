import { Children, isValidElement, ReactElement, ReactNode } from 'react';
import { Table } from 'rsuite';

import { fitColumnWidths } from './fit-column-widths';

const { Column } = Table;

const widthsOf = (children: ReactNode): number[] =>
  Children.toArray(children).flatMap(child => {
    if (!isValidElement(child)) {
      return [];
    }

    const element = child as ReactElement<{
      width?: number;
      children?: ReactNode;
    }>;

    return element.type === Column ?
        [element.props.width ?? 100]
      : widthsOf(element.props.children);
  });

describe('fitColumnWidths', () => {
  it('shrinks resizable columns so they fit next to a fixed column', () => {
    const fitted = fitColumnWidths(
      [
        <Column
          key="a"
          width={200}
        />,
        <Column
          key="b"
          width={200}
        />,
        <Column
          key="action"
          width={100}
          fixed="right"
        />,
      ],
      400
    );

    expect(widthsOf(fitted)).toEqual([150, 150, 100]);
  });

  it('never shrinks a column below half of its width', () => {
    const fitted = fitColumnWidths(
      [
        <Column
          key="a"
          width={200}
        />,
        <Column
          key="b"
          width={120}
        />,
      ],
      100
    );

    expect(widthsOf(fitted)).toEqual([100, 60]);
  });

  it('stretches columns to fill the table when no column grows', () => {
    const fitted = fitColumnWidths(
      [
        <Column
          key="a"
          width={200}
        />,
        <Column
          key="b"
          width={200}
        />,
      ],
      600
    );

    expect(widthsOf(fitted)).toEqual([300, 300]);
  });

  it('keeps the widths when a growing column already fills the table', () => {
    const fitted = fitColumnWidths(
      [
        <Column
          key="a"
          width={200}
        />,
        <Column
          key="b"
          flexGrow={1}
          minWidth={100}
        />,
      ],
      600
    );

    expect(widthsOf(fitted)).toEqual([200, 100]);
  });

  it('reaches columns inside fragments and conditionals', () => {
    const fitted = fitColumnWidths(
      <>
        {false && <Column width={500} />}
        <Column width={200} />
        <Column width={200} />
      </>,
      200
    );

    expect(widthsOf(fitted)).toEqual([100, 100]);
  });

  it('releases fixed columns on narrow tables so the data stays visible', () => {
    const fitted = fitColumnWidths(
      [
        <Column
          key="a"
          width={200}
        />,
        <Column
          key="action"
          width={220}
          fixed="right"
        />,
      ],
      358
    );

    const fixed = Children.toArray(fitted).map(
      child => (child as ReactElement<{ fixed?: string }>).props.fixed
    );

    expect(fixed).toEqual([undefined, undefined]);
    expect(widthsOf(fitted)).toEqual([138, 220]);
  });

  it('keeps columns that cannot be resized at their exact width', () => {
    const columns = [
      <Column
        key="states"
        width={190}
        resizable={false}
      />,
      <Column
        key="a"
        width={200}
      />,
      <Column
        key="b"
        width={200}
      />,
    ];

    expect(widthsOf(fitColumnWidths(columns, 400))).toEqual([190, 105, 105]);
    expect(widthsOf(fitColumnWidths(columns, 800))).toEqual([190, 305, 305]);
  });

  it('leaves the columns untouched before the table has been measured', () => {
    const columns = [
      <Column
        key="a"
        width={200}
      />,
    ];

    expect(fitColumnWidths(columns, 0)).toBe(columns);
  });
});
