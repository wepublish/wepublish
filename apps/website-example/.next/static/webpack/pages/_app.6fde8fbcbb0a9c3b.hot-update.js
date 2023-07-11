"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("pages/_app",{

/***/ "../../libs/comments/website/src/lib/comment-list/comment-list-container.tsx":
/*!***********************************************************************************!*\
  !*** ../../libs/comments/website/src/lib/comment-list/comment-list-container.tsx ***!
  \***********************************************************************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"CommentListContainer\": function() { return /* binding */ CommentListContainer; }\n/* harmony export */ });\n/* harmony import */ var _emotion_react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @emotion/react/jsx-dev-runtime */ \"../../node_modules/@emotion/react/jsx-dev-runtime/dist/emotion-react-jsx-dev-runtime.browser.esm.js\");\n/* harmony import */ var _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wepublish/website/api */ \"../../libs/website/api/src/index.ts\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"../../node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _wepublish_website_builder__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wepublish/website/builder */ \"../../libs/website/builder/src/index.ts\");\n/* harmony import */ var _wepublish_authentication_website__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wepublish/authentication/website */ \"../../libs/authentication/website/src/index.ts\");\n/* harmony import */ var _comment_list_state__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./comment-list.state */ \"../../libs/comments/website/src/lib/comment-list/comment-list.state.tsx\");\n/* harmony import */ var immer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! immer */ \"../../node_modules/immer/dist/immer.mjs\");\nvar _s = $RefreshSig$(), _s1 = $RefreshSig$();\n\nvar _s2 = $RefreshSig$(), _s11 = $RefreshSig$();\n\n\n\n\n\n\n\nconst useAddCommentMutationWithCacheUpdate = function(variables) {\n    _s();\n    for(var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){\n        params[_key - 1] = arguments[_key];\n    }\n    _s2();\n    return (0,_wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useAddCommentMutation)({\n        update: (cache, param)=>{\n            let { data  } = param;\n            const query = cache.readQuery({\n                query: _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.CommentListDocument,\n                variables\n            });\n            if (!query || !(data === null || data === void 0 ? void 0 : data.addComment)) {\n                return;\n            }\n            const updatedComments = (0,immer__WEBPACK_IMPORTED_MODULE_5__.produce)(query.comments, (comments)=>{\n                const allComments = extractAllComments(comments);\n                const parentComment = allComments.find((comment)=>comment.id === data.addComment.parentID);\n                if (parentComment) {\n                    parentComment.children.unshift(data.addComment);\n                } else {\n                    comments.unshift(data.addComment);\n                }\n            });\n            cache.writeQuery({\n                query: _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.CommentListDocument,\n                data: {\n                    comments: updatedComments\n                },\n                variables\n            });\n        }\n    });\n};\n_s(useAddCommentMutationWithCacheUpdate, \"bVITQtSRXbfCzXDdfl1Nf98LY34=\", false, function() {\n    return [\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useAddCommentMutation\n    ];\n});\n_s2(useAddCommentMutationWithCacheUpdate, \"bVITQtSRXbfCzXDdfl1Nf98LY34=\", false, function() {\n    return [\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useAddCommentMutation\n    ];\n});\nfunction CommentListContainer(param) {\n    _s1();\n    let { className , variables , id , type , peerId , onVariablesChange , onCommentListQuery , onChallengeQuery , onSettingListQuery  } = param;\n    var _settings_data_settings_find, _settings_data, _settings_data_settings_find1, _settings_data1, _settings_data_settings_find2, _settings_data2, _settings_data_settings_find3, _settings_data3;\n    _s11();\n    const { CommentList  } = (0,_wepublish_website_builder__WEBPACK_IMPORTED_MODULE_2__.useWebsiteBuilder)();\n    const { hasUser  } = (0,_wepublish_authentication_website__WEBPACK_IMPORTED_MODULE_3__.useUser)();\n    const [openWriteComments, dispatch] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useReducer)(_comment_list_state__WEBPACK_IMPORTED_MODULE_4__.commentListReducer, new Map());\n    const { data , loading , error , refetch  } = (0,_wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useCommentListQuery)({\n        variables: {\n            ...variables,\n            itemId: id\n        }\n    });\n    const [addComment, add] = useAddCommentMutationWithCacheUpdate({\n        ...variables,\n        itemId: id\n    }, {\n        update: (cache, param)=>{\n            let { data  } = param;\n            const query = cache.readQuery({\n                query: _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.CommentListDocument,\n                variables: {\n                    ...variables,\n                    itemId: id\n                }\n            });\n            if (!query || !(data === null || data === void 0 ? void 0 : data.addComment)) {\n                return;\n            }\n            const updatedComments = (0,immer__WEBPACK_IMPORTED_MODULE_5__.produce)(query.comments, (comments)=>{\n                const allComments = extractAllComments(comments);\n                const parentComment = allComments.find((comment)=>comment.id === data.addComment.parentID);\n                if (parentComment) {\n                    parentComment.children.unshift(data.addComment);\n                } else {\n                    comments.unshift(data.addComment);\n                }\n            });\n            cache.writeQuery({\n                query: _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.CommentListDocument,\n                data: {\n                    comments: updatedComments\n                },\n                variables: {\n                    ...variables,\n                    itemId: id\n                }\n            });\n        },\n        onCompleted: async (data)=>{\n            dispatch({\n                type: \"add\",\n                action: \"close\",\n                commentId: data.addComment.parentID\n            });\n        }\n    });\n    const [editComment, edit] = (0,_wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useEditCommentMutation)({\n        onCompleted: async (data)=>{\n            await refetch();\n            dispatch({\n                type: \"edit\",\n                action: \"close\",\n                commentId: data.updateComment.id\n            });\n        }\n    });\n    const settings = (0,_wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useSettingListQuery)({});\n    const [fetchChallenge, challenge] = (0,_wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useChallengeLazyQuery)();\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        if (!hasUser) {\n            fetchChallenge();\n        }\n    }, [\n        hasUser,\n        fetchChallenge\n    ]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        onCommentListQuery === null || onCommentListQuery === void 0 ? void 0 : onCommentListQuery({\n            data,\n            loading,\n            error,\n            refetch\n        });\n    }, [\n        data,\n        loading,\n        error,\n        refetch,\n        onCommentListQuery\n    ]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        onChallengeQuery === null || onChallengeQuery === void 0 ? void 0 : onChallengeQuery(challenge);\n    }, [\n        challenge,\n        onChallengeQuery\n    ]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        onSettingListQuery === null || onSettingListQuery === void 0 ? void 0 : onSettingListQuery(settings);\n    }, [\n        settings,\n        onSettingListQuery\n    ]);\n    var _settings_data_settings_find_value;\n    return /*#__PURE__*/ (0,_emotion_react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxDEV)(CommentList, {\n        data: data,\n        loading: loading || settings.loading,\n        error: error !== null && error !== void 0 ? error : settings.error,\n        challenge: challenge,\n        className: className,\n        variables: variables,\n        onVariablesChange: onVariablesChange,\n        openEditorsState: [\n            openWriteComments,\n            dispatch\n        ],\n        add: add,\n        onAddComment: (input)=>{\n            addComment({\n                variables: {\n                    input: {\n                        ...input,\n                        itemID: id,\n                        itemType: type,\n                        peerId\n                    }\n                }\n            });\n        },\n        edit: edit,\n        onEditComment: (input)=>{\n            editComment({\n                variables: {\n                    input\n                }\n            });\n        },\n        maxCommentLength: (_settings_data_settings_find_value = (_settings_data_settings_find = (_settings_data = settings.data) === null || _settings_data === void 0 ? void 0 : _settings_data.settings.find((setting)=>setting.name === _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.SettingName.CommentCharLimit)) === null || _settings_data_settings_find === void 0 ? void 0 : _settings_data_settings_find.value) !== null && _settings_data_settings_find_value !== void 0 ? _settings_data_settings_find_value : 1000,\n        anonymousCanComment: (_settings_data_settings_find1 = (_settings_data1 = settings.data) === null || _settings_data1 === void 0 ? void 0 : _settings_data1.settings.find((setting)=>setting.name === _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.SettingName.AllowGuestCommenting)) === null || _settings_data_settings_find1 === void 0 ? void 0 : _settings_data_settings_find1.value,\n        anonymousCanRate: (_settings_data_settings_find2 = (_settings_data2 = settings.data) === null || _settings_data2 === void 0 ? void 0 : _settings_data2.settings.find((setting)=>setting.name === _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.SettingName.AllowGuestCommentRating)) === null || _settings_data_settings_find2 === void 0 ? void 0 : _settings_data_settings_find2.value,\n        userCanEdit: (_settings_data_settings_find3 = (_settings_data3 = settings.data) === null || _settings_data3 === void 0 ? void 0 : _settings_data3.settings.find((setting)=>setting.name === _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.SettingName.AllowCommentEditing)) === null || _settings_data_settings_find3 === void 0 ? void 0 : _settings_data_settings_find3.value\n    }, void 0, false, {\n        fileName: \"/Users/itrulia/Documents/wepublish/libs/comments/website/src/lib/comment-list/comment-list-container.tsx\",\n        lineNumber: 199,\n        columnNumber: 5\n    }, this);\n}\n_s1(CommentListContainer, \"RTHHj765sSueFT8YWvIv853x9Fg=\", false, function() {\n    return [\n        _wepublish_website_builder__WEBPACK_IMPORTED_MODULE_2__.useWebsiteBuilder,\n        _wepublish_authentication_website__WEBPACK_IMPORTED_MODULE_3__.useUser,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useCommentListQuery,\n        useAddCommentMutationWithCacheUpdate,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useEditCommentMutation,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useSettingListQuery,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useChallengeLazyQuery\n    ];\n});\n_c1 = CommentListContainer;\n_s11(CommentListContainer, \"NJ1EEqzRiiDbH7RlX5XuBaT62pI=\", false, function() {\n    return [\n        _wepublish_website_builder__WEBPACK_IMPORTED_MODULE_2__.useWebsiteBuilder,\n        _wepublish_authentication_website__WEBPACK_IMPORTED_MODULE_3__.useUser,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useCommentListQuery,\n        useAddCommentMutationWithCacheUpdate,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useEditCommentMutation,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useSettingListQuery,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useChallengeLazyQuery\n    ];\n});\n_c = CommentListContainer;\nconst extractAllComments = (comments)=>{\n    const allComments = [];\n    for (const comment of comments){\n        allComments.push(comment);\n        if (comment.children.length) {\n            allComments.push(...extractAllComments(comment.children));\n        }\n    }\n    return allComments;\n};\nvar _c;\n$RefreshReg$(_c, \"CommentListContainer\");\n(function() {\n    var _a, _b;\n    // Legacy CSS implementations will `eval` browser code in a Node.js context\n    // to extract CSS. For backwards compatibility, we need to check we're in a\n    // browser context before continuing.\n    if (typeof self !== \"undefined\" && // AMP / No-JS mode does not inject these helpers:\n    \"$RefreshHelpers$\" in self) {\n        // @ts-ignore __webpack_module__ is global\n        var currentExports = module.exports;\n        // @ts-ignore __webpack_module__ is global\n        var prevExports = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevExports) !== null && _b !== void 0 ? _b : null;\n        // This cannot happen in MainTemplate because the exports mismatch between\n        // templating and execution.\n        self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n        // A module can be accepted automatically based on its exports, e.g. when\n        // it is a Refresh Boundary.\n        if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n            // Save the previous exports on update so we can compare the boundary\n            // signatures.\n            module.hot.dispose(function(data) {\n                data.prevExports = currentExports;\n            });\n            // Unconditionally accept an update to this module, we'll check if it's\n            // still a Refresh Boundary later.\n            // @ts-ignore importMeta is replaced in the loader\n            module.hot.accept();\n            // This field is set when the previous version of this module was a\n            // Refresh Boundary, letting us know we need to check for invalidation or\n            // enqueue an update.\n            if (prevExports !== null) {\n                // A boundary can become ineligible if its exports are incompatible\n                // with the previous exports.\n                //\n                // For example, if you add/remove/change exports, we'll want to\n                // re-execute the importing modules, and force those components to\n                // re-render. Similarly, if you convert a class component to a\n                // function, we want to invalidate the boundary.\n                if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevExports, currentExports)) {\n                    module.hot.invalidate();\n                } else {\n                    self.$RefreshHelpers$.scheduleUpdate();\n                }\n            }\n        } else {\n            // Since we just executed the code for the module, it's possible that the\n            // new exports made it ineligible for being a boundary.\n            // We only care about the case when we were _previously_ a boundary,\n            // because we already accepted this update (accidental side effect).\n            var isNoLongerABoundary = prevExports !== null;\n            if (isNoLongerABoundary) {\n                module.hot.invalidate();\n            }\n        }\n    }\n})();\nvar _c1;\n$RefreshReg$(_c1, \"CommentListContainer\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevExports = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevExports) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports on update so we can compare the boundary\n                // signatures.\n                module.hot.dispose(function (data) {\n                    data.prevExports = currentExports;\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevExports !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevExports, currentExports)) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevExports !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi4vLi4vbGlicy9jb21tZW50cy93ZWJzaXRlL3NyYy9saWIvY29tbWVudC1saXN0L2NvbW1lbnQtbGlzdC1jb250YWluZXIudHN4LmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQWErQjtBQUVZO0FBQ2U7QUFLdkI7QUFDc0I7QUFDRjtBQUMxQjtBQThCN0IsTUFBTWEsdUNBQXVDLFNBQzNDQyxTQUFBQSxFQUdBWjs7cUNBRkdhLFNBQUFBLElBQUFBLE1BQUFBLE9BQUFBLElBQUFBLE9BQUFBLElBQUFBLENBQUFBLEdBQUFBLE9BQUFBLEdBQUFBLE9BQUFBLE1BQUFBLE9BQUFBO1FBQUFBLE1BQUFBLENBQUFBLE9BQUFBLEVBQUFBLEdBQUFBLFNBQUFBLENBQUFBLEtBQUFBOzs7SUFFSGIsT0FBQUEsNkVBQXFCQSxDQUFDO1FBQ3BCYyxRQUFRLENBQUNDLE9BQUFBLFFBQWtCO2dCQUFYLEVBQUNDLEtBQUFBLEVBQUssR0FBQUM7WUFDcEIsTUFBTUMsUUFBUUgsTUFBTUksU0FBUyxDQUFtQjtnQkFDOUNELE9BQU9wQix1RUFBbUJBO2dCQUMxQmM7WUFDRjtZQUVBLElBQUksQ0FBQ00sU0FBUyxDQUFDRixDQUFBQSxTQUFBQSxJQUFBQSxJQUFBQSxTQUFBQSxLQUFBQSxJQUFBQSxLQUFBQSxJQUFBQSxLQUFNSSxVQUFVLEdBQUU7Z0JBQy9CO1lBQ0YsQ0FBQztZQUVELE1BQU1DLGtCQUFrQlgsOENBQU9BLENBQUNRLE1BQU1JLFFBQVEsRUFBRUEsQ0FBQUEsV0FBWTtnQkFDMUQsTUFBTUMsY0FBY0MsbUJBQW1CRjtnQkFFdkMsTUFBTUcsZ0JBQWdCRixZQUFZRyxJQUFJLENBQUNDLENBQUFBLFVBQVdBLFFBQVFDLEVBQUUsS0FBS1osS0FBS0ksVUFBVSxDQUFDUyxRQUFRO2dCQUV6RixJQUFJSixlQUFlO29CQUNqQkEsY0FBY0ssUUFBUSxDQUFDQyxPQUFPLENBQUNmLEtBQUtJLFVBQVU7Z0JBQ2hELE9BQU87b0JBQ0xFLFNBQVNTLE9BQU8sQ0FBQ2Ys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SztRQUVWSyxhQUNFbkMsQ0FBQUEsZ0NBQUFBLENBQUFBLGtCQUFBQSxTQUFTekIsSUFBSSxjQUFieUIsb0JBQUFBLEtBQUFBLElBQUFBLEtBQUFBLElBQUFBLGdCQUFlQSxRQUFBQSxDQUFTZixJQUFJLENBQUMwQyxDQUFBQSxVQUFXQSxRQUFRQyxJQUFJLEtBQUt0RSxtRkFBK0IsQ0FBQyxjQUF6RjBDLGtDQUFBQSxLQUFBQSxJQUFBQSxLQUFBQSxJQUFBQSw4QkFDSThCLEtBQUs7Ozs7OztBQUlqQixDQUFDO0lBNUpldEM7O1FBV1ExQix5RUFBaUJBO1FBQ3JCQyxzRUFBT0E7UUFHZUYsdUVBQW1CQTtRQU9qQ0s7UUFvREVULDBFQUFzQkE7UUFXakNDLHVFQUFtQkE7UUFDQUYseUVBQXFCQTs7O01BdEYzQ2dDO0tBQUFBLHNCQUFBQSxnQ0FBQUEsS0FBQUEsRUFBQUEsV0FBQUE7O1FBV1ExQix5RUFBaUJBO1FBQ3JCQyxzRUFBT0E7UUFHZUYsdUVBQW1CQTtRQU9qQ0s7UUFvREVULDBFQUFzQkE7UUFXakNDLHVFQUFtQkE7UUFDQUYseUVBQXFCQTs7O0tBdEYzQ2dDO0FBOEpoQixNQUFNVCxxQkFBcUIsQ0FBQ0YsV0FBbUM7SUFDN0QsTUFBTUMsY0FBYyxFQUFFO0lBRXRCLEtBQUssTUFBTUksV0FBV0wsU0FBVTtRQUM5QkMsWUFBWXVELElBQUksQ0FBQ25EO1FBRWpCLElBQUlBLFFBQVFHLFFBQVEsQ0FBQ2lELE1BQU0sRUFBRTtZQUMzQnhELFlBQVl1RCxJQUFJLElBQUl0RCxtQkFBbUJHLFFBQVFHLFFBQVE7UUFDekQsQ0FBQztJQUNIO0lBRUEsT0FBT1A7QUFDVCIsInNvdXJjZXMiOlsid2VicGFjazovL19OX0UvLi4vLi4vbGlicy9jb21tZW50cy93ZWJzaXRlL3NyYy9saWIvY29tbWVudC1saXN0L2NvbW1lbnQtbGlzdC1jb250YWluZXIudHN4PzJiNjgiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ2hhbGxlbmdlUXVlcnksXG4gIENvbW1lbnQsXG4gIENvbW1lbnRJdGVtVHlwZSxcbiAgQ29tbWVudExpc3REb2N1bWVudCxcbiAgQ29tbWVudExpc3RRdWVyeSxcbiAgQ29tbWVudExpc3RRdWVyeVZhcmlhYmxlcyxcbiAgU2V0dGluZ0xpc3RRdWVyeSxcbiAgU2V0dGluZ05hbWUsXG4gIHVzZUFkZENvbW1lbnRNdXRhdGlvbixcbiAgdXNlQ2hhbGxlbmdlTGF6eVF1ZXJ5LFxuICB1c2VFZGl0Q29tbWVudE11dGF0aW9uLFxuICB1c2VTZXR0aW5nTGlzdFF1ZXJ5XG59IGZyb20gJ0B3ZXB1Ymxpc2gvd2Vic2l0ZS9hcGknXG5pbXBvcnQge1F1ZXJ5UmVzdWx0fSBmcm9tICdAYXBvbGxvL2NsaWVudCdcbmltcG9ydCB7dXNlRWZmZWN0LCB1c2VSZWR1Y2VyfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7dXNlQ29tbWVudExpc3RRdWVyeX0gZnJvbSAnQHdlcHVibGlzaC93ZWJzaXRlL2FwaSdcbmltcG9ydCB7XG4gIEJ1aWxkZXJDb250YWluZXJQcm9wcyxcbiAgdXNlV2Vic2l0ZUJ1aWxkZXIsXG4gIEJ1aWxkZXJDb21tZW50TGlzdFByb3BzXG59IGZyb20gJ0B3ZXB1Ymxpc2gvd2Vic2l0ZS9idWlsZGVyJ1xuaW1wb3J0IHt1c2VVc2VyfSBmcm9tICdAd2VwdWJsaXNoL2F1dGhlbnRpY2F0aW9uL3dlYnNpdGUnXG5pbXBvcnQge2NvbW1lbnRMaXN0UmVkdWNlcn0gZnJvbSAnLi9jb21tZW50LWxpc3Quc3RhdGUnXG5pbXBvcnQge3Byb2R1Y2V9IGZyb20gJ2ltbWVyJ1xuXG50eXBlIFBlZXJBcnRpY2xlQ29tbWVudHMgPSB7XG4gIHR5cGU6IENvbW1lbnRJdGVtVHlwZS5QZWVyQXJ0aWNsZVxuICBwZWVySWQ6IHN0cmluZ1xufVxuXG50eXBlIEFydGljbGVPclBhZ2VDb21tZW50cyA9IHtcbiAgdHlwZTogQ29tbWVudEl0ZW1UeXBlXG4gIHBlZXJJZD86IG5ldmVyXG59XG5cbmV4cG9ydCB0eXBlIENvbW1lbnRMaXN0Q29udGFpbmVyUHJvcHMgPSB7XG4gIGlkOiBzdHJpbmdcblxuICBvbkNoYWxsZW5nZVF1ZXJ5PzogKFxuICAgIHF1ZXJ5UmVzdWx0OiBQaWNrPFF1ZXJ5UmVzdWx0PENoYWxsZW5nZVF1ZXJ5PiwgJ2RhdGEnIHwgJ2xvYWRpbmcnIHwgJ2Vycm9yJyB8ICdyZWZldGNoJz5cbiAgKSA9PiB2b2lkXG5cbiAgb25TZXR0aW5nTGlzdFF1ZXJ5PzogKFxuICAgIHF1ZXJ5UmVzdWx0OiBQaWNrPFF1ZXJ5UmVzdWx0PFNldHRpbmdMaXN0UXVlcnk+LCAnZGF0YScgfCAnbG9hZGluZycgfCAnZXJyb3InIHwgJ3JlZmV0Y2gnPlxuICApID0+IHZvaWRcblxuICBvbkNvbW1lbnRMaXN0UXVlcnk/OiAoXG4gICAgcXVlcnlSZXN1bHQ6IFBpY2s8UXVlcnlSZXN1bHQ8Q29tbWVudExpc3RRdWVyeT4sICdkYXRhJyB8ICdsb2FkaW5nJyB8ICdlcnJvcicgfCAncmVmZXRjaCc+XG4gICkgPT4gdm9pZFxufSAmIEJ1aWxkZXJDb250YWluZXJQcm9wcyAmXG4gIFBpY2s8QnVpbGRlckNvbW1lbnRMaXN0UHJvcHMsICd2YXJpYWJsZXMnIHwgJ29uVmFyaWFibGVzQ2hhbmdlJz4gJlxuICAoUGVlckFydGljbGVDb21tZW50cyB8IEFydGljbGVPclBhZ2VDb21tZW50cylcblxuY29uc3QgdXNlQWRkQ29tbWVudE11dGF0aW9uV2l0aENhY2hlVXBkYXRlID0gKFxuICB2YXJpYWJsZXM6IENvbW1lbnRMaXN0UXVlcnlWYXJpYWJsZXMsXG4gIC4uLnBhcmFtczogUGFyYW1ldGVyczx0eXBlb2YgdXNlQWRkQ29tbWVudE11dGF0aW9uPlxuKSA9PlxuICB1c2VBZGRDb21tZW50TXV0YXRpb24oe1xuICAgIHVwZGF0ZTogKGNhY2hlLCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gY2FjaGUucmVhZFF1ZXJ5PENvbW1lbnRMaXN0UXVlcnk+KHtcbiAgICAgICAgcXVlcnk6IENvbW1lbnRMaXN0RG9jdW1lbnQsXG4gICAgICAgIHZhcmlhYmxlc1xuICAgICAgfSlcblxuICAgICAgaWYgKCFxdWVyeSB8fCAhZGF0YT8uYWRkQ29tbWVudCkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29uc3QgdXBkYXRlZENvbW1lbnRzID0gcHJvZHVjZShxdWVyeS5jb21tZW50cywgY29tbWVudHMgPT4ge1xuICAgICAgICBjb25zdCBhbGxDb21tZW50cyA9IGV4dHJhY3RBbGxDb21tZW50cyhjb21tZW50cylcblxuICAgICAgICBjb25zdCBwYXJlbnRDb21tZW50ID0gYWxsQ29tbWVudHMuZmluZChjb21tZW50ID0+IGNvbW1lbnQuaWQgPT09IGRhdGEuYWRkQ29tbWVudC5wYXJlbnRJRClcblxuICAgICAgICBpZiAocGFyZW50Q29tbWVudCkge1xuICAgICAgICAgIHBhcmVudENvbW1lbnQuY2hpbGRyZW4udW5zaGlmdChkYXRhLmFkZENvbW1lbnQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29tbWVudHMudW5zaGlmdChkYXRhLmFkZENvbW1lbnQpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGNhY2hlLndyaXRlUXVlcnk8Q29tbWVudExpc3RRdWVyeT4oe1xuICAgICAgICBxdWVyeTogQ29tbWVudExpc3REb2N1bWVudCxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGNvbW1lbnRzOiB1cGRhdGVkQ29tbWVudHNcbiAgICAgICAgfSxcbiAgICAgICAgdmFyaWFibGVzXG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuZXhwb3J0IGZ1bmN0aW9uIENvbW1lbnRMaXN0Q29udGFpbmVyKHtcbiAgY2xhc3NOYW1lLFxuICB2YXJpYWJsZXMsXG4gIGlkLFxuICB0eXBlLFxuICBwZWVySWQsXG4gIG9uVmFyaWFibGVzQ2hhbmdlLFxuICBvbkNvbW1lbnRMaXN0UXVlcnksXG4gIG9uQ2hhbGxlbmdlUXVlcnksXG4gIG9uU2V0dGluZ0xpc3RRdWVyeVxufTogQ29tbWVudExpc3RDb250YWluZXJQcm9wcykge1xuICBjb25zdCB7Q29tbWVudExpc3R9ID0gdXNlV2Vic2l0ZUJ1aWxkZXIoKVxuICBjb25zdCB7aGFzVXNlcn0gPSB1c2VVc2VyKClcbiAgY29uc3QgW29wZW5Xcml0ZUNvbW1lbnRzLCBkaXNwYXRjaF0gPSB1c2VSZWR1Y2VyKGNvbW1lbnRMaXN0UmVkdWNlciwgbmV3IE1hcCgpKVxuXG4gIGNvbnN0IHtkYXRhLCBsb2FkaW5nLCBlcnJvciwgcmVmZXRjaH0gPSB1c2VDb21tZW50TGlzdFF1ZXJ5KHtcbiAgICB2YXJpYWJsZXM6IHtcbiAgICAgIC4uLnZhcmlhYmxlcyxcbiAgICAgIGl0ZW1JZDogaWRcbiAgICB9XG4gIH0pXG5cbiAgY29uc3QgW2FkZENvbW1lbnQsIGFkZF0gPSB1c2VBZGRDb21tZW50TXV0YXRpb25XaXRoQ2FjaGVVcGRhdGUoXG4gICAge1xuICAgICAgLi4udmFyaWFibGVzLFxuICAgICAgaXRlbUlkOiBpZFxuICAgIH0sXG4gICAge1xuICAgICAgdXBkYXRlOiAoY2FjaGUsIHtkYXRhfSkgPT4ge1xuICAgICAgICBjb25zdCBxdWVyeSA9IGNhY2hlLnJlYWRRdWVyeTxDb21tZW50TGlzdFF1ZXJ5Pih7XG4gICAgICAgICAgcXVlcnk6IENvbW1lbnRMaXN0RG9jdW1lbnQsXG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAuLi52YXJpYWJsZXMsXG4gICAgICAgICAgICBpdGVtSWQ6IGlkXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGlmICghcXVlcnkgfHwgIWRhdGE/LmFkZENvbW1lbnQpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVwZGF0ZWRDb21tZW50cyA9IHByb2R1Y2UocXVlcnkuY29tbWVudHMsIGNvbW1lbnRzID0+IHtcbiAgICAgICAgICBjb25zdCBhbGxDb21tZW50cyA9IGV4dHJhY3RBbGxDb21tZW50cyhjb21tZW50cylcblxuICAgICAgICAgIGNvbnN0IHBhcmVudENvbW1lbnQgPSBhbGxDb21tZW50cy5maW5kKGNvbW1lbnQgPT4gY29tbWVudC5pZCA9PT0gZGF0YS5hZGRDb21tZW50LnBhcmVudElEKVxuXG4gICAgICAgICAgaWYgKHBhcmVudENvbW1lbnQpIHtcbiAgICAgICAgICAgIHBhcmVudENvbW1lbnQuY2hpbGRyZW4udW5zaGlmdChkYXRhLmFkZENvbW1lbnQpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbW1lbnRzLnVuc2hpZnQoZGF0YS5hZGRDb21tZW50KVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICBjYWNoZS53cml0ZVF1ZXJ5PENvbW1lbnRMaXN0UXVlcnk+KHtcbiAgICAgICAgICBxdWVyeTogQ29tbWVudExpc3REb2N1bWVudCxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjb21tZW50czogdXBkYXRlZENvbW1lbnRzXG4gICAgICAgICAgfSxcbiAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgIC4uLnZhcmlhYmxlcyxcbiAgICAgICAgICAgIGl0ZW1JZDogaWRcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9LFxuICAgICAgb25Db21wbGV0ZWQ6IGFzeW5jIGRhdGEgPT4ge1xuICAgICAgICBkaXNwYXRjaCh7XG4gICAgICAgICAgdHlwZTogJ2FkZCcsXG4gICAgICAgICAgYWN0aW9uOiAnY2xvc2UnLFxuICAgICAgICAgIGNvbW1lbnRJZDogZGF0YS5hZGRDb21tZW50LnBhcmVudElEXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICApXG5cbiAgY29uc3QgW2VkaXRDb21tZW50LCBlZGl0XSA9IHVzZUVkaXRDb21tZW50TXV0YXRpb24oe1xuICAgIG9uQ29tcGxldGVkOiBhc3luYyBkYXRhID0+IHtcbiAgICAgIGF3YWl0IHJlZmV0Y2goKVxuICAgICAgZGlzcGF0Y2goe1xuICAgICAgICB0eXBlOiAnZWRpdCcsXG4gICAgICAgIGFjdGlvbjogJ2Nsb3NlJyxcbiAgICAgICAgY29tbWVudElkOiBkYXRhLnVwZGF0ZUNvbW1lbnQuaWRcbiAgICAgIH0pXG4gICAgfVxuICB9KVxuXG4gIGNvbnN0IHNldHRpbmdzID0gdXNlU2V0dGluZ0xpc3RRdWVyeSh7fSlcbiAgY29uc3QgW2ZldGNoQ2hhbGxlbmdlLCBjaGFsbGVuZ2VdID0gdXNlQ2hhbGxlbmdlTGF6eVF1ZXJ5KClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghaGFzVXNlcikge1xuICAgICAgZmV0Y2hDaGFsbGVuZ2UoKVxuICAgIH1cbiAgfSwgW2hhc1VzZXIsIGZldGNoQ2hhbGxlbmdlXSlcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIG9uQ29tbWVudExpc3RRdWVyeT8uKHtkYXRhLCBsb2FkaW5nLCBlcnJvciwgcmVmZXRjaH0pXG4gIH0sIFtkYXRhLCBsb2FkaW5nLCBlcnJvciwgcmVmZXRjaCwgb25Db21tZW50TGlzdFF1ZXJ5XSlcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIG9uQ2hhbGxlbmdlUXVlcnk/LihjaGFsbGVuZ2UpXG4gIH0sIFtjaGFsbGVuZ2UsIG9uQ2hhbGxlbmdlUXVlcnldKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgb25TZXR0aW5nTGlzdFF1ZXJ5Py4oc2V0dGluZ3MpXG4gIH0sIFtzZXR0aW5ncywgb25TZXR0aW5nTGlzdFF1ZXJ5XSlcblxuICByZXR1cm4gKFxuICAgIDxDb21tZW50TGlzdFxuICAgICAgZGF0YT17ZGF0YX1cbiAgICAgIGxvYWRpbmc9e2xvYWRpbmcgfHwgc2V0dGluZ3MubG9hZGluZ31cbiAgICAgIGVycm9yPXtlcnJvciA/PyBzZXR0aW5ncy5lcnJvcn1cbiAgICAgIGNoYWxsZW5nZT17Y2hhbGxlbmdlfVxuICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWV9XG4gICAgICB2YXJpYWJsZXM9e3ZhcmlhYmxlc31cbiAgICAgIG9uVmFyaWFibGVzQ2hhbmdlPXtvblZhcmlhYmxlc0NoYW5nZX1cbiAgICAgIG9wZW5FZGl0b3JzU3RhdGU9e1tvcGVuV3JpdGVDb21tZW50cywgZGlzcGF0Y2hdfVxuICAgICAgYWRkPXthZGR9XG4gICAgICBvbkFkZENvbW1lbnQ9e2lucHV0ID0+IHtcbiAgICAgICAgYWRkQ29tbWVudCh7XG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBpbnB1dDoge1xuICAgICAgICAgICAgICAuLi5pbnB1dCxcbiAgICAgICAgICAgICAgaXRlbUlEOiBpZCxcbiAgICAgICAgICAgICAgaXRlbVR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgIHBlZXJJZFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH19XG4gICAgICBlZGl0PXtlZGl0fVxuICAgICAgb25FZGl0Q29tbWVudD17aW5wdXQgPT4ge1xuICAgICAgICBlZGl0Q29tbWVudCh7XG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBpbnB1dFxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH19XG4gICAgICBtYXhDb21tZW50TGVuZ3RoPXtcbiAgICAgICAgc2V0dGluZ3MuZGF0YT8uc2V0dGluZ3MuZmluZChzZXR0aW5nID0+IHNldHRpbmcubmFtZSA9PT0gU2V0dGluZ05hbWUuQ29tbWVudENoYXJMaW1pdClcbiAgICAgICAgICA/LnZhbHVlID8/IDEwMDBcbiAgICAgIH1cbiAgICAgIGFub255bW91c0NhbkNvbW1lbnQ9e1xuICAgICAgICBzZXR0aW5ncy5kYXRhPy5zZXR0aW5ncy5maW5kKHNldHRpbmcgPT4gc2V0dGluZy5uYW1lID09PSBTZXR0aW5nTmFtZS5BbGxvd0d1ZXN0Q29tbWVudGluZylcbiAgICAgICAgICA/LnZhbHVlXG4gICAgICB9XG4gICAgICBhbm9ueW1vdXNDYW5SYXRlPXtcbiAgICAgICAgc2V0dGluZ3MuZGF0YT8uc2V0dGluZ3MuZmluZChcbiAgICAgICAgICBzZXR0aW5nID0+IHNldHRpbmcubmFtZSA9PT0gU2V0dGluZ05hbWUuQWxsb3dHdWVzdENvbW1lbnRSYXRpbmdcbiAgICAgICAgKT8udmFsdWVcbiAgICAgIH1cbiAgICAgIHVzZXJDYW5FZGl0PXtcbiAgICAgICAgc2V0dGluZ3MuZGF0YT8uc2V0dGluZ3MuZmluZChzZXR0aW5nID0+IHNldHRpbmcubmFtZSA9PT0gU2V0dGluZ05hbWUuQWxsb3dDb21tZW50RWRpdGluZylcbiAgICAgICAgICA/LnZhbHVlXG4gICAgICB9XG4gICAgLz5cbiAgKVxufVxuXG5jb25zdCBleHRyYWN0QWxsQ29tbWVudHMgPSAoY29tbWVudHM6IENvbW1lbnRbXSk6IENvbW1lbnRbXSA9PiB7XG4gIGNvbnN0IGFsbENvbW1lbnRzID0gW10gYXMgQ29tbWVudFtdXG5cbiAgZm9yIChjb25zdCBjb21tZW50IG9mIGNvbW1lbnRzKSB7XG4gICAgYWxsQ29tbWVudHMucHVzaChjb21tZW50KVxuXG4gICAgaWYgKGNvbW1lbnQuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICBhbGxDb21tZW50cy5wdXNoKC4uLmV4dHJhY3RBbGxDb21tZW50cyhjb21tZW50LmNoaWxkcmVuKSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYWxsQ29tbWVudHNcbn1cbiJdLCJuYW1lcyI6WyJDb21tZW50TGlzdERvY3VtZW50IiwiU2V0dGluZ05hbWUiLCJ1c2VBZGRDb21tZW50TXV0YXRpb24iLCJ1c2VDaGFsbGVuZ2VMYXp5UXVlcnkiLCJ1c2VFZGl0Q29tbWVudE11dGF0aW9uIiwidXNlU2V0dGluZ0xpc3RRdWVyeSIsInVzZUVmZmVjdCIsInVzZVJlZHVjZXIiLCJ1c2VDb21tZW50TGlzdFF1ZXJ5IiwidXNlV2Vic2l0ZUJ1aWxkZXIiLCJ1c2VVc2VyIiwiY29tbWVudExpc3RSZWR1Y2VyIiwicHJvZHVjZSIsInVzZUFkZENvbW1lbnRNdXRhdGlvbldpdGhDYWNoZVVwZGF0ZSIsInZhcmlhYmxlcyIsInBhcmFtcyIsInVwZGF0ZSIsImNhY2hlIiwiZGF0YSIsInBhcmFtIiwicXVlcnkiLCJyZWFkUXVlcnkiLCJhZGRDb21tZW50IiwidXBkYXRlZENvbW1lbnRzIiwiY29tbWVudHMiLCJhbGxDb21tZW50cyIsImV4dHJhY3RBbGxDb21tZW50cyIsInBhcmVudENvbW1lbnQiLCJmaW5kIiwiY29tbWVudCIsImlkIiwicGFyZW50SUQiLCJjaGlsZHJlbiIsInVuc2hpZnQiLCJ3cml0ZVF1ZXJ5IiwiQ29tbWVudExpc3RDb250YWluZXIiLCJjbGFzc05hbWUiLCJ0eXBlIiwicGVlcklkIiwib25WYXJpYWJsZXNDaGFuZ2UiLCJvbkNvbW1lbnRMaXN0UXVlcnkiLCJvbkNoYWxsZW5nZVF1ZXJ5Iiwib25TZXR0aW5nTGlzdFF1ZXJ5Iiwic2V0dGluZ3MiLCJDb21tZW50TGlzdCIsImhhc1VzZXIiLCJvcGVuV3JpdGVDb21tZW50cyIsImRpc3BhdGNoIiwiTWFwIiwibG9hZGluZyIsImVycm9yIiwicmVmZXRjaCIsIml0ZW1JZCIsImFkZCIsIm9uQ29tcGxldGVkIiwiYWN0aW9uIiwiY29tbWVudElkIiwiZWRpdENvbW1lbnQiLCJlZGl0IiwidXBkYXRlQ29tbWVudCIsImZldGNoQ2hhbGxlbmdlIiwiY2hhbGxlbmdlIiwiX2pzeERFViIsIm9wZW5FZGl0b3JzU3RhdGUiLCJvbkFkZENvbW1lbnQiLCJpbnB1dCIsIml0ZW1JRCIsIml0ZW1UeXBlIiwib25FZGl0Q29tbWVudCIsIm1heENvbW1lbnRMZW5ndGgiLCJzZXR0aW5nIiwibmFtZSIsIkNvbW1lbnRDaGFyTGltaXQiLCJ2YWx1ZSIsImFub255bW91c0NhbkNvbW1lbnQiLCJBbGxvd0d1ZXN0Q29tbWVudGluZyIsImFub255bW91c0NhblJhdGUiLCJBbGxvd0d1ZXN0Q29tbWVudFJhdGluZyIsInVzZXJDYW5FZGl0IiwiQWxsb3dDb21tZW50RWRpdGluZyIsInB1c2giLCJsZW5ndGgiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///../../libs/comments/website/src/lib/comment-list/comment-list-container.tsx\n"));

/***/ })

});