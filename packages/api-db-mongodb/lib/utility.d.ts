export declare const IDAlphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export declare function generateID(): string;
export declare function generateToken(): string;
export declare function base64Encode(str: string): string;
export declare function base64Decode(str: string): string;
export declare function isNonNull<T>(value: T): value is NonNullable<T>;
export declare enum MongoErrorCode {
    DuplicateKey = 11000
}
/**
 * this method gets a string with special characters like:
 *  - , [ , ] , / , { , } , ( , ) , * , + , ? , . , \ , ^ , $ , |
 * and it adds \ the slash to let regex works properly as intended
 * @param string string with special characters
 */
export declare function escapeRegExp(string: string): string;
export declare function slugify(str: string): string;
//# sourceMappingURL=utility.d.ts.map