import type { ComponentMap } from './component-types';
import { createFieldsFor } from './fields-for';
import { createFormComponent } from './form';
import type { FormRuntime } from './form-runtime';
import type { CreatedForm, FormConfig } from './form-types';
import { createUseSchemaForm } from './use-schema-form';

const renderable = (components: ComponentMap) =>
  components as FormRuntime['components'];

export function createForm<
  const C extends ComponentMap,
  const I extends string = string,
>(config: FormConfig<C, I>): CreatedForm<C, I> {
  return {
    useSchemaForm: createUseSchemaForm(config),
    Form: createFormComponent(config, renderable(config.components)),
    fieldsFor: createFieldsFor<C>(),
  };
}
