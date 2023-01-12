import pino from 'pino';
export interface OAuth2ServerOpts {
    readonly clientID: string;
    readonly clientSecret: string;
    readonly grantTypes: string[];
    readonly redirectUris: string[];
    readonly cookieKeys: string[];
    readonly jwksKeys: any;
    readonly issuer: string;
    readonly mongoUrlOauth2: string;
    readonly viewPath?: string;
    readonly debug?: boolean;
    readonly logger?: pino.Logger;
}
export declare class Oauth2Server {
    private readonly app;
    private readonly opts;
    private readonly prisma;
    constructor(opts: OAuth2ServerOpts);
    findAccount(ctx: any, id: any): Promise<{
        accountId: string;
        email: string;
        claims(use: any, scope: any): Promise<{
            sub: string;
            email: string;
        }>;
    }>;
    listen(port?: number, hostname?: string): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map