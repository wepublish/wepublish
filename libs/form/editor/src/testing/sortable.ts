import { vi } from 'vitest';

export function stubSortableRowRects() {
  return vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: Element) {
      const row = this.matches('li, tr');
      const index =
        row && this.parentElement ?
          Array.from(this.parentElement.children).indexOf(this)
        : 0;
      const top = row ? index * 60 : 0;
      const height = row ? 50 : 0;

      return {
        x: 0,
        y: top,
        top,
        left: 0,
        right: row ? 400 : 0,
        bottom: top + height,
        width: row ? 400 : 0,
        height,
        toJSON: () => ({}),
      };
    });
}
