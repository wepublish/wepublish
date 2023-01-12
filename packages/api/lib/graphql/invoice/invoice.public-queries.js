"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicInvoices = void 0;
const getPublicInvoices = async (authenticateUser, subscription, invoice) => {
    const { user: { id: userId } } = authenticateUser();
    const subscriptions = await subscription.findMany({
        where: {
            userID: userId
        }
    });
    const invoices = await invoice.findMany({
        where: {
            subscriptionID: {
                in: subscriptions.map(({ id }) => id)
            }
        },
        include: {
            items: true
        }
    });
    return invoices;
};
exports.getPublicInvoices = getPublicInvoices;
//# sourceMappingURL=invoice.public-queries.js.map