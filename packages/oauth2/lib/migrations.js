"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LatestMigration = exports.Migrations = void 0;
const v0 = __importStar(require("./schema/0"));
//const SessionDocumentTTL = 60 * 60 * 24 // 24h
exports.Migrations = [
    {
        version: 0,
        async migrate(db, locale) {
            const migrations = await db.createCollection(v0.CollectionName.Migrations, {
                strict: true
            });
            await migrations.createIndex({ name: 1 }, { unique: true });
            const accessToken = await db.createCollection(v0.CollectionName.AccessToken, {
                strict: true
            });
            await accessToken.createIndex({ 'payload.grantId': 1 });
            const authorizationCode = await db.createCollection(v0.CollectionName.AuthorizationCode, {
                strict: true
            });
            await authorizationCode.createIndex({ 'payload.grantId': 1 });
            const session = await db.createCollection(v0.CollectionName.Session, {
                strict: true
            });
            await session.createIndex({ 'payload.uid': 1 }, { unique: true });
        }
    }
];
exports.LatestMigration = exports.Migrations[exports.Migrations.length - 1];
//# sourceMappingURL=migrations.js.map