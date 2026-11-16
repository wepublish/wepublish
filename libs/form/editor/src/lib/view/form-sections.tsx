import { useFormStatus, type AnyFormSchema } from '@wepublish/form/core';
import type { ComponentType } from 'react';
import { useWatch } from 'react-hook-form';

import { FormRow, FormSection, FormToggleGroup } from './form-section';
import type { FormViewSection, SectionEntry } from './form-view';
import { useFormViewContext } from './form-view-context';
import { AsidePanel, CardGrid, Columns, MainColumn } from './form-view-layout';
import { isLoneGroup, isRow, pathsOf } from './view-runtime';

type AnySection = FormViewSection<AnyFormSchema>;

type AnyEntry = SectionEntry<AnyFormSchema>;

type LooseField = ComponentType<{ name: string; hideLabel?: boolean }>;

type ToggleGroupEntry = { readonly group: readonly string[]; title?: string };

export function FormSections() {
  const { controller } = useFormViewContext();
  const { isLoading, loadError } = useFormStatus();

  if (isLoading || loadError !== undefined) {
    return null;
  }

  const sections: readonly AnySection[] = controller.view.sections;
  const visible = sections.filter(
    section =>
      section.modes === undefined || section.modes.includes(controller.mode)
  );

  if (controller.view.layout === 'cards') {
    return (
      <CardGrid>
        {visible.map((section, index) => (
          <SectionSlot
            key={index}
            section={section}
          />
        ))}
      </CardGrid>
    );
  }

  const main = visible.filter(section => section.placement !== 'aside');
  const aside = visible.filter(section => section.placement === 'aside');

  return (
    <Columns>
      <MainColumn>
        {main.map((section, index) => (
          <SectionSlot
            key={index}
            section={section}
          />
        ))}
      </MainColumn>
      {aside.length === 0 ? null : (
        <AsidePanel>
          {aside.map((section, index) => (
            <SectionSlot
              key={index}
              section={section}
            />
          ))}
        </AsidePanel>
      )}
    </Columns>
  );
}

function SectionSlot({ section }: { section: AnySection }) {
  if (typeof section.hidden === 'function') {
    return <DynamicSection section={section} />;
  }

  return section.hidden === true ?
      null
    : <ConfiguredSection section={section} />;
}

export function DynamicSection({ section }: { section: AnySection }) {
  const values = useWatch();
  const hidden = section.hidden as (values: unknown) => boolean;

  return hidden(values) ? null : <ConfiguredSection section={section} />;
}

export function ConfiguredSection({ section }: { section: AnySection }) {
  const { controller } = useFormViewContext();
  const { readOnly, mode } = controller;
  const Body = section.component;
  const loneGroup = isLoneGroup(controller.view, controller.fields, section);

  return (
    <FormSection
      title={section.title}
      description={section.description}
      collapsible={section.collapsible}
      errorPaths={pathsOf(section)}
      variant={controller.view.layout === 'cards' ? 'card' : 'section'}
      span={section.span}
    >
      {(section.fields ?? []).map((entry, index) => (
        <Entry
          key={index}
          entry={entry}
          hideLabel={loneGroup}
        />
      ))}
      {Body === undefined ? null : (
        <Body
          mode={mode}
          readOnly={readOnly}
        />
      )}
    </FormSection>
  );
}

function Entry({ entry, hideLabel }: { entry: AnyEntry; hideLabel: boolean }) {
  const { controller } = useFormViewContext();
  const Field = controller.view.Field as unknown as LooseField;

  if (typeof entry === 'string') {
    return (
      <Field
        name={entry}
        hideLabel={hideLabel || undefined}
      />
    );
  }

  if (isRow(entry)) {
    return (
      <FormRow>
        {entry.map(path => (
          <Field
            key={path}
            name={path}
          />
        ))}
      </FormRow>
    );
  }

  const { group, title } = entry as ToggleGroupEntry;

  return (
    <FormToggleGroup title={title}>
      {group.map(path => (
        <Field
          key={path}
          name={path}
        />
      ))}
    </FormToggleGroup>
  );
}
