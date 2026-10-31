import { renderHook } from '@testing-library/react';

import { useGeneratedScript } from './generated-script';

const scriptsWith = (text: string) =>
  Array.from(document.body.querySelectorAll('script')).filter(script =>
    script.textContent?.includes(text)
  );

describe('useGeneratedScript', () => {
  it('runs a script once while any of its users is mounted and removes it with the last', () => {
    const first = renderHook(() =>
      useGeneratedScript('shared', 'window.__shared = 1;')
    );
    const second = renderHook(() =>
      useGeneratedScript('shared', 'window.__shared = 1;')
    );
    const scripts = scriptsWith('__shared');

    expect(scripts).toHaveLength(1);

    first.unmount();

    expect(scriptsWith('__shared')).toEqual(scripts);

    second.unmount();

    expect(scriptsWith('__shared')).toHaveLength(0);
  });

  it('runs the script of another key on its own', () => {
    renderHook(() => useGeneratedScript('first', 'window.__keyed = 1;'));
    renderHook(() => useGeneratedScript('second', 'window.__keyed = 1;'));

    expect(scriptsWith('__keyed')).toHaveLength(2);
  });

  it('keeps the script running while its user re-renders', () => {
    const { rerender } = renderHook(
      ({ script }) => useGeneratedScript('rerender', script),
      { initialProps: { script: 'window.__rerender = 1;' } }
    );
    const scripts = scriptsWith('__rerender');

    rerender({ script: 'window.__rerender = 1;' });

    expect(scriptsWith('__rerender')).toEqual(scripts);
  });

  it('runs nothing without a script', () => {
    const before = document.querySelectorAll('script').length;

    renderHook(() => useGeneratedScript('missing', null));
    renderHook(() => useGeneratedScript('blank', ''));

    expect(document.querySelectorAll('script')).toHaveLength(before);
  });

  it('guards the MutationObserver of a script like Puck AI does', () => {
    renderHook(() =>
      useGeneratedScript(
        'observer',
        'new MutationObserver(() => {}); window.__observer = 1;'
      )
    );

    const [script] = scriptsWith('__observer');

    expect(script.textContent).toContain(
      'var __NativeMutationObserver = window.MutationObserver;'
    );
    expect(script.textContent).toMatch(
      /^\(function \(\) \{[\s\S]*window\.__observer = 1;\n\}\)\(\);$/
    );
  });

  it('runs a script without a MutationObserver as it is', () => {
    renderHook(() => useGeneratedScript('plain', 'window.__plain = 1;'));

    expect(scriptsWith('__plain').map(script => script.textContent)).toEqual([
      'window.__plain = 1;',
    ]);
  });
});
