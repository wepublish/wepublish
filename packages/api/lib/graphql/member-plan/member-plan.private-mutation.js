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
exports.updateMemberPlan = exports.createMemberPlan = exports.deleteMemberPlanById = void 0;
const permissions_1 = require("../permissions");
const deleteMemberPlanById = async (id, authenticate, memberPlan) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteMemberPlan, roles);
    return memberPlan.delete({
        where: {
            id
        },
        include: {
            availablePaymentMethods: true
        }
    });
};
exports.deleteMemberPlanById = deleteMemberPlanById;
const createMemberPlan = (_a, authenticate, memberPlan) => {
    var { availablePaymentMethods } = _a, input = __rest(_a, ["availablePaymentMethods"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateMemberPlan, roles);
    return memberPlan.create({
        data: Object.assign(Object.assign({}, input), { availablePaymentMethods: {
                createMany: {
                    data: availablePaymentMethods
                }
            } }),
        include: {
            availablePaymentMethods: true
        }
    });
};
exports.createMemberPlan = createMemberPlan;
const updateMemberPlan = async (id, _a, authenticate, memberPlan) => {
    var { availablePaymentMethods } = _a, input = __rest(_a, ["availablePaymentMethods"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateMemberPlan, roles);
    return memberPlan.update({
        where: { id },
        data: Object.assign(Object.assign({}, input), { availablePaymentMethods: {
                deleteMany: {
                    memberPlanId: {
                        equals: id
                    }
                },
                createMany: {
                    data: availablePaymentMethods
                }
            } }),
        include: {
            availablePaymentMethods: true
        }
    });
};
exports.updateMemberPlan = updateMemberPlan;
//# sourceMappingURL=member-plan.private-mutation.js.map