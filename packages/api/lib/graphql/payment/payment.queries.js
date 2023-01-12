"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayments = exports.createPaymentFilter = exports.createPaymentOrder = void 0;
const common_1 = require("../../db/common");
const payment_1 = require("../../db/payment");
const sort_1 = require("../queries/sort");
const createPaymentOrder = (field, sortOrder) => {
    switch (field) {
        case payment_1.PaymentSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case payment_1.PaymentSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
    }
};
exports.createPaymentOrder = createPaymentOrder;
const createItendFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.intentID) {
        return {
            intentID: filter.intentID
        };
    }
    return {};
};
const createPaymentFilter = (filter) => ({
    AND: [createItendFilter(filter)]
});
exports.createPaymentFilter = createPaymentFilter;
const getPayments = async (filter, sortedField, order, cursorId, skip, take, payment) => {
    const orderBy = (0, exports.createPaymentOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createPaymentFilter)(filter);
    const [totalCount, payments] = await Promise.all([
        payment.count({
            where,
            orderBy
        }),
        payment.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined
        })
    ]);
    const nodes = payments.slice(0, take);
    const firstPayment = nodes[0];
    const lastPayment = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = payments.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstPayment === null || firstPayment === void 0 ? void 0 : firstPayment.id,
            endCursor: lastPayment === null || lastPayment === void 0 ? void 0 : lastPayment.id
        }
    };
};
exports.getPayments = getPayments;
//# sourceMappingURL=payment.queries.js.map