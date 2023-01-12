"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInvoice = exports.createInvoice = exports.deleteInvoiceById = void 0;
const permissions_1 = require("../permissions");
const deleteInvoiceById = async (id, authenticate, invoice) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteInvoice, roles);
    return invoice.delete({
        where: {
            id
        }
    });
};
exports.deleteInvoiceById = deleteInvoiceById;
const createInvoice = (_a, authenticate, invoice) => {
    var { items } = _a, input = __rest(_a, ["items"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateInvoice, roles);
    return invoice.create({
        data: Object.assign(Object.assign({}, input), { items: {
                create: items
            } }),
        include: {
            items: true
        }
    });
};
exports.createInvoice = createInvoice;
const updateInvoice = async (id, _a, authenticate, invoice) => {
    var { items } = _a, input = __rest(_a, ["items"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateInvoice, roles);
    return invoice.update({
        where: { id },
        data: Object.assign(Object.assign({}, input), { items: {
                deleteMany: {
                    invoiceId: {
                        equals: id
                    }
                },
                createMany: {
                    data: items
                }
            } }),
        include: {
            items: true
        }
    });
};
exports.updateInvoice = updateInvoice;
//# sourceMappingURL=invoice.private-mutation.js.map