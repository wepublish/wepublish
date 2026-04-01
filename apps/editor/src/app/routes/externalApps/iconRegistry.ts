import React from 'react';
import * as icons from 'react-icons/md';

/**
 * Dynamic Icon Registry Configuration
 *
 * Automatically loads all available icons from react-icons/md.
 * No predefined list needed - all Material Design icons are available.
 */

function generateIconRegistry(): Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number }> }
> {
  const registry: Record<
    string,
    { label: string; icon: React.ComponentType<{ size?: number }> }
  > = {};

  // Extract all icon exports from react-icons/md
  Object.entries(icons).forEach(([name, component]) => {
    // Only include React components (icons start with 'Md' and are functions)
    if (
      typeof component === 'function' &&
      name.startsWith('Md') &&
      name !== 'MdIcon'
    ) {
      // Convert 'MdCheckBox' to 'checkBox'
      const baseName = name.slice(2);
      const key = baseName.charAt(0).toLowerCase() + baseName.slice(1);

      // Convert 'CheckBox' to 'Check Box' for display label
      const label = baseName
        .replace(/([A-Z])/g, ' $1') // Add space before capitals
        .trim();

      registry[key] = {
        label,
        icon: component as React.ComponentType<{ size?: number }>,
      };
    }
  });

  return registry;
}

export const ICON_REGISTRY = generateIconRegistry();
