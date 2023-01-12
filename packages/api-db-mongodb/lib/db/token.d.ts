import { DBTokenAdapter, Token, TokenInput } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBTokenAdapter implements DBTokenAdapter {
    private tokens;
    constructor(db: Db);
    createToken(input: TokenInput): Promise<Token>;
    getTokens(): Promise<Token[]>;
    deleteToken(id: string): Promise<string | null>;
    getTokenByString(token: string): Promise<Token | null>;
}
//# sourceMappingURL=token.d.ts.map