"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentMethods = exports.getPaymentMethodById = void 0;
const permissions_1 = require("../permissions");
const getPaymentMethodById = (id, authenticate, paymentMethodsByID) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPaymentMethod, roles);
    return paymentMethodsByID.load(id);
};
exports.getPaymentMethodById = getPaymentMethodById;
const getPaymentMethods = (authenticate, paymentMethod) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPaymentMethods, roles);
    return paymentMethod.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    });
};
exports.getPaymentMethods = getPaymentMethods;
//# sourceMappingURL=payment-method.private-queries.js.map