"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentMethod = exports.createPaymentMethod = exports.deletePaymentMethodById = void 0;
const permissions_1 = require("../permissions");
const deletePaymentMethodById = (id, authenticate, paymentMethod) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeletePaymentMethod, roles);
    return paymentMethod.delete({
        where: {
            id
        }
    });
};
exports.deletePaymentMethodById = deletePaymentMethodById;
const createPaymentMethod = (input, authenticate, paymentMethod) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreatePaymentMethod, roles);
    return paymentMethod.create({
        data: input
    });
};
exports.createPaymentMethod = createPaymentMethod;
const updatePaymentMethod = (id, input, authenticate, paymentMethod) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreatePaymentMethod, roles);
    return paymentMethod.update({
        where: { id },
        data: input
    });
};
exports.updatePaymentMethod = updatePaymentMethod;
//# sourceMappingURL=payment-method.private-mutation.js.map