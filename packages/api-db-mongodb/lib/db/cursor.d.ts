export declare class Cursor {
    static Delimiter: string;
    readonly id: string;
    readonly date?: Date;
    constructor(id: string, date?: Date);
    toString(): string;
    static from(encodedStr: string): Cursor;
}
//# sourceMappingURL=cursor.d.ts.map