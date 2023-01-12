export declare enum CollectionName {
    Migrations = "migrations",
    AccessToken = "access_token",
    AuthorizationCode = "authorization_code",
    Session = "session"
}
export interface DBMigration {
    _id: any;
    version: number;
    createdAt: Date;
}
export interface DBOAuth2Token {
    _id: any;
    expiresAt: Date;
    payload: any;
}
//# sourceMappingURL=0.d.ts.map