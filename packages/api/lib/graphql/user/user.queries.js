"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserForCredentials = exports.getUsers = exports.createUserFilter = exports.createUserOrder = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const common_1 = require("../../db/common");
const user_1 = require("../../db/user");
const validator_1 = require("../../validator");
const sort_1 = require("../queries/sort");
const createUserOrder = (field, sortOrder) => {
    switch (field) {
        case user_1.UserSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case user_1.UserSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
        case user_1.UserSort.Name:
            return {
                name: sortOrder
            };
        case user_1.UserSort.FirstName:
            return {
                firstName: sortOrder
            };
    }
};
exports.createUserOrder = createUserOrder;
const createNameFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.name) {
        return {
            name: {
                contains: filter.text,
                mode: 'insensitive'
            }
        };
    }
    return {};
};
const createTextFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.text) {
        return {
            OR: [
                {
                    preferredName: {
                        contains: filter.text,
                        mode: 'insensitive'
                    }
                },
                {
                    firstName: {
                        contains: filter.text,
                        mode: 'insensitive'
                    }
                },
                {
                    name: {
                        contains: filter.text,
                        mode: 'insensitive'
                    }
                },
                {
                    email: {
                        contains: filter.text,
                        mode: 'insensitive'
                    }
                },
                {
                    address: {
                        OR: [
                            {
                                streetAddress: {
                                    contains: filter.text,
                                    mode: 'insensitive'
                                }
                            },
                            {
                                zipCode: {
                                    contains: filter.text,
                                    mode: 'insensitive'
                                }
                            },
                            {
                                city: {
                                    contains: filter.text,
                                    mode: 'insensitive'
                                }
                            }
                        ]
                    }
                }
            ]
        };
    }
    return {};
};
const createUserFilter = (filter) => ({
    AND: [createNameFilter(filter), createTextFilter(filter)]
});
exports.createUserFilter = createUserFilter;
const getUsers = async (filter, sortedField, order, cursorId, skip, take, user) => {
    const orderBy = (0, exports.createUserOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createUserFilter)(filter);
    const [totalCount, users] = await Promise.all([
        user.count({
            where,
            orderBy
        }),
        user.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined,
            select: user_1.unselectPassword
        })
    ]);
    const nodes = users.slice(0, take);
    const firstUser = nodes[0];
    const lastUser = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = users.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstUser === null || firstUser === void 0 ? void 0 : firstUser.id,
            endCursor: lastUser === null || lastUser === void 0 ? void 0 : lastUser.id
        }
    };
};
exports.getUsers = getUsers;
const getUserForCredentials = async (email, password, userClient) => {
    email = email.toLowerCase();
    await validator_1.Validator.login().validateAsync({ email });
    const user = await userClient.findUnique({
        where: {
            email
        },
        include: {
            address: true,
            oauth2Accounts: true,
            paymentProviderCustomers: true,
            properties: true
        }
    });
    if (!user) {
        return null;
    }
    const theSame = await bcrypt_1.default.compare(password, user.password);
    if (!theSame) {
        return null;
    }
    return user;
};
exports.getUserForCredentials = getUserForCredentials;
//# sourceMappingURL=user.queries.js.map