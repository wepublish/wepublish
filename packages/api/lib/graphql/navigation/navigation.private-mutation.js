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
exports.updateNavigation = exports.createNavigation = exports.deleteNavigationById = void 0;
const permissions_1 = require("../permissions");
const deleteNavigationById = (id, authenticate, navigation) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteNavigation, roles);
    return navigation.delete({
        where: {
            id
        },
        include: {
            links: true
        }
    });
};
exports.deleteNavigationById = deleteNavigationById;
const createNavigation = (_a, authenticate, navigation) => {
    var { links } = _a, input = __rest(_a, ["links"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateNavigation, roles);
    return navigation.create({
        data: Object.assign(Object.assign({}, input), { links: {
                createMany: {
                    data: links
                }
            } }),
        include: {
            links: true
        }
    });
};
exports.createNavigation = createNavigation;
const updateNavigation = async (id, _a, authenticate, navigation) => {
    var { links } = _a, input = __rest(_a, ["links"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateNavigation, roles);
    return navigation.update({
        where: { id },
        data: Object.assign(Object.assign({}, input), { links: {
                deleteMany: {
                    navigationId: {
                        equals: id
                    }
                },
                createMany: {
                    data: links
                }
            } }),
        include: {
            links: true
        }
    });
};
exports.updateNavigation = updateNavigation;
//# sourceMappingURL=navigation.private-mutation.js.map