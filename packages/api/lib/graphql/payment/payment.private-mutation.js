"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentFromInvoice = void 0;
const permissions_1 = require("../permissions");
const client_1 = require("@prisma/client");
const createPaymentFromInvoice = async (input, authenticate, paymentProviders, invoicesByID, paymentMethodsByID, paymentClient) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreatePayment, roles);
    const { invoiceID, paymentMethodID, successURL, failureURL } = input;
    const paymentMethod = await paymentMethodsByID.load(paymentMethodID);
    const paymentProvider = paymentProviders.find(pp => pp.id === (paymentMethod === null || paymentMethod === void 0 ? void 0 : paymentMethod.paymentProviderID));
    const invoice = await invoicesByID.load(invoiceID);
    if (!invoice || !paymentProvider) {
        throw new Error('Invalid data'); // TODO: better error handling
    }
    const payment = await paymentClient.create({
        data: {
            paymentMethodID,
            invoiceID,
            state: client_1.PaymentState.created
        }
    });
    const intent = await paymentProvider.createIntent({
        paymentID: payment.id,
        invoice,
        saveCustomer: true,
        successURL,
        failureURL
    });
    return await paymentClient.update({
        where: { id: payment.id },
        data: {
            state: intent.state,
            intentID: intent.intentID,
            intentData: intent.intentData,
            intentSecret: intent.intentSecret,
            paymentData: intent.paymentData,
            paymentMethodID: payment.paymentMethodID,
            invoiceID: payment.invoiceID
        }
    });
};
exports.createPaymentFromInvoice = createPaymentFromInvoice;
//# sourceMappingURL=payment.private-mutation.js.map