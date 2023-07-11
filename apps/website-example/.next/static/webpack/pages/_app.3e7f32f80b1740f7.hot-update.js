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

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"CommentListContainer\": function() { return /* binding */ CommentListContainer; }\n/* harmony export */ });\n/* harmony import */ var _emotion_react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @emotion/react/jsx-dev-runtime */ \"../../node_modules/@emotion/react/jsx-dev-runtime/dist/emotion-react-jsx-dev-runtime.browser.esm.js\");\n/* harmony import */ var _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wepublish/website/api */ \"../../libs/website/api/src/index.ts\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"../../node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _wepublish_website_builder__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wepublish/website/builder */ \"../../libs/website/builder/src/index.ts\");\n/* harmony import */ var _wepublish_authentication_website__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wepublish/authentication/website */ \"../../libs/authentication/website/src/index.ts\");\n/* harmony import */ var _comment_list_state__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./comment-list.state */ \"../../libs/comments/website/src/lib/comment-list/comment-list.state.tsx\");\n/* harmony import */ var immer__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! immer */ \"../../node_modules/immer/dist/immer.mjs\");\nvar _s = $RefreshSig$(), _s1 = $RefreshSig$(), _s2 = $RefreshSig$();\n\nvar _s3 = $RefreshSig$(), _s11 = $RefreshSig$(), _s21 = $RefreshSig$();\n\n\n\n\n\n\n\nfunction CommentListContainer(param) {\n    _s();\n    let { className , variables , id , type , peerId , onVariablesChange , onCommentListQuery , onChallengeQuery , onSettingListQuery  } = param;\n    var _settings_data_settings_find, _settings_data, _settings_data_settings_find1, _settings_data1, _settings_data_settings_find2, _settings_data2, _settings_data_settings_find3, _settings_data3;\n    _s3();\n    const { CommentList  } = (0,_wepublish_website_builder__WEBPACK_IMPORTED_MODULE_2__.useWebsiteBuilder)();\n    const { hasUser  } = (0,_wepublish_authentication_website__WEBPACK_IMPORTED_MODULE_3__.useUser)();\n    const [openWriteComments, dispatch] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useReducer)(_comment_list_state__WEBPACK_IMPORTED_MODULE_4__.commentListReducer, new Map());\n    const { data , loading , error , refetch  } = (0,_wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useCommentListQuery)({\n        variables: {\n            ...variables,\n            itemId: id\n        }\n    });\n    const [addComment, add] = useAddCommentMutationWithCacheUpdate({\n        ...variables,\n        itemId: id\n    }, {\n        onCompleted: async (data)=>{\n            dispatch({\n                type: \"add\",\n                action: \"close\",\n                commentId: data.addComment.parentID\n            });\n        }\n    });\n    const [editComment, edit] = (0,_wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useEditCommentMutation)({\n        onCompleted: async (data)=>{\n            await refetch();\n            dispatch({\n                type: \"edit\",\n                action: \"close\",\n                commentId: data.updateComment.id\n            });\n        }\n    });\n    const settings = (0,_wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useSettingListQuery)({});\n    const [fetchChallenge, challenge] = (0,_wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useChallengeLazyQuery)();\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        if (!hasUser) {\n            fetchChallenge();\n        }\n    }, [\n        hasUser,\n        fetchChallenge\n    ]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        onCommentListQuery === null || onCommentListQuery === void 0 ? void 0 : onCommentListQuery({\n            data,\n            loading,\n            error,\n            refetch\n        });\n    }, [\n        data,\n        loading,\n        error,\n        refetch,\n        onCommentListQuery\n    ]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        onChallengeQuery === null || onChallengeQuery === void 0 ? void 0 : onChallengeQuery(challenge);\n    }, [\n        challenge,\n        onChallengeQuery\n    ]);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        onSettingListQuery === null || onSettingListQuery === void 0 ? void 0 : onSettingListQuery(settings);\n    }, [\n        settings,\n        onSettingListQuery\n    ]);\n    var _settings_data_settings_find_value;\n    return /*#__PURE__*/ (0,_emotion_react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxDEV)(CommentList, {\n        data: data,\n        loading: loading || settings.loading,\n        error: error !== null && error !== void 0 ? error : settings.error,\n        challenge: challenge,\n        className: className,\n        variables: variables,\n        onVariablesChange: onVariablesChange,\n        openEditorsState: [\n            openWriteComments,\n            dispatch\n        ],\n        add: add,\n        onAddComment: (input)=>{\n            addComment({\n                variables: {\n                    input: {\n                        ...input,\n                        itemID: id,\n                        itemType: type,\n                        peerId\n                    }\n                }\n            });\n        },\n        edit: edit,\n        onEditComment: (input)=>{\n            editComment({\n                variables: {\n                    input\n                }\n            });\n        },\n        maxCommentLength: (_settings_data_settings_find_value = (_settings_data_settings_find = (_settings_data = settings.data) === null || _settings_data === void 0 ? void 0 : _settings_data.settings.find((setting)=>setting.name === _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.SettingName.CommentCharLimit)) === null || _settings_data_settings_find === void 0 ? void 0 : _settings_data_settings_find.value) !== null && _settings_data_settings_find_value !== void 0 ? _settings_data_settings_find_value : 1000,\n        anonymousCanComment: (_settings_data_settings_find1 = (_settings_data1 = settings.data) === null || _settings_data1 === void 0 ? void 0 : _settings_data1.settings.find((setting)=>setting.name === _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.SettingName.AllowGuestCommenting)) === null || _settings_data_settings_find1 === void 0 ? void 0 : _settings_data_settings_find1.value,\n        anonymousCanRate: (_settings_data_settings_find2 = (_settings_data2 = settings.data) === null || _settings_data2 === void 0 ? void 0 : _settings_data2.settings.find((setting)=>setting.name === _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.SettingName.AllowGuestCommentRating)) === null || _settings_data_settings_find2 === void 0 ? void 0 : _settings_data_settings_find2.value,\n        userCanEdit: (_settings_data_settings_find3 = (_settings_data3 = settings.data) === null || _settings_data3 === void 0 ? void 0 : _settings_data3.settings.find((setting)=>setting.name === _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.SettingName.AllowCommentEditing)) === null || _settings_data_settings_find3 === void 0 ? void 0 : _settings_data_settings_find3.value\n    }, void 0, false, {\n        fileName: \"/Users/itrulia/Documents/wepublish/libs/comments/website/src/lib/comment-list/comment-list-container.tsx\",\n        lineNumber: 126,\n        columnNumber: 5\n    }, this);\n}\n_s(CommentListContainer, \"RTHHj765sSueFT8YWvIv853x9Fg=\", false, function() {\n    return [\n        _wepublish_website_builder__WEBPACK_IMPORTED_MODULE_2__.useWebsiteBuilder,\n        _wepublish_authentication_website__WEBPACK_IMPORTED_MODULE_3__.useUser,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useCommentListQuery,\n        useAddCommentMutationWithCacheUpdate,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useEditCommentMutation,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useSettingListQuery,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useChallengeLazyQuery\n    ];\n});\n_c1 = CommentListContainer;\n_s3(CommentListContainer, \"NJ1EEqzRiiDbH7RlX5XuBaT62pI=\", false, function() {\n    return [\n        _wepublish_website_builder__WEBPACK_IMPORTED_MODULE_2__.useWebsiteBuilder,\n        _wepublish_authentication_website__WEBPACK_IMPORTED_MODULE_3__.useUser,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useCommentListQuery,\n        useAddCommentMutationWithCacheUpdate,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useEditCommentMutation,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useSettingListQuery,\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useChallengeLazyQuery\n    ];\n});\n_c = CommentListContainer;\nconst extractAllComments = (comments)=>{\n    const allComments = [];\n    for (const comment of comments){\n        allComments.push(comment);\n        if (comment.children.length) {\n            allComments.push(...extractAllComments(comment.children));\n        }\n    }\n    return allComments;\n};\nconst useAddCommentMutationWithCacheUpdate = function(variables) {\n    _s1();\n    for(var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){\n        params[_key - 1] = arguments[_key];\n    }\n    _s11();\n    return (0,_wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useAddCommentMutation)({\n        ...params[0],\n        update: (cache, param)=>{\n            let { data  } = param;\n            const query = cache.readQuery({\n                query: _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.CommentListDocument,\n                variables\n            });\n            if (!query || !(data === null || data === void 0 ? void 0 : data.addComment)) {\n                return;\n            }\n            const updatedComments = (0,immer__WEBPACK_IMPORTED_MODULE_6__.produce)(query.comments, (comments)=>{\n                const allComments = extractAllComments(comments);\n                const parentComment = allComments.find((comment)=>comment.id === data.addComment.parentID);\n                if (parentComment) {\n                    parentComment.children.unshift(data.addComment);\n                } else {\n                    comments.unshift(data.addComment);\n                }\n            });\n            cache.writeQuery({\n                query: _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.CommentListDocument,\n                data: {\n                    comments: updatedComments\n                },\n                variables\n            });\n        }\n    });\n};\n_s1(useAddCommentMutationWithCacheUpdate, \"bVITQtSRXbfCzXDdfl1Nf98LY34=\", false, function() {\n    return [\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useAddCommentMutation\n    ];\n});\n_s11(useAddCommentMutationWithCacheUpdate, \"bVITQtSRXbfCzXDdfl1Nf98LY34=\", false, function() {\n    return [\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useAddCommentMutation\n    ];\n});\nconst useEditCommentMutationWithCacheUpdate = function(variables) {\n    _s2();\n    for(var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){\n        params[_key - 1] = arguments[_key];\n    }\n    _s21();\n    return (0,_wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useEditCommentMutation)({\n        ...params[0],\n        update: (cache, param)=>{\n            let { data  } = param;\n            const query = cache.readQuery({\n                query: _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.CommentListDocument,\n                variables\n            });\n            if (!query || !(data === null || data === void 0 ? void 0 : data.updateComment)) {\n                return;\n            }\n            const updatedComments = (0,immer__WEBPACK_IMPORTED_MODULE_6__.produce)(query.comments, (comments)=>{\n                const allComments = extractAllComments(comments);\n                const oldComment = allComments.find((comment)=>comment.id === data.updateComment.id);\n                if (oldComment) {\n                    oldComment.title = data.updateComment.title;\n                    oldComment.lead = data.updateComment.lead;\n                    oldComment.text = data.updateComment.text;\n                }\n            });\n            cache.writeQuery({\n                query: _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.CommentListDocument,\n                data: {\n                    comments: updatedComments\n                },\n                variables\n            });\n        }\n    });\n};\n_s2(useEditCommentMutationWithCacheUpdate, \"WaW1cJ85LtDqlPLQGj8okHSNdEA=\", false, function() {\n    return [\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useEditCommentMutation\n    ];\n});\n_s21(useEditCommentMutationWithCacheUpdate, \"WaW1cJ85LtDqlPLQGj8okHSNdEA=\", false, function() {\n    return [\n        _wepublish_website_api__WEBPACK_IMPORTED_MODULE_0__.useEditCommentMutation\n    ];\n});\nvar _c;\n$RefreshReg$(_c, \"CommentListContainer\");\n(function() {\n    var _a, _b;\n    // Legacy CSS implementations will `eval` browser code in a Node.js context\n    // to extract CSS. For backwards compatibility, we need to check we're in a\n    // browser context before continuing.\n    if (typeof self !== \"undefined\" && // AMP / No-JS mode does not inject these helpers:\n    \"$RefreshHelpers$\" in self) {\n        // @ts-ignore __webpack_module__ is global\n        var currentExports = module.exports;\n        // @ts-ignore __webpack_module__ is global\n        var prevExports = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevExports) !== null && _b !== void 0 ? _b : null;\n        // This cannot happen in MainTemplate because the exports mismatch between\n        // templating and execution.\n        self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n        // A module can be accepted automatically based on its exports, e.g. when\n        // it is a Refresh Boundary.\n        if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n            // Save the previous exports on update so we can compare the boundary\n            // signatures.\n            module.hot.dispose(function(data) {\n                data.prevExports = currentExports;\n            });\n            // Unconditionally accept an update to this module, we'll check if it's\n            // still a Refresh Boundary later.\n            // @ts-ignore importMeta is replaced in the loader\n            module.hot.accept();\n            // This field is set when the previous version of this module was a\n            // Refresh Boundary, letting us know we need to check for invalidation or\n            // enqueue an update.\n            if (prevExports !== null) {\n                // A boundary can become ineligible if its exports are incompatible\n                // with the previous exports.\n                //\n                // For example, if you add/remove/change exports, we'll want to\n                // re-execute the importing modules, and force those components to\n                // re-render. Similarly, if you convert a class component to a\n                // function, we want to invalidate the boundary.\n                if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevExports, currentExports)) {\n                    module.hot.invalidate();\n                } else {\n                    self.$RefreshHelpers$.scheduleUpdate();\n                }\n            }\n        } else {\n            // Since we just executed the code for the module, it's possible that the\n            // new exports made it ineligible for being a boundary.\n            // We only care about the case when we were _previously_ a boundary,\n            // because we already accepted this update (accidental side effect).\n            var isNoLongerABoundary = prevExports !== null;\n            if (isNoLongerABoundary) {\n                module.hot.invalidate();\n            }\n        }\n    }\n})();\nvar _c1;\n$RefreshReg$(_c1, \"CommentListContainer\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevExports = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevExports) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports on update so we can compare the boundary\n                // signatures.\n                module.hot.dispose(function (data) {\n                    data.prevExports = currentExports;\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevExports !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevExports, currentExports)) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevExports !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi4vLi4vbGlicy9jb21tZW50cy93ZWJzaXRlL3NyYy9saWIvY29tbWVudC1saXN0L2NvbW1lbnQtbGlzdC1jb250YWluZXIudHN4LmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQWErQjtBQUVZO0FBQ2U7QUFLdkI7QUFDc0I7QUFDRjtBQUMxQjtBQThCdEIsU0FBU2EscUJBQXFCQyxLQVVULEVBQUU7O1FBVk8sRUFDbkNDLFVBQUFBLEVBQ0FDLFVBQUFBLEVBQ0FDLEdBQUFBLEVBQ0FDLEtBQUFBLEVBQ0FDLE9BQUFBLEVBQ0FDLGtCQUFBQSxFQUNBQyxtQkFBQUEsRUFDQUMsaUJBQUFBLEVBQ0FDLG1CQUFBQSxFQUMwQixHQVZTVDtRQXNHN0JVLDhCQUFBQSxnQkFJQUEsK0JBQUFBLGlCQUlBQSwrQkFBQUEsaUJBS0FBLCtCQUFBQTs7SUF4R04sTUFBTSxFQUFDQyxZQUFBQSxFQUFZLEdBQUdoQiw2RUFBaUJBO0lBQ3ZDLE1BQU0sRUFBQ2lCLFFBQUFBLEVBQVEsR0FBR2hCLDBFQUFPQTtJQUN6QixNQUFNLENBQUNpQixtQkFBbUJDLFNBQVMsR0FBR3JCLGlEQUFVQSxDQUFDSSxtRUFBa0JBLEVBQUUsSUFBSWtCO0lBRXpFLE1BQU0sRUFBQ0MsS0FBQUEsRUFBTUMsUUFBQUEsRUFBU0MsTUFBQUEsRUFBT0MsUUFBQUEsRUFBUSxHQUFHekIsMkVBQW1CQSxDQUFDO1FBQzFEUSxXQUFXO1lBQ1QsR0FBR0EsU0FBUztZQUNaa0IsUUFBUWpCO1FBQ1Y7SUFDRjtJQUVBLE1BQU0sQ0FBQ2tCLFlBQVlDLElBQUksR0FBR0MscUNBQ3hCO1FBQ0UsR0FBR3JCLFNBQVM7UUFDWmtCLFFBQVFqQjtJQUNWLEdBQ0E7UUFDRXFCLGFBQWEsT0FBTVIsT0FBUTtZQUN6QkYsU0FBUztnQkFDUFYsTUFBTTtnQkFDTnFCLFFBQVE7Z0JBQ1JDLFdBQVdWLEtBQUtLLFVBQVUsQ0FBQ00sUUFBUTtZQUNyQztRQUNGO0lBQ0Y7SUFHRixNQUFNLENBQUNDLGFBQWFDLEtBQUss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QUMxQjhCLE1BQU07b0JBQ0pxQyxVQUFVVztnQkFDWjtnQkFDQTlEO1lBQ0Y7UUFDRjtJQUNGO0FBQUM7SUFwQ0drRTs7UUFJSjlFLDBFQUFzQkE7OztLQUpsQjhFLHVDQUFBQSxnQ0FBQUEsS0FBQUEsRUFBQUEsV0FBQUE7O1FBSUo5RSwwRUFBc0JBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vX05fRS8uLi8uLi9saWJzL2NvbW1lbnRzL3dlYnNpdGUvc3JjL2xpYi9jb21tZW50LWxpc3QvY29tbWVudC1saXN0LWNvbnRhaW5lci50c3g/MmI2OCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDaGFsbGVuZ2VRdWVyeSxcbiAgQ29tbWVudCxcbiAgQ29tbWVudEl0ZW1UeXBlLFxuICBDb21tZW50TGlzdERvY3VtZW50LFxuICBDb21tZW50TGlzdFF1ZXJ5LFxuICBDb21tZW50TGlzdFF1ZXJ5VmFyaWFibGVzLFxuICBTZXR0aW5nTGlzdFF1ZXJ5LFxuICBTZXR0aW5nTmFtZSxcbiAgdXNlQWRkQ29tbWVudE11dGF0aW9uLFxuICB1c2VDaGFsbGVuZ2VMYXp5UXVlcnksXG4gIHVzZUVkaXRDb21tZW50TXV0YXRpb24sXG4gIHVzZVNldHRpbmdMaXN0UXVlcnlcbn0gZnJvbSAnQHdlcHVibGlzaC93ZWJzaXRlL2FwaSdcbmltcG9ydCB7UXVlcnlSZXN1bHR9IGZyb20gJ0BhcG9sbG8vY2xpZW50J1xuaW1wb3J0IHt1c2VFZmZlY3QsIHVzZVJlZHVjZXJ9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHt1c2VDb21tZW50TGlzdFF1ZXJ5fSBmcm9tICdAd2VwdWJsaXNoL3dlYnNpdGUvYXBpJ1xuaW1wb3J0IHtcbiAgQnVpbGRlckNvbnRhaW5lclByb3BzLFxuICB1c2VXZWJzaXRlQnVpbGRlcixcbiAgQnVpbGRlckNvbW1lbnRMaXN0UHJvcHNcbn0gZnJvbSAnQHdlcHVibGlzaC93ZWJzaXRlL2J1aWxkZXInXG5pbXBvcnQge3VzZVVzZXJ9IGZyb20gJ0B3ZXB1Ymxpc2gvYXV0aGVudGljYXRpb24vd2Vic2l0ZSdcbmltcG9ydCB7Y29tbWVudExpc3RSZWR1Y2VyfSBmcm9tICcuL2NvbW1lbnQtbGlzdC5zdGF0ZSdcbmltcG9ydCB7cHJvZHVjZX0gZnJvbSAnaW1tZXInXG5cbnR5cGUgUGVlckFydGljbGVDb21tZW50cyA9IHtcbiAgdHlwZTogQ29tbWVudEl0ZW1UeXBlLlBlZXJBcnRpY2xlXG4gIHBlZXJJZDogc3RyaW5nXG59XG5cbnR5cGUgQXJ0aWNsZU9yUGFnZUNvbW1lbnRzID0ge1xuICB0eXBlOiBDb21tZW50SXRlbVR5cGVcbiAgcGVlcklkPzogbmV2ZXJcbn1cblxuZXhwb3J0IHR5cGUgQ29tbWVudExpc3RDb250YWluZXJQcm9wcyA9IHtcbiAgaWQ6IHN0cmluZ1xuXG4gIG9uQ2hhbGxlbmdlUXVlcnk/OiAoXG4gICAgcXVlcnlSZXN1bHQ6IFBpY2s8UXVlcnlSZXN1bHQ8Q2hhbGxlbmdlUXVlcnk+LCAnZGF0YScgfCAnbG9hZGluZycgfCAnZXJyb3InIHwgJ3JlZmV0Y2gnPlxuICApID0+IHZvaWRcblxuICBvblNldHRpbmdMaXN0UXVlcnk/OiAoXG4gICAgcXVlcnlSZXN1bHQ6IFBpY2s8UXVlcnlSZXN1bHQ8U2V0dGluZ0xpc3RRdWVyeT4sICdkYXRhJyB8ICdsb2FkaW5nJyB8ICdlcnJvcicgfCAncmVmZXRjaCc+XG4gICkgPT4gdm9pZFxuXG4gIG9uQ29tbWVudExpc3RRdWVyeT86IChcbiAgICBxdWVyeVJlc3VsdDogUGljazxRdWVyeVJlc3VsdDxDb21tZW50TGlzdFF1ZXJ5PiwgJ2RhdGEnIHwgJ2xvYWRpbmcnIHwgJ2Vycm9yJyB8ICdyZWZldGNoJz5cbiAgKSA9PiB2b2lkXG59ICYgQnVpbGRlckNvbnRhaW5lclByb3BzICZcbiAgUGljazxCdWlsZGVyQ29tbWVudExpc3RQcm9wcywgJ3ZhcmlhYmxlcycgfCAnb25WYXJpYWJsZXNDaGFuZ2UnPiAmXG4gIChQZWVyQXJ0aWNsZUNvbW1lbnRzIHwgQXJ0aWNsZU9yUGFnZUNvbW1lbnRzKVxuXG5leHBvcnQgZnVuY3Rpb24gQ29tbWVudExpc3RDb250YWluZXIoe1xuICBjbGFzc05hbWUsXG4gIHZhcmlhYmxlcyxcbiAgaWQsXG4gIHR5cGUsXG4gIHBlZXJJZCxcbiAgb25WYXJpYWJsZXNDaGFuZ2UsXG4gIG9uQ29tbWVudExpc3RRdWVyeSxcbiAgb25DaGFsbGVuZ2VRdWVyeSxcbiAgb25TZXR0aW5nTGlzdFF1ZXJ5XG59OiBDb21tZW50TGlzdENvbnRhaW5lclByb3BzKSB7XG4gIGNvbnN0IHtDb21tZW50TGlzdH0gPSB1c2VXZWJzaXRlQnVpbGRlcigpXG4gIGNvbnN0IHtoYXNVc2VyfSA9IHVzZVVzZXIoKVxuICBjb25zdCBbb3BlbldyaXRlQ29tbWVudHMsIGRpc3BhdGNoXSA9IHVzZVJlZHVjZXIoY29tbWVudExpc3RSZWR1Y2VyLCBuZXcgTWFwKCkpXG5cbiAgY29uc3Qge2RhdGEsIGxvYWRpbmcsIGVycm9yLCByZWZldGNofSA9IHVzZUNvbW1lbnRMaXN0UXVlcnkoe1xuICAgIHZhcmlhYmxlczoge1xuICAgICAgLi4udmFyaWFibGVzLFxuICAgICAgaXRlbUlkOiBpZFxuICAgIH1cbiAgfSlcblxuICBjb25zdCBbYWRkQ29tbWVudCwgYWRkXSA9IHVzZUFkZENvbW1lbnRNdXRhdGlvbldpdGhDYWNoZVVwZGF0ZShcbiAgICB7XG4gICAgICAuLi52YXJpYWJsZXMsXG4gICAgICBpdGVtSWQ6IGlkXG4gICAgfSxcbiAgICB7XG4gICAgICBvbkNvbXBsZXRlZDogYXN5bmMgZGF0YSA9PiB7XG4gICAgICAgIGRpc3BhdGNoKHtcbiAgICAgICAgICB0eXBlOiAnYWRkJyxcbiAgICAgICAgICBhY3Rpb246ICdjbG9zZScsXG4gICAgICAgICAgY29tbWVudElkOiBkYXRhLmFkZENvbW1lbnQucGFyZW50SURcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIClcblxuICBjb25zdCBbZWRpdENvbW1lbnQsIGVkaXRdID0gdXNlRWRpdENvbW1lbnRNdXRhdGlvbih7XG4gICAgb25Db21wbGV0ZWQ6IGFzeW5jIGRhdGEgPT4ge1xuICAgICAgYXdhaXQgcmVmZXRjaCgpXG4gICAgICBkaXNwYXRjaCh7XG4gICAgICAgIHR5cGU6ICdlZGl0JyxcbiAgICAgICAgYWN0aW9uOiAnY2xvc2UnLFxuICAgICAgICBjb21tZW50SWQ6IGRhdGEudXBkYXRlQ29tbWVudC5pZFxuICAgICAgfSlcbiAgICB9XG4gIH0pXG5cbiAgY29uc3Qgc2V0dGluZ3MgPSB1c2VTZXR0aW5nTGlzdFF1ZXJ5KHt9KVxuICBjb25zdCBbZmV0Y2hDaGFsbGVuZ2UsIGNoYWxsZW5nZV0gPSB1c2VDaGFsbGVuZ2VMYXp5UXVlcnkoKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFoYXNVc2VyKSB7XG4gICAgICBmZXRjaENoYWxsZW5nZSgpXG4gICAgfVxuICB9LCBbaGFzVXNlciwgZmV0Y2hDaGFsbGVuZ2VdKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgb25Db21tZW50TGlzdFF1ZXJ5Py4oe2RhdGEsIGxvYWRpbmcsIGVycm9yLCByZWZldGNofSlcbiAgfSwgW2RhdGEsIGxvYWRpbmcsIGVycm9yLCByZWZldGNoLCBvbkNvbW1lbnRMaXN0UXVlcnldKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgb25DaGFsbGVuZ2VRdWVyeT8uKGNoYWxsZW5nZSlcbiAgfSwgW2NoYWxsZW5nZSwgb25DaGFsbGVuZ2VRdWVyeV0pXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBvblNldHRpbmdMaXN0UXVlcnk/LihzZXR0aW5ncylcbiAgfSwgW3NldHRpbmdzLCBvblNldHRpbmdMaXN0UXVlcnldKVxuXG4gIHJldHVybiAoXG4gICAgPENvbW1lbnRMaXN0XG4gICAgICBkYXRhPXtkYXRhfVxuICAgICAgbG9hZGluZz17bG9hZGluZyB8fCBzZXR0aW5ncy5sb2FkaW5nfVxuICAgICAgZXJyb3I9e2Vycm9yID8/IHNldHRpbmdzLmVycm9yfVxuICAgICAgY2hhbGxlbmdlPXtjaGFsbGVuZ2V9XG4gICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZX1cbiAgICAgIHZhcmlhYmxlcz17dmFyaWFibGVzfVxuICAgICAgb25WYXJpYWJsZXNDaGFuZ2U9e29uVmFyaWFibGVzQ2hhbmdlfVxuICAgICAgb3BlbkVkaXRvcnNTdGF0ZT17W29wZW5Xcml0ZUNvbW1lbnRzLCBkaXNwYXRjaF19XG4gICAgICBhZGQ9e2FkZH1cbiAgICAgIG9uQWRkQ29tbWVudD17aW5wdXQgPT4ge1xuICAgICAgICBhZGRDb21tZW50KHtcbiAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgIGlucHV0OiB7XG4gICAgICAgICAgICAgIC4uLmlucHV0LFxuICAgICAgICAgICAgICBpdGVtSUQ6IGlkLFxuICAgICAgICAgICAgICBpdGVtVHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgcGVlcklkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfX1cbiAgICAgIGVkaXQ9e2VkaXR9XG4gICAgICBvbkVkaXRDb21tZW50PXtpbnB1dCA9PiB7XG4gICAgICAgIGVkaXRDb21tZW50KHtcbiAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgIGlucHV0XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfX1cbiAgICAgIG1heENvbW1lbnRMZW5ndGg9e1xuICAgICAgICBzZXR0aW5ncy5kYXRhPy5zZXR0aW5ncy5maW5kKHNldHRpbmcgPT4gc2V0dGluZy5uYW1lID09PSBTZXR0aW5nTmFtZS5Db21tZW50Q2hhckxpbWl0KVxuICAgICAgICAgID8udmFsdWUgPz8gMTAwMFxuICAgICAgfVxuICAgICAgYW5vbnltb3VzQ2FuQ29tbWVudD17XG4gICAgICAgIHNldHRpbmdzLmRhdGE/LnNldHRpbmdzLmZpbmQoc2V0dGluZyA9PiBzZXR0aW5nLm5hbWUgPT09IFNldHRpbmdOYW1lLkFsbG93R3Vlc3RDb21tZW50aW5nKVxuICAgICAgICAgID8udmFsdWVcbiAgICAgIH1cbiAgICAgIGFub255bW91c0NhblJhdGU9e1xuICAgICAgICBzZXR0aW5ncy5kYXRhPy5zZXR0aW5ncy5maW5kKFxuICAgICAgICAgIHNldHRpbmcgPT4gc2V0dGluZy5uYW1lID09PSBTZXR0aW5nTmFtZS5BbGxvd0d1ZXN0Q29tbWVudFJhdGluZ1xuICAgICAgICApPy52YWx1ZVxuICAgICAgfVxuICAgICAgdXNlckNhbkVkaXQ9e1xuICAgICAgICBzZXR0aW5ncy5kYXRhPy5zZXR0aW5ncy5maW5kKHNldHRpbmcgPT4gc2V0dGluZy5uYW1lID09PSBTZXR0aW5nTmFtZS5BbGxvd0NvbW1lbnRFZGl0aW5nKVxuICAgICAgICAgID8udmFsdWVcbiAgICAgIH1cbiAgICAvPlxuICApXG59XG5cbmNvbnN0IGV4dHJhY3RBbGxDb21tZW50cyA9IChjb21tZW50czogQ29tbWVudFtdKTogQ29tbWVudFtdID0+IHtcbiAgY29uc3QgYWxsQ29tbWVudHMgPSBbXSBhcyBDb21tZW50W11cblxuICBmb3IgKGNvbnN0IGNvbW1lbnQgb2YgY29tbWVudHMpIHtcbiAgICBhbGxDb21tZW50cy5wdXNoKGNvbW1lbnQpXG5cbiAgICBpZiAoY29tbWVudC5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgIGFsbENvbW1lbnRzLnB1c2goLi4uZXh0cmFjdEFsbENvbW1lbnRzKGNvbW1lbnQuY2hpbGRyZW4pKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhbGxDb21tZW50c1xufVxuXG5jb25zdCB1c2VBZGRDb21tZW50TXV0YXRpb25XaXRoQ2FjaGVVcGRhdGUgPSAoXG4gIHZhcmlhYmxlczogQ29tbWVudExpc3RRdWVyeVZhcmlhYmxlcyxcbiAgLi4ucGFyYW1zOiBQYXJhbWV0ZXJzPHR5cGVvZiB1c2VBZGRDb21tZW50TXV0YXRpb24+XG4pID0+XG4gIHVzZUFkZENvbW1lbnRNdXRhdGlvbih7XG4gICAgLi4ucGFyYW1zWzBdLFxuICAgIHVwZGF0ZTogKGNhY2hlLCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gY2FjaGUucmVhZFF1ZXJ5PENvbW1lbnRMaXN0UXVlcnk+KHtcbiAgICAgICAgcXVlcnk6IENvbW1lbnRMaXN0RG9jdW1lbnQsXG4gICAgICAgIHZhcmlhYmxlc1xuICAgICAgfSlcblxuICAgICAgaWYgKCFxdWVyeSB8fCAhZGF0YT8uYWRkQ29tbWVudCkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29uc3QgdXBkYXRlZENvbW1lbnRzID0gcHJvZHVjZShxdWVyeS5jb21tZW50cywgY29tbWVudHMgPT4ge1xuICAgICAgICBjb25zdCBhbGxDb21tZW50cyA9IGV4dHJhY3RBbGxDb21tZW50cyhjb21tZW50cylcblxuICAgICAgICBjb25zdCBwYXJlbnRDb21tZW50ID0gYWxsQ29tbWVudHMuZmluZChjb21tZW50ID0+IGNvbW1lbnQuaWQgPT09IGRhdGEuYWRkQ29tbWVudC5wYXJlbnRJRClcblxuICAgICAgICBpZiAocGFyZW50Q29tbWVudCkge1xuICAgICAgICAgIHBhcmVudENvbW1lbnQuY2hpbGRyZW4udW5zaGlmdChkYXRhLmFkZENvbW1lbnQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29tbWVudHMudW5zaGlmdChkYXRhLmFkZENvbW1lbnQpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGNhY2hlLndyaXRlUXVlcnk8Q29tbWVudExpc3RRdWVyeT4oe1xuICAgICAgICBxdWVyeTogQ29tbWVudExpc3REb2N1bWVudCxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGNvbW1lbnRzOiB1cGRhdGVkQ29tbWVudHNcbiAgICAgICAgfSxcbiAgICAgICAgdmFyaWFibGVzXG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuY29uc3QgdXNlRWRpdENvbW1lbnRNdXRhdGlvbldpdGhDYWNoZVVwZGF0ZSA9IChcbiAgdmFyaWFibGVzOiBDb21tZW50TGlzdFF1ZXJ5VmFyaWFibGVzLFxuICAuLi5wYXJhbXM6IFBhcmFtZXRlcnM8dHlwZW9mIHVzZUVkaXRDb21tZW50TXV0YXRpb24+XG4pID0+XG4gIHVzZUVkaXRDb21tZW50TXV0YXRpb24oe1xuICAgIC4uLnBhcmFtc1swXSxcbiAgICB1cGRhdGU6IChjYWNoZSwge2RhdGF9KSA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IGNhY2hlLnJlYWRRdWVyeTxDb21tZW50TGlzdFF1ZXJ5Pih7XG4gICAgICAgIHF1ZXJ5OiBDb21tZW50TGlzdERvY3VtZW50LFxuICAgICAgICB2YXJpYWJsZXNcbiAgICAgIH0pXG5cbiAgICAgIGlmICghcXVlcnkgfHwgIWRhdGE/LnVwZGF0ZUNvbW1lbnQpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVwZGF0ZWRDb21tZW50cyA9IHByb2R1Y2UocXVlcnkuY29tbWVudHMsIGNvbW1lbnRzID0+IHtcbiAgICAgICAgY29uc3QgYWxsQ29tbWVudHMgPSBleHRyYWN0QWxsQ29tbWVudHMoY29tbWVudHMpXG5cbiAgICAgICAgY29uc3Qgb2xkQ29tbWVudCA9IGFsbENvbW1lbnRzLmZpbmQoY29tbWVudCA9PiBjb21tZW50LmlkID09PSBkYXRhLnVwZGF0ZUNvbW1lbnQuaWQpXG5cbiAgICAgICAgaWYgKG9sZENvbW1lbnQpIHtcbiAgICAgICAgICBvbGRDb21tZW50LnRpdGxlID0gZGF0YS51cGRhdGVDb21tZW50LnRpdGxlXG4gICAgICAgICAgb2xkQ29tbWVudC5sZWFkID0gZGF0YS51cGRhdGVDb21tZW50LmxlYWRcbiAgICAgICAgICBvbGRDb21tZW50LnRleHQgPSBkYXRhLnVwZGF0ZUNvbW1lbnQudGV4dFxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBjYWNoZS53cml0ZVF1ZXJ5PENvbW1lbnRMaXN0UXVlcnk+KHtcbiAgICAgICAgcXVlcnk6IENvbW1lbnRMaXN0RG9jdW1lbnQsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBjb21tZW50czogdXBkYXRlZENvbW1lbnRzXG4gICAgICAgIH0sXG4gICAgICAgIHZhcmlhYmxlc1xuICAgICAgfSlcbiAgICB9XG4gIH0pXG4iXSwibmFtZXMiOlsiQ29tbWVudExpc3REb2N1bWVudCIsIlNldHRpbmdOYW1lIiwidXNlQWRkQ29tbWVudE11dGF0aW9uIiwidXNlQ2hhbGxlbmdlTGF6eVF1ZXJ5IiwidXNlRWRpdENvbW1lbnRNdXRhdGlvbiIsInVzZVNldHRpbmdMaXN0UXVlcnkiLCJ1c2VFZmZlY3QiLCJ1c2VSZWR1Y2VyIiwidXNlQ29tbWVudExpc3RRdWVyeSIsInVzZVdlYnNpdGVCdWlsZGVyIiwidXNlVXNlciIsImNvbW1lbnRMaXN0UmVkdWNlciIsInByb2R1Y2UiLCJDb21tZW50TGlzdENvbnRhaW5lciIsInBhcmFtIiwiY2xhc3NOYW1lIiwidmFyaWFibGVzIiwiaWQiLCJ0eXBlIiwicGVlcklkIiwib25WYXJpYWJsZXNDaGFuZ2UiLCJvbkNvbW1lbnRMaXN0UXVlcnkiLCJvbkNoYWxsZW5nZVF1ZXJ5Iiwib25TZXR0aW5nTGlzdFF1ZXJ5Iiwic2V0dGluZ3MiLCJDb21tZW50TGlzdCIsImhhc1VzZXIiLCJvcGVuV3JpdGVDb21tZW50cyIsImRpc3BhdGNoIiwiTWFwIiwiZGF0YSIsImxvYWRpbmciLCJlcnJvciIsInJlZmV0Y2giLCJpdGVtSWQiLCJhZGRDb21tZW50IiwiYWRkIiwidXNlQWRkQ29tbWVudE11dGF0aW9uV2l0aENhY2hlVXBkYXRlIiwib25Db21wbGV0ZWQiLCJhY3Rpb24iLCJjb21tZW50SWQiLCJwYXJlbnRJRCIsImVkaXRDb21tZW50IiwiZWRpdCIsInVwZGF0ZUNvbW1lbnQiLCJmZXRjaENoYWxsZW5nZSIsImNoYWxsZW5nZSIsIl9qc3hERVYiLCJvcGVuRWRpdG9yc1N0YXRlIiwib25BZGRDb21tZW50IiwiaW5wdXQiLCJpdGVtSUQiLCJpdGVtVHlwZSIsIm9uRWRpdENvbW1lbnQiLCJtYXhDb21tZW50TGVuZ3RoIiwiZmluZCIsInNldHRpbmciLCJuYW1lIiwiQ29tbWVudENoYXJMaW1pdCIsInZhbHVlIiwiYW5vbnltb3VzQ2FuQ29tbWVudCIsIkFsbG93R3Vlc3RDb21tZW50aW5nIiwiYW5vbnltb3VzQ2FuUmF0ZSIsIkFsbG93R3Vlc3RDb21tZW50UmF0aW5nIiwidXNlckNhbkVkaXQiLCJBbGxvd0NvbW1lbnRFZGl0aW5nIiwiZXh0cmFjdEFsbENvbW1lbnRzIiwiY29tbWVudHMiLCJhbGxDb21tZW50cyIsImNvbW1lbnQiLCJwdXNoIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJwYXJhbXMiLCJ1cGRhdGUiLCJjYWNoZSIsInF1ZXJ5IiwicmVhZFF1ZXJ5IiwidXBkYXRlZENvbW1lbnRzIiwicGFyZW50Q29tbWVudCIsInVuc2hpZnQiLCJ3cml0ZVF1ZXJ5IiwidXNlRWRpdENvbW1lbnRNdXRhdGlvbldpdGhDYWNoZVVwZGF0ZSIsIm9sZENvbW1lbnQiLCJ0aXRsZSIsImxlYWQiLCJ0ZXh0Il0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///../../libs/comments/website/src/lib/comment-list/comment-list-container.tsx\n"));

/***/ })

});