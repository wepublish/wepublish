// @vitest-environment node
import { loadEditorOtelModules } from './otel-modules';

describe('editor otel modules', () => {
  it('loads the real SDK classes', () => {
    const modules = loadEditorOtelModules();

    expect(modules.NodeSDK.name).toBe('NodeSDK');
    expect(modules.HttpInstrumentation.name).toBe('HttpInstrumentation');
    expect(modules.ExpressInstrumentation.name).toBe('ExpressInstrumentation');
    expect(modules.RuntimeNodeInstrumentation.name).toBe(
      'RuntimeNodeInstrumentation'
    );
    expect(typeof modules.resourceFromAttributes).toBe('function');
  });
});
