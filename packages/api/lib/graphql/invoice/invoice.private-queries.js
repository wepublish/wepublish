"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminInvoices = exports.getInvoiceById = void 0;
const permissions_1 = require("../permissions");
const invoice_queries_1 = require("./invoice.queries");
const getInvoiceById = (id, authenticate, invoicesByID) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetInvoice, roles);
    return invoicesByID.load(id);
};
exports.getInvoiceById = getInvoiceById;
const getAdminInvoices = async (filter, sortedField, order, cursorId, skip, take, authenticate, invoice) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetInvoices, roles);
    return (0, invoice_queries_1.getInvoices)(filter, sortedField, order, cursorId, skip, take, invoice);
};
exports.getAdminInvoices = getAdminInvoices;
//# sourceMappingURL=invoice.private-queries.js.map