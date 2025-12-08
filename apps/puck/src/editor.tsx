import { FieldLabel, Puck } from '@measured/puck';
import { Hash, Type } from 'lucide-react';
import '@measured/puck/puck.css';

import { Grid } from './components/grid';
import { Quote } from './components/quote';
import { Listicle } from './components/listicle';
import { Event } from './components/event';
import { Title } from './components/title';
import { Html } from './components/html';
import { Break } from './components/break';
import { RichText } from './components/richtext';
import { root } from './root';
import { Space } from './components/space';
import { Teaser } from './components/teaser';
import { UserConfig, UserOverride } from './types';
import { TextField } from '@wepublish/ui';

const config: UserConfig = {
  root,
  components: {
    Grid,
    Title,
    Quote,
    Html,
    Break,
    Space,
    Teaser,
    RichText,
    Listicle,
    Event,
  },
  categories: {
    recommended: {
      components: ['Title', 'RichText'],
    },
    blocks: {
      components: ['Title', 'Quote', 'Html', 'Break'],
      defaultExpanded: false,
    },
    layout: {
      components: ['Grid', 'Space'],
      defaultExpanded: false,
    },
    other: {
      defaultExpanded: false,
    },
  },
};

const overrides: UserOverride = {
  fieldTypes: {
    text: ({ name, onChange, value, field }) => (
      <FieldLabel
        label={field.label ?? name}
        icon={field.labelIcon ?? <Type size={16} />}
      >
        <TextField
          type={field.type}
          {...field.metadata}
          defaultValue={value}
          name={name}
          onChange={e => onChange(e.currentTarget.value)}
        />
      </FieldLabel>
    ),
    number: ({ name, onChange, value, field }) => (
      <FieldLabel
        label={field.label ?? name}
        icon={field.labelIcon ?? <Hash size={16} />}
      >
        <TextField
          type={field.type}
          {...field.metadata}
          defaultValue={value}
          name={name}
          onChange={e => onChange(e.currentTarget.value)}
        />
      </FieldLabel>
    ),
  },
};

// Describe the initial data
const initialData = {};

// Save the data to your database
const save = console.warn;

// Render Puck editor
export function Editor() {
  return (
    <Puck
      overrides={overrides}
      config={config}
      data={initialData}
      onPublish={save}
    />
  );
}
