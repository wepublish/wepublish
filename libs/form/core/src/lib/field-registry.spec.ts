import {
  createFieldRegistry,
  reaches,
  type FieldRegistry,
} from './field-registry';

const reachable = (registry: FieldRegistry, path: string) =>
  reaches(registry.snapshot(), path);

describe('createFieldRegistry', () => {
  it('reaches registered paths until they unregister', () => {
    const registry = createFieldRegistry();
    const unregister = registry.register('title', true);

    expect(reachable(registry, 'title')).toBe(true);

    unregister();

    expect(reachable(registry, 'title')).toBe(false);
  });

  it('counts registrations of the same path', () => {
    const registry = createFieldRegistry();
    const first = registry.register('title', true);
    const second = registry.register('title', true);

    first();

    expect(reachable(registry, 'title')).toBe(true);

    second();

    expect(reachable(registry, 'title')).toBe(false);
  });

  it('reaches array-level errors through the array', () => {
    const registry = createFieldRegistry();

    registry.register('actions', false);

    expect(reachable(registry, 'actions.root')).toBe(true);
    expect(reachable(registry, 'actions')).toBe(true);
  });

  it('reaches errors inside a leaf field', () => {
    const registry = createFieldRegistry();

    registry.register('image', true);
    registry.register('tags', true);

    expect(reachable(registry, 'image.id')).toBe(true);
    expect(reachable(registry, 'tags.2')).toBe(true);
  });

  it('does not reach unrendered children of a container', () => {
    const registry = createFieldRegistry();

    registry.register('link', false);
    registry.register('link.label', true);

    expect(reachable(registry, 'link.label')).toBe(true);
    expect(reachable(registry, 'link.url')).toBe(false);
  });

  it('publishes a new snapshot to subscribers on every change', () => {
    const registry = createFieldRegistry();
    const listener = vi.fn();
    const unsubscribe = registry.subscribe(listener);
    const empty = registry.snapshot();
    const unregister = registry.register('title', true);
    const registered = registry.snapshot();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(registered).not.toBe(empty);
    expect(reaches(empty, 'title')).toBe(false);
    expect(reaches(registered, 'title')).toBe(true);
    expect(registry.snapshot()).toBe(registered);

    unsubscribe();
    unregister();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(reaches(registry.snapshot(), 'title')).toBe(false);
  });

  it('does not reach unknown paths or root errors', () => {
    const registry = createFieldRegistry();

    registry.register('title', true);

    expect(reachable(registry, 'titles')).toBe(false);
    expect(reachable(registry, 'root.schema')).toBe(false);
  });
});
