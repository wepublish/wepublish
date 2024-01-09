const fs = require('fs');

const json1 = {} // paste first json here

const json2 = {} // paste second json here

let removedKeys = [];

function removeNonMatchingKeys(obj1, obj2, parent = '') {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return;
    }

    Object.keys(obj1).forEach(key => {
        const fullPath = parent ? `${parent}.${key}` : key;
        if (obj2.hasOwnProperty(key)) {
            if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
                removeNonMatchingKeys(obj1[key], obj2[key], fullPath);
            }
        } else {
            removedKeys.push(fullPath);
            delete obj1[key];
        }
    });
}

removeNonMatchingKeys(json1, json2);

fs.writeFileSync('./modified_jsonfile.json', JSON.stringify(json1, null, 2), 'utf8');
fs.writeFileSync('./removed_keys.txt', removedKeys.join('\n'), 'utf8');

// Console.log to indicate completion
console.log('Modified JSON saved to ./modified_jsonfile.json');
console.log('JSON with removed keys saved to ./removed_keys.txt');