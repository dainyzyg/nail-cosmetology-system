/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 134);
/******/ })
/************************************************************************/
/******/ ({

/***/ 112:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ScoreProgress_vue__ = __webpack_require__(138);
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//



/* harmony default export */ __webpack_exports__["a"] = ({
  components: {
    ScoreProgress: __WEBPACK_IMPORTED_MODULE_0__ScoreProgress_vue__["a" /* default */]
  },
  data: function data() {
    return {
      aggregatedData: {},
      reportType: '',
      orderList: [],
      techList: []
    };
  },
  created: function created() {
    // require('electron').remote.getCurrentWebContents().print({printBackground:true})
    // window.ipcRenderer.on('asynchronous-reply', this.getData)
    // this.getData()
    // alert('asdasd')
    var ipcRenderer = window.electron.ipcRenderer;
    ipcRenderer.sendToHost('dom-ready');
    ipcRenderer.on('data-change', this.receiveData);
    ipcRenderer.on('print', this.print);
    ipcRenderer.on('type-change', this.setType);
  },
  beforeDestroy: function beforeDestroy() {
    // window.ipcRenderer.removeListener('asynchronous-reply', this.getData)
  },

  methods: {
    getTip: function getTip(p) {
      console.log(p.subsidy, p);
      if (p.subsidy > 0) {
        return p.tip + '+' + p.subsidy;
      }
      return p.tip;
    },
    getWaitingForProject: function getWaitingForProject(_ref) {
      var waitforAssianItem = _ref.waitforAssianItem;

      if (!waitforAssianItem) return '无';
      return waitforAssianItem.orderName + '-' + waitforAssianItem.projectName;
    },
    correctNum: function correctNum(val) {
      if (isNaN(val)) {
        return NaN;
      }
      var num = Math.round(val * 1000000) / 1000000;
      return num;
    },
    fixed2: function fixed2(val) {
      var num = this.correctNum(val);
      if (isNaN(num)) {
        return '';
      }
      return num.toFixed(2);
    },
    setType: function setType(event, type) {
      this.reportType = type;
    },
    getQueryString: function getQueryString(name) {
      var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
      var r = window.location.search.substr(1).match(reg);
      if (r != null) return unescape(r[2]);
      return null;
    },
    receiveData: function receiveData(event, orderList, techList, aggregatedData) {
      this.orderList = orderList;
      this.techList = techList;
      this.aggregatedData = aggregatedData;
      console.log(this.techList);
    },
    print1: function print1() {
      window.alert('asdasd');
      var ipcRenderer = window.electron.ipcRenderer;
      ipcRenderer.sendToHost('pong');
    },
    print: function print() {
      window.print();
      // window.electron.remote.getCurrentWebContents().print({ silent: false })
    }
  },
  computed: {
    commissionAccountTotal: function commissionAccountTotal() {
      return this.correctNum(this.aggregatedData.commissionAccountTotal);
    },
    profits: function profits() {
      return this.correctNum(this.aggregatedData.projectPrices - this.aggregatedData.subsidyTotal - this.aggregatedData.waitingPriceTotal - this.aggregatedData.commissionAccountTotal);
    },
    cashProfits: function cashProfits() {
      // alert(`${this.profits} - this.giftCardAmount - this.creditCardAmount - this.couponAmount`)
      return this.correctNum(this.profits - this.aggregatedData.giftCardAmount - this.aggregatedData.creditCardAmount - this.aggregatedData.couponAmount);
    }
  },
  watch: {}
});

/***/ }),

/***/ 113:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["a"] = ({
  components: {},
  props: {
    scoreObj: {
      default: null
    }
  },
  data: function data() {
    return {
      // scoreObj: null
    };
  },
  created: function created() {
    // alert(this.techID)
  },
  beforeDestroy: function beforeDestroy() {
    // window.ipcRenderer.removeListener('asynchronous-reply', this.getData)
  },

  methods: {},
  computed: {
    percent: function percent() {
      if (this.scoreObj) {
        var p = this.scoreObj.score / this.scoreObj.targetScore * 100;
        return p + '%';
      }
      return '0%';
    }
  },
  watch: {}
});

/***/ }),

/***/ 134:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Print_vue__ = __webpack_require__(135);


/* eslint-disable no-new */
new window.Vue({
  el: '#app',
  render: (h) => h(__WEBPACK_IMPORTED_MODULE_0__Print_vue__["a" /* default */])
})


/***/ }),

/***/ 135:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_lib_selector_type_script_index_0_Print_vue__ = __webpack_require__(112);
/* unused harmony namespace reexport */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_lib_template_compiler_index_id_data_v_fe62f11a_hasScoped_true_buble_transforms_node_modules_vue_loader_lib_template_compiler_preprocessor_engine_pug_node_modules_vue_loader_lib_selector_type_template_index_0_Print_vue__ = __webpack_require__(142);
var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(136)
}
var normalizeComponent = __webpack_require__(16)
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = "data-v-fe62f11a"
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_lib_selector_type_script_index_0_Print_vue__["a" /* default */],
  __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_lib_template_compiler_index_id_data_v_fe62f11a_hasScoped_true_buble_transforms_node_modules_vue_loader_lib_template_compiler_preprocessor_engine_pug_node_modules_vue_loader_lib_selector_type_template_index_0_Print_vue__["a" /* default */],
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = "other_screens\\src\\Print.vue"

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-fe62f11a", Component.options)
  } else {
    hotAPI.reload("data-v-fe62f11a", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["a"] = (Component.exports);


/***/ }),

/***/ 136:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(137);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(15)("53d14a68", content, false, {});
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../node_modules/css-loader/index.js!../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-fe62f11a\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./Print.vue", function() {
     var newContent = require("!!../../node_modules/css-loader/index.js!../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-fe62f11a\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./Print.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 137:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(14)(false);
// imports


// module
exports.push([module.i, "\n.page[data-v-fe62f11a] {\r\n  font-size: 2vw;\r\n  line-height: 2.5vw;\n}\ncaption[data-v-fe62f11a] {\r\n  font-size: 3vw;\r\n  line-height: 4.5vw;\r\n  font-weight: bold;\n}\n.align-right[data-v-fe62f11a] {\r\n  text-align: right;\n}\n.align-center[data-v-fe62f11a] {\r\n  text-align: center;\n}\ntd[data-v-fe62f11a],\r\nth[data-v-fe62f11a] {\r\n  word-break: break-all;\r\n  border-right: 0.1vw solid #000;\r\n  border-bottom: 0.1vw solid #000;\r\n  padding: 1vw;\n}\ntd[data-v-fe62f11a]:first-child,\r\nth[data-v-fe62f11a]:first-child {\r\n  border-left: 0.1vw solid #000;\n}\nthead tr:first-child th[data-v-fe62f11a] {\r\n  border-top: 0.1vw solid #000;\n}\r\n/* table {\r\n  margin-top: 10px;\r\n  page-break-inside: avoid;\r\n} */\ntr[data-v-fe62f11a] {\r\n  /* height: 100px; */\r\n  page-break-inside: avoid;\n}\r\n", ""]);

// exports


/***/ }),

/***/ 138:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_lib_selector_type_script_index_0_ScoreProgress_vue__ = __webpack_require__(113);
/* unused harmony namespace reexport */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_lib_template_compiler_index_id_data_v_17e2deb6_hasScoped_true_buble_transforms_node_modules_vue_loader_lib_template_compiler_preprocessor_engine_pug_node_modules_vue_loader_lib_selector_type_template_index_0_ScoreProgress_vue__ = __webpack_require__(141);
var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(139)
}
var normalizeComponent = __webpack_require__(16)
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = "data-v-17e2deb6"
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_lib_selector_type_script_index_0_ScoreProgress_vue__["a" /* default */],
  __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_lib_template_compiler_index_id_data_v_17e2deb6_hasScoped_true_buble_transforms_node_modules_vue_loader_lib_template_compiler_preprocessor_engine_pug_node_modules_vue_loader_lib_selector_type_template_index_0_ScoreProgress_vue__["a" /* default */],
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = "other_screens\\src\\ScoreProgress.vue"

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-17e2deb6", Component.options)
  } else {
    hotAPI.reload("data-v-17e2deb6", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["a"] = (Component.exports);


/***/ }),

/***/ 139:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(140);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(15)("aa2f0a0c", content, false, {});
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../node_modules/css-loader/index.js!../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-17e2deb6\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./ScoreProgress.vue", function() {
     var newContent = require("!!../../node_modules/css-loader/index.js!../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-17e2deb6\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./ScoreProgress.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 14:
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),

/***/ 140:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(14)(false);
// imports


// module
exports.push([module.i, "\n.score-progress[data-v-17e2deb6] {\r\n  display: -webkit-box;\r\n  display: -ms-flexbox;\r\n  display: flex;\n}\n.score-progress-bar[data-v-17e2deb6] {\r\n  border: 0.1vw solid #000;\r\n  height: 2vw;\r\n  -webkit-box-flex: 1;\r\n      -ms-flex: 1;\r\n          flex: 1;\r\n  margin-right: 0.5vw;\r\n  border-radius: 1vw;\r\n  overflow: hidden;\r\n  /* padding: 0.2vw; */\n}\n.score-progress-bar-filling[data-v-17e2deb6] {\r\n  /* border-radius: 0.5vw; */\r\n  height: 100%;\r\n  /* width: 80%; */\r\n  background: #000;\n}\ntd[data-v-17e2deb6],\r\nth[data-v-17e2deb6] {\r\n  word-break: break-all;\r\n  border-right: 0.1vw solid #000;\r\n  border-bottom: 0.1vw solid #000;\r\n  padding: 1vw;\n}\ntd[data-v-17e2deb6]:first-child,\r\nth[data-v-17e2deb6]:first-child {\r\n  border-left: 0.1vw solid #000;\n}\nthead tr:first-child th[data-v-17e2deb6] {\r\n  border-top: 0.1vw solid #000;\n}\r\n/* table {\r\n  margin-top: 10px;\r\n  page-break-inside: avoid;\r\n} */\ntr[data-v-17e2deb6] {\r\n  /* height: 100px; */\r\n  page-break-inside: avoid;\n}\r\n", ""]);

// exports


/***/ }),

/***/ 141:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _vm.scoreObj
    ? _c("tr", [
        _c("td", { attrs: { colspan: "5" } }, [
          _c("div", { staticClass: "score-progress" }, [
            _c("span", [_vm._v("技师得分：")]),
            _c("div", { staticClass: "score-progress-bar" }, [
              _c("div", {
                staticClass: "score-progress-bar-filling",
                style: { width: _vm.percent }
              })
            ]),
            _c("span", [
              _vm._v(
                _vm._s(_vm.scoreObj.score) +
                  "/" +
                  _vm._s(_vm.scoreObj.targetScore) +
                  " (升级" +
                  _vm._s(_vm.scoreObj.targetLevel) +
                  ")"
              )
            ])
          ])
        ])
      ])
    : _vm._e()
}
var staticRenderFns = []
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
    require("vue-hot-reload-api")      .rerender("data-v-17e2deb6", esExports)
  }
}

/***/ }),

/***/ 142:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c(
    "div",
    { staticClass: "page" },
    [
      _vm.reportType == "businessReport"
        ? _c(
            "table",
            {
              key: "yingye",
              staticStyle: { width: "100%", "page-break-after": "always" },
              attrs: { cellspacing: "0", cellpadding: "0" }
            },
            [
              _c("caption", [_vm._v("营业报表")]),
              _vm._m(0),
              _vm._m(1),
              _c(
                "tbody",
                _vm._l(_vm.techList, function(i) {
                  return _c("tr", [
                    _c("td", { staticClass: "align-center" }, [
                      _vm._v(_vm._s(i.name))
                    ]),
                    _c("td", { staticClass: "align-right" }, [
                      _vm._v(_vm._s((i.rates / i.count).toFixed(2)))
                    ]),
                    _c("td", { staticClass: "align-right" }, [
                      _vm._v(_vm._s((i.tips || 0) + (i.subsidys || 0)))
                    ]),
                    _c("td", { staticClass: "align-right" }, [
                      _vm._v(_vm._s(i.waitingPriceTotal || 0))
                    ]),
                    _c("td", { staticClass: "align-right" }, [
                      _vm._v(_vm._s(i.projectPrices))
                    ]),
                    _c("td", { staticClass: "align-right" }, [
                      _vm._v(_vm._s(_vm.fixed2(i.commissionTotal)))
                    ]),
                    _c("td", { staticClass: "align-right" }, [
                      _vm._v(
                        _vm._s(
                          _vm.fixed2(
                            i.projectPrices - _vm.correctNum(i.commissionTotal)
                          )
                        )
                      )
                    ])
                  ])
                })
              ),
              _c("tfoot", [
                _c("tr", [
                  _c(
                    "th",
                    {
                      staticStyle: { "text-align": "right" },
                      attrs: { colspan: "7" }
                    },
                    [
                      _vm._v(
                        "营业总数:$" +
                          _vm._s(_vm.aggregatedData.projectPrices) +
                          " 提成总数:$" +
                          _vm._s(_vm.commissionAccountTotal) +
                          " 小费补贴:$" +
                          _vm._s(_vm.aggregatedData.subsidyTotal) +
                          " 等待费用:$" +
                          _vm._s(_vm.aggregatedData.waitingPriceTotal) +
                          " 利润总数:$" +
                          _vm._s(_vm.profits)
                      )
                    ]
                  )
                ]),
                _c("tr", [
                  _c(
                    "th",
                    {
                      staticStyle: { "text-align": "right" },
                      attrs: { colspan: "7" }
                    },
                    [
                      _vm._v(
                        "实收总数:$" +
                          _vm._s(_vm.aggregatedData.paytotals) +
                          " 其中现金:$" +
                          _vm._s(_vm.aggregatedData.cashAmount) +
                          " 礼卡:$" +
                          _vm._s(_vm.aggregatedData.giftCardAmount) +
                          " 信用卡:$" +
                          _vm._s(_vm.aggregatedData.creditCardAmount) +
                          " 优惠券:$" +
                          _vm._s(_vm.aggregatedData.couponAmount) +
                          " 现金盈亏:$" +
                          _vm._s(_vm.cashProfits)
                      )
                    ]
                  )
                ])
              ])
            ]
          )
        : _vm._e(),
      _vm._l(_vm.techList, function(i) {
        return _vm.reportType == "techReport"
          ? _c(
              "table",
              {
                staticStyle: { width: "100%", "page-break-after": "always" },
                attrs: { cellspacing: "0", cellpadding: "0" }
              },
              [
                _c("caption", [_vm._v("技师报单")]),
                _c("tfoot", [
                  _c("tr", [
                    _c(
                      "th",
                      {
                        staticStyle: { "text-align": "right" },
                        attrs: { colspan: "5" }
                      },
                      [
                        _vm._v(
                          "单价总数:$" +
                            _vm._s(i.projectPrices) +
                            " 提成总数:$" +
                            _vm._s(_vm.fixed2(i.commissionTotal)) +
                            " 小费总数:$" +
                            _vm._s(i.tips + i.subsidys) +
                            " 等待费用:$" +
                            _vm._s(i.waitingPriceTotal || 0) +
                            " 平均星级:" +
                            _vm._s((i.rates / i.count).toFixed(2)) +
                            " 技师收入:$" +
                            _vm._s(
                              _vm.correctNum(
                                i.commissionTotal +
                                  i.tips +
                                  i.subsidys +
                                  (i.waitingPriceTotal || 0)
                              )
                            )
                        )
                      ]
                    )
                  ])
                ]),
                _vm._m(2, true),
                _c(
                  "thead",
                  { staticStyle: { display: "table-header-group" } },
                  [
                    _c("tr", [
                      _c(
                        "th",
                        {
                          staticStyle: { "text-align": "left" },
                          attrs: { colspan: "5" }
                        },
                        [_vm._v("技师名字:  " + _vm._s(i.name))]
                      )
                    ]),
                    _vm._m(3, true)
                  ]
                ),
                _c(
                  "tbody",
                  [
                    _vm._l(i.projectList, function(p) {
                      return _c("tr", [
                        _c("td", { staticClass: "align-center" }, [
                          _vm._v(_vm._s(p.orderName))
                        ]),
                        _c("td", { staticClass: "align-right" }, [
                          _vm._v(_vm._s(p.projectPrice))
                        ]),
                        _c("td", { staticClass: "align-right" }, [
                          _vm._v(
                            _vm._s(
                              _vm.fixed2(
                                p.accountAndCommission.commissionAccountTotal
                              )
                            )
                          )
                        ]),
                        _c("td", { staticClass: "align-right" }, [
                          _vm._v(_vm._s(_vm.getTip(p)))
                        ]),
                        _c("td", { staticClass: "align-right" }, [
                          _vm._v(_vm._s(p.rate))
                        ])
                      ])
                    }),
                    _vm._l(i.waitingTimeList, function(p) {
                      return _c("tr", [
                        _c("td", { staticClass: "align-center" }, [
                          _vm._v("等待时间")
                        ]),
                        _c("td", { attrs: { colspan: "4" } }, [
                          _vm._v(
                            "$" +
                              _vm._s(p.waitingPrice) +
                              "," +
                              _vm._s(p.waitingTime) +
                              "分钟，跳过项目:" +
                              _vm._s(p.orderName) +
                              "-" +
                              _vm._s(p.projectName) +
                              ",等待项目:" +
                              _vm._s(_vm.getWaitingForProject(p))
                          )
                        ])
                      ])
                    }),
                    _c("ScoreProgress", { attrs: { scoreObj: i.scoreObj } })
                  ],
                  2
                )
              ]
            )
          : _vm._e()
      }),
      false
        ? _c(
            "table",
            {
              staticStyle: { width: "100%", "page-break-after": "always" },
              attrs: { cellspacing: "0", cellpadding: "0" }
            },
            [
              _vm._m(4),
              _vm._m(5),
              _c(
                "tbody",
                [
                  _vm._l(_vm.orderList, function(i) {
                    return _c("tr", [
                      _c("td", { staticClass: "align-center" }, [
                        _vm._v(_vm._s(i.name))
                      ]),
                      _c("td", [_vm._v(_vm._s(i.phone))]),
                      _c("td", [_vm._v(_vm._s(i.projects))]),
                      _c("td", { staticClass: "align-right" }, [
                        _vm._v(_vm._s(i.tips))
                      ]),
                      _c("td", { staticClass: "align-right" }, [
                        _vm._v(_vm._s(i.projectPrice))
                      ]),
                      _c("td", { staticClass: "align-right" }, [
                        _vm._v(_vm._s(i.payTotal))
                      ])
                    ])
                  }),
                  _vm._l(_vm.orderList, function(i) {
                    return _c("tr", [
                      _c("td", { staticClass: "align-center" }, [
                        _vm._v(_vm._s(i.name))
                      ]),
                      _c("td", [_vm._v(_vm._s(i.phone))]),
                      _c("td", [_vm._v(_vm._s(i.projects))]),
                      _c("td", { staticClass: "align-right" }, [
                        _vm._v(_vm._s(i.tips))
                      ]),
                      _c("td", { staticClass: "align-right" }, [
                        _vm._v(_vm._s(i.projectPrice))
                      ]),
                      _c("td", { staticClass: "align-right" }, [
                        _vm._v(_vm._s(i.payTotal))
                      ])
                    ])
                  }),
                  _vm._l(_vm.orderList, function(i) {
                    return _c("tr", [
                      _c("td", { staticClass: "align-center" }, [
                        _vm._v(_vm._s(i.name))
                      ]),
                      _c("td", [_vm._v(_vm._s(i.phone))]),
                      _c("td", [_vm._v(_vm._s(i.projects))]),
                      _c("td", { staticClass: "align-right" }, [
                        _vm._v(_vm._s(i.tips))
                      ]),
                      _c("td", { staticClass: "align-right" }, [
                        _vm._v(_vm._s(i.projectPrice))
                      ]),
                      _c("td", { staticClass: "align-right" }, [
                        _vm._v(_vm._s(i.payTotal))
                      ])
                    ])
                  })
                ],
                2
              )
            ]
          )
        : _vm._e()
    ],
    2
  )
}
var staticRenderFns = [
  function() {
    var _vm = this
    var _h = _vm.$createElement
    var _c = _vm._self._c || _h
    return _c("colgroup", [_c("col"), _c("col")])
  },
  function() {
    var _vm = this
    var _h = _vm.$createElement
    var _c = _vm._self._c || _h
    return _c("thead", { staticStyle: { display: "table-header-group" } }, [
      _c("tr", [
        _c("th", [_vm._v("技师姓名")]),
        _c("th", [_vm._v("技师星级")]),
        _c("th", [_vm._v("小费总数$")]),
        _c("th", [_vm._v("等待费用$")]),
        _c("th", [_vm._v("单价总数$")]),
        _c("th", [_vm._v("技师提成$")]),
        _c("th", [_vm._v("利润$")])
      ])
    ])
  },
  function() {
    var _vm = this
    var _h = _vm.$createElement
    var _c = _vm._self._c || _h
    return _c("colgroup", [_c("col"), _c("col")])
  },
  function() {
    var _vm = this
    var _h = _vm.$createElement
    var _c = _vm._self._c || _h
    return _c("tr", [
      _c("th", [_vm._v("顾客姓名")]),
      _c("th", [_vm._v("单价$")]),
      _c("th", [_vm._v("提成$")]),
      _c("th", [_vm._v("小费$")]),
      _c("th", [_vm._v("星级")])
    ])
  },
  function() {
    var _vm = this
    var _h = _vm.$createElement
    var _c = _vm._self._c || _h
    return _c("colgroup", [_c("col"), _c("col")])
  },
  function() {
    var _vm = this
    var _h = _vm.$createElement
    var _c = _vm._self._c || _h
    return _c("thead", { staticStyle: { display: "table-header-group" } }, [
      _c("tr", [
        _c("th", [_vm._v("顾客姓名")]),
        _c("th", [_vm._v("电话")]),
        _c("th", [_vm._v("项目")]),
        _c("th", [_vm._v("小费$")]),
        _c("th", [_vm._v("项目费用$")]),
        _c("th", [_vm._v("应收合计$")])
      ])
    ])
  }
]
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
    require("vue-hot-reload-api")      .rerender("data-v-fe62f11a", esExports)
  }
}

/***/ }),

/***/ 15:
/***/ (function(module, exports, __webpack_require__) {

/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by Evan You @yyx990803
*/

var hasDocument = typeof document !== 'undefined'

if (typeof DEBUG !== 'undefined' && DEBUG) {
  if (!hasDocument) {
    throw new Error(
    'vue-style-loader cannot be used in a non-browser environment. ' +
    "Use { target: 'node' } in your Webpack config to indicate a server-rendering environment."
  ) }
}

var listToStyles = __webpack_require__(31)

/*
type StyleObject = {
  id: number;
  parts: Array<StyleObjectPart>
}

type StyleObjectPart = {
  css: string;
  media: string;
  sourceMap: ?string
}
*/

var stylesInDom = {/*
  [id: number]: {
    id: number,
    refs: number,
    parts: Array<(obj?: StyleObjectPart) => void>
  }
*/}

var head = hasDocument && (document.head || document.getElementsByTagName('head')[0])
var singletonElement = null
var singletonCounter = 0
var isProduction = false
var noop = function () {}
var options = null
var ssrIdKey = 'data-vue-ssr-id'

// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
// tags it will allow on a page
var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\b/.test(navigator.userAgent.toLowerCase())

module.exports = function (parentId, list, _isProduction, _options) {
  isProduction = _isProduction

  options = _options || {}

  var styles = listToStyles(parentId, list)
  addStylesToDom(styles)

  return function update (newList) {
    var mayRemove = []
    for (var i = 0; i < styles.length; i++) {
      var item = styles[i]
      var domStyle = stylesInDom[item.id]
      domStyle.refs--
      mayRemove.push(domStyle)
    }
    if (newList) {
      styles = listToStyles(parentId, newList)
      addStylesToDom(styles)
    } else {
      styles = []
    }
    for (var i = 0; i < mayRemove.length; i++) {
      var domStyle = mayRemove[i]
      if (domStyle.refs === 0) {
        for (var j = 0; j < domStyle.parts.length; j++) {
          domStyle.parts[j]()
        }
        delete stylesInDom[domStyle.id]
      }
    }
  }
}

function addStylesToDom (styles /* Array<StyleObject> */) {
  for (var i = 0; i < styles.length; i++) {
    var item = styles[i]
    var domStyle = stylesInDom[item.id]
    if (domStyle) {
      domStyle.refs++
      for (var j = 0; j < domStyle.parts.length; j++) {
        domStyle.parts[j](item.parts[j])
      }
      for (; j < item.parts.length; j++) {
        domStyle.parts.push(addStyle(item.parts[j]))
      }
      if (domStyle.parts.length > item.parts.length) {
        domStyle.parts.length = item.parts.length
      }
    } else {
      var parts = []
      for (var j = 0; j < item.parts.length; j++) {
        parts.push(addStyle(item.parts[j]))
      }
      stylesInDom[item.id] = { id: item.id, refs: 1, parts: parts }
    }
  }
}

function createStyleElement () {
  var styleElement = document.createElement('style')
  styleElement.type = 'text/css'
  head.appendChild(styleElement)
  return styleElement
}

function addStyle (obj /* StyleObjectPart */) {
  var update, remove
  var styleElement = document.querySelector('style[' + ssrIdKey + '~="' + obj.id + '"]')

  if (styleElement) {
    if (isProduction) {
      // has SSR styles and in production mode.
      // simply do nothing.
      return noop
    } else {
      // has SSR styles but in dev mode.
      // for some reason Chrome can't handle source map in server-rendered
      // style tags - source maps in <style> only works if the style tag is
      // created and inserted dynamically. So we remove the server rendered
      // styles and inject new ones.
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  if (isOldIE) {
    // use singleton mode for IE9.
    var styleIndex = singletonCounter++
    styleElement = singletonElement || (singletonElement = createStyleElement())
    update = applyToSingletonTag.bind(null, styleElement, styleIndex, false)
    remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true)
  } else {
    // use multi-style-tag mode in all other cases
    styleElement = createStyleElement()
    update = applyToTag.bind(null, styleElement)
    remove = function () {
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  update(obj)

  return function updateStyle (newObj /* StyleObjectPart */) {
    if (newObj) {
      if (newObj.css === obj.css &&
          newObj.media === obj.media &&
          newObj.sourceMap === obj.sourceMap) {
        return
      }
      update(obj = newObj)
    } else {
      remove()
    }
  }
}

var replaceText = (function () {
  var textStore = []

  return function (index, replacement) {
    textStore[index] = replacement
    return textStore.filter(Boolean).join('\n')
  }
})()

function applyToSingletonTag (styleElement, index, remove, obj) {
  var css = remove ? '' : obj.css

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = replaceText(index, css)
  } else {
    var cssNode = document.createTextNode(css)
    var childNodes = styleElement.childNodes
    if (childNodes[index]) styleElement.removeChild(childNodes[index])
    if (childNodes.length) {
      styleElement.insertBefore(cssNode, childNodes[index])
    } else {
      styleElement.appendChild(cssNode)
    }
  }
}

function applyToTag (styleElement, obj) {
  var css = obj.css
  var media = obj.media
  var sourceMap = obj.sourceMap

  if (media) {
    styleElement.setAttribute('media', media)
  }
  if (options.ssrId) {
    styleElement.setAttribute(ssrIdKey, obj.id)
  }

  if (sourceMap) {
    // https://developer.chrome.com/devtools/docs/javascript-debugging
    // this makes source maps inside style tags work properly in Chrome
    css += '\n/*# sourceURL=' + sourceMap.sources[0] + ' */'
    // http://stackoverflow.com/a/26603875
    css += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + ' */'
  }

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild)
    }
    styleElement.appendChild(document.createTextNode(css))
  }
}


/***/ }),

/***/ 16:
/***/ (function(module, exports) {

/* globals __VUE_SSR_CONTEXT__ */

// IMPORTANT: Do NOT use ES2015 features in this file.
// This module is a runtime utility for cleaner component module output and will
// be included in the final webpack user bundle.

module.exports = function normalizeComponent (
  rawScriptExports,
  compiledTemplate,
  functionalTemplate,
  injectStyles,
  scopeId,
  moduleIdentifier /* server only */
) {
  var esModule
  var scriptExports = rawScriptExports = rawScriptExports || {}

  // ES6 modules interop
  var type = typeof rawScriptExports.default
  if (type === 'object' || type === 'function') {
    esModule = rawScriptExports
    scriptExports = rawScriptExports.default
  }

  // Vue.extend constructor export interop
  var options = typeof scriptExports === 'function'
    ? scriptExports.options
    : scriptExports

  // render functions
  if (compiledTemplate) {
    options.render = compiledTemplate.render
    options.staticRenderFns = compiledTemplate.staticRenderFns
    options._compiled = true
  }

  // functional template
  if (functionalTemplate) {
    options.functional = true
  }

  // scopedId
  if (scopeId) {
    options._scopeId = scopeId
  }

  var hook
  if (moduleIdentifier) { // server build
    hook = function (context) {
      // 2.3 injection
      context =
        context || // cached call
        (this.$vnode && this.$vnode.ssrContext) || // stateful
        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional
      // 2.2 with runInNewContext: true
      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__
      }
      // inject component styles
      if (injectStyles) {
        injectStyles.call(this, context)
      }
      // register component module identifier for async chunk inferrence
      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier)
      }
    }
    // used by ssr in case component is cached and beforeCreate
    // never gets called
    options._ssrRegister = hook
  } else if (injectStyles) {
    hook = injectStyles
  }

  if (hook) {
    var functional = options.functional
    var existing = functional
      ? options.render
      : options.beforeCreate

    if (!functional) {
      // inject component registration as beforeCreate hook
      options.beforeCreate = existing
        ? [].concat(existing, hook)
        : [hook]
    } else {
      // for template-only hot-reload because in that case the render fn doesn't
      // go through the normalizer
      options._injectStyles = hook
      // register for functioal component in vue file
      options.render = function renderWithStyleInjection (h, context) {
        hook.call(context)
        return existing(h, context)
      }
    }
  }

  return {
    esModule: esModule,
    exports: scriptExports,
    options: options
  }
}


/***/ }),

/***/ 31:
/***/ (function(module, exports) {

/**
 * Translates the list format produced by css-loader into something
 * easier to manipulate.
 */
module.exports = function listToStyles (parentId, list) {
  var styles = []
  var newStyles = {}
  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    var id = item[0]
    var css = item[1]
    var media = item[2]
    var sourceMap = item[3]
    var part = {
      id: parentId + ':' + i,
      css: css,
      media: media,
      sourceMap: sourceMap
    }
    if (!newStyles[id]) {
      styles.push(newStyles[id] = { id: id, parts: [part] })
    } else {
      newStyles[id].parts.push(part)
    }
  }
  return styles
}


/***/ })

/******/ });