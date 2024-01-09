const fs = require('fs')

/**
 * Recursively removes keys from 'sourceObj' that are not present in 'referenceObj'.
 * @param {Object} sourceObj The source object from which keys are removed.
 * @param {Object} referenceObj The reference object used to determine which keys should be removed from the source object.
 * @param {String} parent Internal use only for tracking the key path.
 * @param {Array} removedKeys List to keep track of all removed keys.
 */
function removeNonMatchingKeys(sourceObj, referenceObj, parent = '', removedKeys = []) {
    if (
        typeof sourceObj !== 'object' ||
        typeof referenceObj !== 'object' ||
        sourceObj === null ||
        referenceObj === null
    ) {
        return
    }

    Object.keys(sourceObj).forEach(key => {
        const fullPath = parent ? `${parent}.${key}` : key
        if (referenceObj.hasOwnProperty(key)) {
            if (typeof sourceObj[key] === 'object' && typeof referenceObj[key] === 'object') {
                removeNonMatchingKeys(sourceObj[key], referenceObj[key], fullPath, removedKeys)
            }
        } else {
            removedKeys.push(fullPath)
            delete sourceObj[key]
        }
    })
}

const json1 = {} // paste first json here
const json2 = {} // paste second json here
let removedKeys = []

removeNonMatchingKeys(json1, json2, '', removedKeys)

fs.writeFileSync('./modified_jsonfile.json', JSON.stringify(json1, null, 2), 'utf8')
fs.writeFileSync('./removed_keys.json', JSON.stringify(removedKeys, null, 2), 'utf8')

// Console.log to indicate completion
console.log('Modified JSON saved to ./modified_jsonfile.json')
console.log('JSON with removed keys saved to ./removed_keys.json')
