"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivities = void 0;
const activityEvent_1 = require("../../db/activityEvent");
const permissions_1 = require("../permissions");
const getActivities = async (authenticate, article, page, comment, subscription, author, poll, user) => {
    const { roles } = authenticate();
    const articles = (0, permissions_1.isAuthorised)(permissions_1.CanGetArticles, roles) ?
        (await article.findMany({
            take: 5,
            include: { draft: true, pending: true, published: true }
        })).map((value) => {
            var _a, _b, _c, _d, _e, _f;
            return {
                date: value.createdAt,
                eventType: activityEvent_1.EventType.Article,
                id: value.id,
                summary: (_f = (_d = (_b = (_a = value === null || value === void 0 ? void 0 : value.published) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : (_c = value === null || value === void 0 ? void 0 : value.pending) === null || _c === void 0 ? void 0 : _c.title) !== null && _d !== void 0 ? _d : (_e = value === null || value === void 0 ? void 0 : value.draft) === null || _e === void 0 ? void 0 : _e.title) !== null && _f !== void 0 ? _f : undefined
            };
        }) : [];
    const pages = (0, permissions_1.isAuthorised)(permissions_1.CanGetPages, roles) ? (await page.findMany({
        take: 5,
        include: { draft: true, pending: true, published: true }
    })).map((value) => {
        var _a, _b, _c, _d, _e, _f;
        return {
            date: value.createdAt,
            eventType: activityEvent_1.EventType.Page,
            id: value.id,
            summary: (_f = (_d = (_b = (_a = value === null || value === void 0 ? void 0 : value.published) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : (_c = value === null || value === void 0 ? void 0 : value.pending) === null || _c === void 0 ? void 0 : _c.title) !== null && _d !== void 0 ? _d : (_e = value === null || value === void 0 ? void 0 : value.draft) === null || _e === void 0 ? void 0 : _e.title) !== null && _f !== void 0 ? _f : null
        };
    }) : [];
    const comments = (0, permissions_1.isAuthorised)(permissions_1.CanGetComments, roles) ? (await comment.findMany({ take: 5, include: { user: true } })).map((value) => {
        var _a;
        return {
            date: value.createdAt,
            eventType: activityEvent_1.EventType.Comment,
            id: value.id,
            creator: (_a = value.user.name) !== null && _a !== void 0 ? _a : value.guestUsername
        };
    }) : [];
    const authors = (0, permissions_1.isAuthorised)(permissions_1.CanGetAuthors, roles) ? (await author.findMany({ take: 5 })).map((value) => {
        var _a;
        return {
            date: value.createdAt,
            eventType: activityEvent_1.EventType.Author,
            id: value.id,
            summary: `${(_a = value === null || value === void 0 ? void 0 : value.name) !== null && _a !== void 0 ? _a : ''} ${(value === null || value === void 0 ? void 0 : value.jobTitle) ? ', ' + value.jobTitle : ''}`
        };
    }) : [];
    const subscriptions = (0, permissions_1.isAuthorised)(permissions_1.CanGetSubscriptions, roles) ? (await subscription.findMany({ take: 5, include: { memberPlan: true, user: true } })).map((value) => {
        var _a;
        return {
            date: value.createdAt,
            eventType: activityEvent_1.EventType.Subscription,
            id: value.id,
            summary: `on ${value === null || value === void 0 ? void 0 : value.memberPlan.name}`,
            creator: (_a = value === null || value === void 0 ? void 0 : value.user) === null || _a === void 0 ? void 0 : _a.name
        };
    }) : [];
    const polls = (0, permissions_1.isAuthorised)(permissions_1.CanGetPoll, roles) ? (await poll.findMany({ take: 5 })).map((value) => {
        return {
            date: value.opensAt,
            eventType: activityEvent_1.EventType.Poll,
            id: value.id,
            summary: value.question
        };
    }) : [];
    const users = (0, permissions_1.isAuthorised)(permissions_1.CanGetUsers, roles) ? (await user.findMany({ take: 5 })).map((value) => {
        return {
            date: value.createdAt,
            eventType: activityEvent_1.EventType.User,
            id: value.id,
            summary: value.name
        };
    }) : [];
    const activityEvents = [...articles, ...pages, ...comments, ...authors, ...subscriptions, ...polls, ...users];
    return activityEvents.sort((v1, v2) => v2.date - v1.date);
};
exports.getActivities = getActivities;
//# sourceMappingURL=activityEvent.private-queries.js.map