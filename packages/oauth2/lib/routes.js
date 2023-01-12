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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const querystring_1 = __importDefault(require("querystring"));
const util_1 = require("util");
const assert = __importStar(require("assert"));
const api_1 = require("@wepublish/api");
const body = (0, express_1.urlencoded)({ extended: false });
const keys = new Set();
const debug = (obj) => querystring_1.default.stringify(Object.entries(obj).reduce((acc, [key, value]) => {
    keys.add(key);
    if ((0, isEmpty_1.default)(value))
        return acc;
    acc[key] = (0, util_1.inspect)(value, { depth: null });
    return acc;
}, {}), '<br/>', ': ', {
    encodeURIComponent(value) {
        return keys.has(value) ? `<strong>${value}</strong>` : value;
    }
});
function routes(app, provider, prisma) {
    //const { constructor: { errors: { SessionNotFound } } } = provider;
    app.use((req, res, next) => {
        const orig = res.render;
        // you'll probably want to use a full blown render engine capable of layouts
        res.render = (view, locals) => {
            app.render(view, locals, (err, html) => {
                if (err)
                    throw err;
                orig.call(res, '_layout', Object.assign(Object.assign({}, locals), { body: html }));
            });
        };
        next();
    });
    function setNoCache(req, res, next) {
        res.set('Pragma', 'no-cache');
        res.set('Cache-Control', 'no-cache, no-store');
        next();
    }
    app.get('/interaction/:uid', setNoCache, async (req, res, next) => {
        try {
            const { uid, prompt, params, session } = await provider.interactionDetails(req, res);
            const client = await provider.Client.find(params.client_id);
            switch (prompt.name) {
                case 'login': {
                    return res.render('login', {
                        client,
                        uid,
                        details: prompt.details,
                        params,
                        title: 'Sign-in',
                        session: session ? debug(session) : undefined,
                        dbg: {
                            params: debug(params),
                            prompt: debug(prompt)
                        }
                    });
                }
                case 'consent': {
                    return res.render('interaction', {
                        client,
                        uid,
                        details: prompt.details,
                        params,
                        title: 'Authorize',
                        session: session ? debug(session) : undefined,
                        dbg: {
                            params: debug(params),
                            prompt: debug(prompt)
                        }
                    });
                }
                /*case 'select_account': {
                  if (!session) {
                    return provider.interactionFinished(req, res, { select_account: {} }, { mergeWithLastSubmission: false });
                  }
        
                  const account = await provider.Account.findAccount(undefined, session.accountId);
                  const { email } = await account.claims('prompt', 'email', { email: null }, []);
        
                  return res.render('select_account', {
                    client,
                    uid,
                    email,
                    details: prompt.details,
                    params,
                    title: 'Sign-in',
                    session: session ? debug(session) : undefined,
                    dbg: {
                      params: debug(params),
                      prompt: debug(prompt),
                    },
                  });
                }*/
                default:
                    return undefined;
            }
        }
        catch (err) {
            return next(err);
        }
    });
    app.post('/interaction/:uid/login', setNoCache, body, async (req, res, next) => {
        try {
            const { prompt: { name } } = await provider.interactionDetails(req, res);
            assert.equal(name, 'login');
            const account = await (0, api_1.getUserForCredentials)(req.body.login, req.body.password, prisma.user);
            if (!account) {
                throw new Error('User not found');
            }
            const result = {
                select_account: {},
                login: {
                    account: account.id
                }
            };
            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        }
        catch (err) {
            next(err);
        }
    });
    app.post('/interaction/:uid/continue', setNoCache, body, async (req, res, next) => {
        try {
            const interaction = await provider.interactionDetails(req, res);
            const { prompt: { name } } = interaction;
            assert.equal(name, 'select_account');
            if (req.body.switch) {
                if (interaction.params.prompt) {
                    const prompts = new Set(interaction.params.prompt.split(' '));
                    prompts.add('login');
                    interaction.params.prompt = [...prompts].join(' ');
                }
                else {
                    interaction.params.prompt = 'logout';
                }
                await interaction.save();
            }
            const result = { select_account: {} };
            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        }
        catch (err) {
            next(err);
        }
    });
    app.post('/interaction/:uid/confirm', setNoCache, body, async (req, res, next) => {
        try {
            const { prompt: { name } } = await provider.interactionDetails(req, res);
            assert.equal(name, 'consent');
            const consent = {};
            // any scopes you do not wish to grant go in here
            //   otherwise details.scopes.new.concat(details.scopes.accepted) will be granted
            consent.rejectedScopes = [];
            // any claims you do not wish to grant go in here
            //   otherwise all claims mapped to granted scopes
            //   and details.claims.new.concat(details.claims.accepted) will be granted
            consent.rejectedClaims = [];
            // replace = false means previously rejected scopes and claims remain rejected
            // changing this to true will remove those rejections in favour of just what you rejected above
            consent.replace = false;
            const result = { consent };
            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
        }
        catch (err) {
            next(err);
        }
    });
    app.get('/interaction/:uid/abort', setNoCache, async (req, res, next) => {
        try {
            const result = {
                error: 'access_denied',
                error_description: 'End-User aborted interaction'
            };
            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        }
        catch (err) {
            next(err);
        }
    });
    app.use((err, req, res, next) => {
        /*if (err instanceof SessionNotFound) {
          // handle interaction expired / session not found error
        }*/
        next(err);
    });
}
exports.routes = routes;
//# sourceMappingURL=routes.js.map