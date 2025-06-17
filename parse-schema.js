#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BUILTIN_SCALARS = new Set(["Int", "Float", "String", "Boolean", "ID"]);

/**
 * Extract GraphQL type names from a string, excluding built-in scalar types
 * @param {string} str - The string to extract type names from
 * @returns {string[]} - Array of type names
 */
function extractTypeNames(str) {
  const typeRegex = /\b[A-Z][A-Za-z0-9_]*\b/g;
  return (str.match(typeRegex) || []).filter(t => !BUILTIN_SCALARS.has(t));
}

/**
 * Extract all type names from the GraphQL schema
 * @param {string} schemaText - The GraphQL schema text
 * @returns {string[]} - Array of type names
 */
function extractAllTypeNames(schemaText) {
  const typeDefinitions = [];
  
  // Match type definitions
  const typeMatches = schemaText.matchAll(/type\s+([A-Za-z0-9_]+)/g);
  for (const match of typeMatches) {
    typeDefinitions.push(match[1]);
  }
  
  // Match interface definitions
  const interfaceMatches = schemaText.matchAll(/interface\s+([A-Za-z0-9_]+)/g);
  for (const match of interfaceMatches) {
    typeDefinitions.push(match[1]);
  }
  
  // Match enum definitions
  const enumMatches = schemaText.matchAll(/enum\s+([A-Za-z0-9_]+)/g);
  for (const match of enumMatches) {
    typeDefinitions.push(match[1]);
  }
  
  // Match input definitions
  const inputMatches = schemaText.matchAll(/input\s+([A-Za-z0-9_]+)/g);
  for (const match of inputMatches) {
    typeDefinitions.push(match[1]);
  }
  
  // Match union definitions
  const unionMatches = schemaText.matchAll(/union\s+([A-Za-z0-9_]+)/g);
  for (const match of unionMatches) {
    typeDefinitions.push(match[1]);
  }
  
  // Match scalar definitions
  const scalarMatches = schemaText.matchAll(/scalar\s+([A-Za-z0-9_]+)/g);
  for (const match of scalarMatches) {
    typeDefinitions.push(match[1]);
  }
  
  return typeDefinitions;
}

/**
 * Extract all Query and Mutation field names from the GraphQL schema
 * @param {string} schemaText - The GraphQL schema text
 * @returns {string[]} - Array of field names
 */
function extractOperationFieldNames(schemaText) {
  const fieldNames = [];
  
  // Extract Query fields
  const queryMatch = schemaText.match(/type\s+Query\s*{([^}]*)}/s);
  if (queryMatch) {
    const queryFields = queryMatch[1].split('\n');
    for (const field of queryFields) {
      const match = field.match(/\s*([a-zA-Z0-9_]+)(?:\([^)]*\))?:/); 
      if (match) {
        fieldNames.push(match[1]);
      }
    }
  }
  
  // Extract Mutation fields
  const mutationMatch = schemaText.match(/type\s+Mutation\s*{([^}]*)}/s);
  if (mutationMatch) {
    const mutationFields = mutationMatch[1].split('\n');
    for (const field of mutationFields) {
      const match = field.match(/\s*([a-zA-Z0-9_]+)(?:\([^)]*\))?:/); 
      if (match) {
        fieldNames.push(match[1]);
      }
    }
  }
  
  return fieldNames;
}

/**
 * Extract dependencies from a GraphQL schema to match the format in final_graphql_dependencies.json
 * @param {string} schemaText - The GraphQL schema text
 * @returns {Object} - The dependency graph
 */
function extractDependencies(schemaText) {
  // Get all type names and operation field names
  const allTypeNames = extractAllTypeNames(schemaText);
  const allFieldNames = extractOperationFieldNames(schemaText);
  
  // Initialize the dependency map with all types and fields
  const depMap = {};
  
  // Initialize all types with empty dependencies
  allTypeNames.forEach(typeName => {
    depMap[typeName] = { Deps: [], dependant: [] };
  });
  
  // Initialize all operation fields
  allFieldNames.forEach(fieldName => {
    depMap[fieldName] = { Deps: [], dependant: [] };
  });
  
  // Process type dependencies
  for (const typeName of allTypeNames) {
    // Find the type definition
    const typeDefRegex = new RegExp(`(type|interface|enum|input|union|scalar)\\s+${typeName}\\s*(?:implements\\s+[A-Za-z0-9_,\\s]+)?\\s*(?:=\\s*[A-Za-z0-9_|\\s]+)?\\s*{[^}]*}`, 's');
    const typeDefMatch = schemaText.match(typeDefRegex);
    
    if (typeDefMatch) {
      const typeDef = typeDefMatch[0];
      
      // Check if this is an input type
      const isInputType = typeDef.trim().startsWith('input ');
      const isObjectType = typeDef.trim().startsWith('type ');
      
      // Find all referenced types in this type definition
      for (const otherTypeName of allTypeNames) {
        if (typeName === otherTypeName) continue;
        
        // Look for the type in field definitions, implements clauses, or union types
        const hasTypeReference = (
          (new RegExp(`:\\s*[!\\[]*${otherTypeName}[!\\])]?`, 'g')).test(typeDef) || 
          (new RegExp(`implements\\s+([A-Za-z0-9_,\\s]*${otherTypeName}[A-Za-z0-9_,\\s]*)`, 'g')).test(typeDef) ||
          (new RegExp(`=\\s*([A-Za-z0-9_|\\s]*${otherTypeName}[A-Za-z0-9_|\\s]*)`, 'g')).test(typeDef)
        );
        
        if (hasTypeReference) {
          // For input types and object types, we want to track their dependencies
          if (isInputType || isObjectType) {
            // Add the referenced type as a dependency
            if (!depMap[typeName].Deps.includes(otherTypeName)) {
              depMap[typeName].Deps.push(otherTypeName);
            }
            
            // Also add this type as a dependant of the other type
            if (!depMap[otherTypeName].dependant.includes(typeName)) {
              depMap[otherTypeName].dependant.push(typeName);
            }
          } 
          // For other types (interfaces, unions, etc.), we keep the old behavior
          else {
            // Add this type as a dependant of the other type
            if (!depMap[otherTypeName].dependant.includes(typeName)) {
              depMap[otherTypeName].dependant.push(typeName);
            }
          }
        }
      }
    }
  }
  
  // Process operation fields
  const queryMatch = schemaText.match(/type\s+Query\s*{([^}]*)}/s);
  const mutationMatch = schemaText.match(/type\s+Mutation\s*{([^}]*)}/s);
  
  // Helper function to process operation fields
  const processOperationFields = (fields, operationType) => {
    for (const field of fields) {
      const fieldMatch = field.match(/\s*([a-zA-Z0-9_]+)(?:\([^)]*\))?:\s*([^\s]+)/);
      if (fieldMatch) {
        const [, fieldName, fieldType] = fieldMatch;
        
        // Create the entry for this field if it doesn't exist
        if (!depMap[fieldName]) {
          depMap[fieldName] = { Deps: [], dependant: [] };
        }
        
        // Extract only the main return type (not nested generic types)
        // This handles cases like Type, [Type], Type!, [Type!]!, etc.
        let mainReturnType = null;
        
        // First, remove any ! or [] characters
        const cleanType = fieldType.replace(/[\[\]!]/g, '');
        
        // Then check if this clean type exists in our type list
        for (const typeName of allTypeNames) {
          if (cleanType === typeName) {
            mainReturnType = typeName;
            break;
          }
        }
        
        // If we couldn't find an exact match, try to extract from the field type
        if (!mainReturnType) {
          for (const typeName of allTypeNames) {
            if (fieldType.includes(typeName)) {
              mainReturnType = typeName;
              break;
            }
          }
        }
        
        // Add the main return type as a dependency
        if (mainReturnType) {
          if (!depMap[fieldName].Deps.includes(mainReturnType)) {
            if (depMap[fieldName].Deps.length === 0) {
              depMap[fieldName].Deps = [mainReturnType]; // Add as first dependency
            } else {
              depMap[fieldName].Deps.push(mainReturnType); // Add to existing deps
            }
          }
          
          // Add field as dependant of the type
          if (!depMap[mainReturnType].dependant.includes(fieldName)) {
            depMap[mainReturnType].dependant.push(fieldName);
          }
        }
        
        // Process parameter types (find input types used as parameters)
        const paramSection = field.match(/\(([^)]*)\)/);
        if (paramSection) {
          const params = paramSection[1];
          
          // Find all input types used as parameters
          for (const typeName of allTypeNames) {
            // Look for patterns like: filter: AuthorFilter or filter:AuthorFilter
            if (params.includes(`: ${typeName}`) || params.includes(`:${typeName}`)) {
              // Add the parameter type as a dependency of the operation
              if (!depMap[fieldName].Deps.includes(typeName)) {
                depMap[fieldName].Deps.push(typeName);
              }
              
              // Also add this field as a dependant of the parameter type
              if (!depMap[typeName].dependant.includes(fieldName)) {
                depMap[typeName].dependant.push(fieldName);
              }
            }
          }
        }
      }
    }
  };
  
  // Process Query fields
  if (queryMatch) {
    const queryFields = queryMatch[1].split('\n').filter(line => line.trim());
    processOperationFields(queryFields, 'Query');
  }
  
  // Process Mutation fields
  if (mutationMatch) {
    const mutationFields = mutationMatch[1].split('\n').filter(line => line.trim());
    processOperationFields(mutationFields, 'Mutation');
  }
  
  // Types to completely remove from the output
  const typesToRemove = [
    // Internal GraphQL types
    'Query', 'Mutation', '_Entity', '_Service', '_service', '_entities',
    
    // Common scalar types to completely remove
    'Date', 'DateTime', 'Time', 'Boolean', 'ID', 'String', 'Int', 'Float',
    'Upload', 'Color', 'RichText', 'Slug', 'JSONObject', 'JSON',
    
    // Generic GraphQL objects
    'PageInfo'
  ];
  
  // Remove the types from the dependency map
  typesToRemove.forEach(typeToRemove => {
    delete depMap[typeToRemove];
  });
  
  // Also remove references to these types from all dependant arrays
  Object.keys(depMap).forEach(typeName => {
    if (depMap[typeName].dependant) {
      depMap[typeName].dependant = depMap[typeName].dependant.filter(
        dep => !typesToRemove.includes(dep)
      );
    }
  });
  
  // Filter out removed types from dependencies
  Object.keys(depMap).forEach(typeName => {
    if (depMap[typeName].Deps) {
      depMap[typeName].Deps = depMap[typeName].Deps.filter(
        dep => !typesToRemove.includes(dep)
      );
    }
  });
  
  return depMap;
}

// Check if a schema file path is provided
if (process.argv.length < 3) {
  console.error('Please provide a path to the GraphQL schema file.');
  console.error('Usage: node parse-schema.js <schema-file-path>');
  process.exit(1);
}

// Get schema file path from command line arguments
const schemaFilePath = path.resolve(process.argv[2]);

try {
  // Read and parse the schema file
  const schemaText = fs.readFileSync(schemaFilePath, 'utf-8');
  const dependencyGraph = extractDependencies(schemaText);

  // Output the dependency graph to stdout
  console.log(JSON.stringify(dependencyGraph, null, 2));
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
