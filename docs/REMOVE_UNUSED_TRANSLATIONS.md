# Removing Unused Translations

Removing unused translations from a large and complex codebase presents unique challenges. This task requires a careful blend of automation and meticulous manual review due to the diverse ways translations are implemented and the lack of direct tools for this specific purpose.

## Overview

Successfully removed approximately 220 unused translations times three languages, an effort that proved to be quite beneficial.

## Process

### 1. Tool Selection

- The initial step involved researching tools that offer i18n-related utilities. Many tools were outdated or didn't meet our specific needs.
- The chosen tool for this task was [i18next-parser](https://github.com/i18next/i18next-parser), though it has its limitations.

### 2. Configuration

- Created a "i18next-parser.config.js" file in the project root, specifying supported languages, input, and output directories.

### 3. Script Implementation

- Added a script in `package.json` to run the library: `"i18n": "node_modules/i18next-parser/bin/cli.js --config i18next-parser.config.js"`.

### 4. Key Extraction

- The tool generated three new files for each language, containing all translation keys found throughout the codebase.

### !!!!! IMPORTANT !!!!!

- Due to limitations, not all translations were detected. Some keys are conditionally passed or embedded within complex expressions (e.g., switch-case, ternary operators), leading to undetected usage by the tool.

### 5. Key Removal

- Developed a script (`removeNonMatchingKeys.js`) to compare two JSON files and remove keys from the first file that don't exist in the second.
- The script also generated a file listing all removed keys.

### 6. Manual Review

- Manually reviewed nearly 300 removed keys to identify false positives, discovering over 60 instances where valid keys were incorrectly flagged for removal.

### 7. Reversion of False Positives

- Manually restored the falsely removed keys back into the `en.json` file.

### 8. Final Cleanup

- Applied the `removeNonMatchingKeys.js` script to the `de.json` and `fr.json` files, using `en.json` as the reference, to ensure consistency across all languages.
