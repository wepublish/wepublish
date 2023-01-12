"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cursor = void 0;
const utility_1 = require("../utility");
class Cursor {
    constructor(id, date) {
        this.id = id;
        this.date = date;
    }
    toString() {
        const components = [];
        components.push(this.id);
        if (this.date)
            components.push(this.date.getTime());
        return (0, utility_1.base64Encode)(components.join(Cursor.Delimiter));
    }
    static from(encodedStr) {
        const str = (0, utility_1.base64Decode)(encodedStr);
        const [id, dateStr] = str.split(Cursor.Delimiter);
        return new Cursor(id, dateStr ? new Date(parseInt(dateStr)) : undefined);
    }
}
exports.Cursor = Cursor;
Cursor.Delimiter = '|';
//# sourceMappingURL=cursor.js.map