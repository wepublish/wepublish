"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminPayments = exports.getPaymentById = void 0;
const permissions_1 = require("../permissions");
const payment_queries_1 = require("./payment.queries");
const getPaymentById = (id, authenticate, paymentsByID) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPayment, roles);
    return paymentsByID.load(id);
};
exports.getPaymentById = getPaymentById;
const getAdminPayments = async (filter, sortedField, order, cursorId, skip, take, authenticate, payment) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPayments, roles);
    return (0, payment_queries_1.getPayments)(filter, sortedField, order, cursorId, skip, take, payment);
};
exports.getAdminPayments = getAdminPayments;
//# sourceMappingURL=payment.private-queries.js.map