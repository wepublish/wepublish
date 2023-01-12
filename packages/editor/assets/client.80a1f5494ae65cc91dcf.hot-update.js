webpackHotUpdate("client",{

/***/ "./src/client/routes/dashboard.tsx":
/*!*****************************************!*\
  !*** ./src/client/routes/dashboard.tsx ***!
  \*****************************************/
/*! exports provided: Dashboard */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(module) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Dashboard", function() { return Dashboard; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "../../node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_i18next__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-i18next */ "../../node_modules/react-i18next/dist/es/index.js");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../api */ "./src/client/api/index.ts");
/* harmony import */ var _atoms_dashboard_activityFeed__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../atoms/dashboard/activityFeed */ "./src/client/atoms/dashboard/activityFeed.tsx");
/* harmony import */ var _atoms_dashboard_subscriberChart__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../atoms/dashboard/subscriberChart */ "./src/client/atoms/dashboard/subscriberChart.tsx");
/* harmony import */ var rsuite__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! rsuite */ "../../node_modules/rsuite/esm/index.js");
/* harmony import */ var _atoms_permissionControl__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../atoms/permissionControl */ "./src/client/atoms/permissionControl.tsx");
(function () {
  var enterModule = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.enterModule : undefined;
  enterModule && enterModule(module);
})();

var __signature__ = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal["default"].signature : function (a) {
  return a;
};








function Dashboard() {
  var _useTranslation = Object(react_i18next__WEBPACK_IMPORTED_MODULE_1__["useTranslation"])(),
      t = _useTranslation.t;

  var _useMeQuery = Object(_api__WEBPACK_IMPORTED_MODULE_2__["useMeQuery"])(),
      me = _useMeQuery.data;

  var name = Object(react__WEBPACK_IMPORTED_MODULE_0__["useMemo"])(function () {
    var _ref, _ref2, _me$me$preferredName, _me$me, _me$me2, _me$me3;

    return (_ref = (_ref2 = (_me$me$preferredName = me === null || me === void 0 ? void 0 : (_me$me = me.me) === null || _me$me === void 0 ? void 0 : _me$me.preferredName) !== null && _me$me$preferredName !== void 0 ? _me$me$preferredName : me === null || me === void 0 ? void 0 : (_me$me2 = me.me) === null || _me$me2 === void 0 ? void 0 : _me$me2.firstName) !== null && _ref2 !== void 0 ? _ref2 : me === null || me === void 0 ? void 0 : (_me$me3 = me.me) === null || _me$me3 === void 0 ? void 0 : _me$me3.name) !== null && _ref !== void 0 ? _ref : 'User';
  }, [me]);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(react__WEBPACK_IMPORTED_MODULE_0___default.a.Fragment, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("h2", null, t('dashboard.dashboard')), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("h4", null, t('dashboard.greeting', {
    name: name
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(rsuite__WEBPACK_IMPORTED_MODULE_5__["FlexboxGrid"], {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(rsuite__WEBPACK_IMPORTED_MODULE_5__["FlexboxGrid"].Item, {
    colspan: 12
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("h4", {
    style: {
      textAlign: "center"
    }
  }, t('dashboard.activity')), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_atoms_dashboard_activityFeed__WEBPACK_IMPORTED_MODULE_3__["ActivityFeed"], null)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_atoms_permissionControl__WEBPACK_IMPORTED_MODULE_6__["PermissionControl"], {
    qualifyingPermissions: ['CAN_GET_SUBSCRIPTIONS']
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(rsuite__WEBPACK_IMPORTED_MODULE_5__["FlexboxGrid"].Item, {
    colspan: 12
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("h4", {
    style: {
      textAlign: "center"
    }
  }, t('dashboard.newSubscribers')), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_atoms_dashboard_subscriberChart__WEBPACK_IMPORTED_MODULE_4__["SubscriberChart"], null)))));
}

__signature__(Dashboard, "useTranslation{{t}}\nuseMeQuery{{data: me}}\nuseMemo{name}", function () {
  return [react_i18next__WEBPACK_IMPORTED_MODULE_1__["useTranslation"], _api__WEBPACK_IMPORTED_MODULE_2__["useMeQuery"]];
});

;

(function () {
  var reactHotLoader = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.default : undefined;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(Dashboard, "Dashboard", "/home/penina/code/wepublish/wepublish/packages/editor/src/client/routes/dashboard.tsx");
})();

;

(function () {
  var leaveModule = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.leaveModule : undefined;
  leaveModule && leaveModule(module);
})();
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../../node_modules/webpack/buildin/harmony-module.js */ "../../node_modules/webpack/buildin/harmony-module.js")(module)))

/***/ })

})
//# sourceMappingURL=client.80a1f5494ae65cc91dcf.hot-update.js.map