"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoices = exports.createInvoiceFilter = exports.createInvoiceOrder = void 0;
const common_1 = require("../../db/common");
const invoice_1 = require("../../db/invoice");
const sort_1 = require("../queries/sort");
const createInvoiceOrder = (field, sortOrder) => {
    switch (field) {
        case invoice_1.InvoiceSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case invoice_1.InvoiceSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
        case invoice_1.InvoiceSort.PaidAt:
            return {
                paidAt: sortOrder
            };
    }
};
exports.createInvoiceOrder = createInvoiceOrder;
const createUserFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.userID) {
        return {
            userID: filter.userID
        };
    }
    return {};
};
const createMailFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.mail) {
        return {
            mail: {
                contains: filter.mail,
                mode: 'insensitive'
            }
        };
    }
    return {};
};
const createPaidAtFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.paidAt) {
        const { comparison, date } = filter.paidAt;
        const mappedComparison = comparison === common_1.DateFilterComparison.Equal ? 'equals' : comparison;
        return {
            paidAt: {
                [mappedComparison]: date
            }
        };
    }
    return {};
};
const createCancelledAtFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.canceledAt) {
        const { comparison, date } = filter.canceledAt;
        const mappedComparison = comparison === common_1.DateFilterComparison.Equal ? 'equals' : comparison;
        return {
            canceledAt: {
                [mappedComparison]: date
            }
        };
    }
    return {};
};
const createSubscriptionFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.subscriptionID) {
        return {
            subscriptionID: filter.subscriptionID
        };
    }
    return {};
};
const createInvoiceFilter = (filter) => ({
    AND: [
        createUserFilter(filter),
        createMailFilter(filter),
        createPaidAtFilter(filter),
        createCancelledAtFilter(filter),
        createSubscriptionFilter(filter)
    ]
});
exports.createInvoiceFilter = createInvoiceFilter;
const getInvoices = async (filter, sortedField, order, cursorId, skip, take, invoice) => {
    const orderBy = (0, exports.createInvoiceOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createInvoiceFilter)(filter);
    const [totalCount, invoices] = await Promise.all([
        invoice.count({
            where,
            orderBy
        }),
        invoice.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined,
            include: {
                items: true
            }
        })
    ]);
    const nodes = invoices.slice(0, take);
    const firstInvoice = nodes[0];
    const lastInvoice = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = invoices.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstInvoice === null || firstInvoice === void 0 ? void 0 : firstInvoice.id,
            endCursor: lastInvoice === null || lastInvoice === void 0 ? void 0 : lastInvoice.id
        }
    };
};
exports.getInvoices = getInvoices;
//# sourceMappingURL=invoice.queries.js.map