"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WidgetCanvas = WidgetCanvas;
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const {
  RNAndroidWidgets
} = _reactNative.NativeModules;
if (_reactNative.Platform.OS === "android" && !RNAndroidWidgets) {
  throw new Error("RNAndroidWidgets native module is not available. Make sure you have linked the library correctly and rebuilt the app.");
}
const eventEmitter = _reactNative.Platform.OS === "android" ? new _reactNative.NativeEventEmitter(RNAndroidWidgets) : null;
class AndroidWidgets {
  listeners = new Map();
  iosAppGroupId = null;
  configureIOS(options) {
    this.iosAppGroupId = options.appGroupId;
  }
  async registerWidget(config) {
    if (_reactNative.Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.registerWidget(config);
    } catch (error) {
      console.error("Failed to register widget:", error);
      return false;
    }
  }
  async updateWidget(widgetName, data) {
    if (_reactNative.Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.updateWidget(widgetName, data);
    } catch (error) {
      console.error("Failed to update widget:", error);
      return false;
    }
  }
  async updateWidgetById(widgetId, data) {
    if (_reactNative.Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.updateWidgetById(widgetId, data);
    } catch (error) {
      console.error("Failed to update widget by ID:", error);
      return false;
    }
  }
  async getWidgetIds(widgetName) {
    if (_reactNative.Platform.OS !== "android") return [];
    try {
      return await RNAndroidWidgets.getWidgetIds(widgetName);
    } catch (error) {
      console.error("Failed to get widget IDs:", error);
      return [];
    }
  }
  async hasActiveWidgets(widgetName) {
    if (_reactNative.Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.hasActiveWidgets(widgetName);
    } catch (error) {
      console.error("Failed to check active widgets:", error);
      return false;
    }
  }
  async requestWidgetUpdate(widgetName) {
    if (_reactNative.Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.requestWidgetUpdate(widgetName);
    } catch (error) {
      console.error("Failed to request widget update:", error);
      return false;
    }
  }
  async updateWidgetWithView(widgetName, viewRef, options = {}) {
    if (_reactNative.Platform.OS !== "android" && _reactNative.Platform.OS !== "ios") return false;
    let captureRef;
    try {
      captureRef = require("react-native-view-shot").captureRef;
    } catch {
      console.error("[AndroidWidgets] react-native-view-shot is not installed. " + "Run: npm install react-native-view-shot");
      return false;
    }
    if (!viewRef.current) {
      console.error("[AndroidWidgets] updateWidgetWithView: viewRef.current is null");
      return false;
    }
    try {
      const uri = await captureRef(viewRef.current, {
        format: "png",
        quality: options.quality ?? 1.0,
        result: "tmpfile"
      });
      return this.updateWidgetWithBitmap(widgetName, uri, options);
    } catch (error) {
      console.error("[AndroidWidgets] Failed to capture view:", error);
      return false;
    }
  }
  async updateWidgetWithBitmap(widgetName, imageUri, options = {}) {
    const clickData = options.clickData ? JSON.stringify(options.clickData) : null;
    if (_reactNative.Platform.OS === "ios") {
      if (!this.iosAppGroupId) {
        console.error("[AndroidWidgets] Call AndroidWidgets.configureIOS({ appGroupId }) before updating widgets on iOS.");
        return false;
      }
      try {
        return await RNAndroidWidgets.updateWidgetWithBitmap(widgetName, imageUri, this.iosAppGroupId, options.clickAction ?? "", clickData);
      } catch (error) {
        console.error("[AndroidWidgets] iOS widget update failed:", error);
        return false;
      }
    }
    if (_reactNative.Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.updateWidgetWithBitmap(widgetName, imageUri, options.clickAction ?? "", clickData);
    } catch (error) {
      console.error("[AndroidWidgets] Failed to update widget with bitmap:", error);
      return false;
    }
  }
  onWidgetClick(callback) {
    if (!eventEmitter) return () => {};
    const subscription = eventEmitter.addListener("onWidgetClick", callback);
    const listenerId = Date.now().toString();
    this.listeners.set(listenerId, subscription);
    return () => {
      subscription.remove();
      this.listeners.delete(listenerId);
    };
  }
  onWidgetEnabled(widgetName, callback) {
    if (!eventEmitter) return () => {};
    const subscription = eventEmitter.addListener(`onWidgetEnabled_${widgetName}`, callback);
    const listenerId = Date.now().toString();
    this.listeners.set(listenerId, subscription);
    return () => {
      subscription.remove();
      this.listeners.delete(listenerId);
    };
  }
  onWidgetDisabled(widgetName, callback) {
    if (!eventEmitter) return () => {};
    const subscription = eventEmitter.addListener(`onWidgetDisabled_${widgetName}`, callback);
    const listenerId = Date.now().toString();
    this.listeners.set(listenerId, subscription);
    return () => {
      subscription.remove();
      this.listeners.delete(listenerId);
    };
  }
  onWidgetDeleted(callback) {
    if (!eventEmitter) return () => {};
    const subscription = eventEmitter.addListener("onWidgetDeleted", callback);
    const listenerId = Date.now().toString();
    this.listeners.set(listenerId, subscription);
    return () => {
      subscription.remove();
      this.listeners.delete(listenerId);
    };
  }
  removeAllListeners() {
    this.listeners.forEach(subscription => subscription.remove());
    this.listeners.clear();
  }
}
const androidWidgets = new AndroidWidgets();
var _default = exports.default = androidWidgets;
/**
 * Renders children off-screen and automatically pushes a bitmap snapshot
 * to the named Android widget on mount and whenever `deps` changes.
 *
 * Place this anywhere in your app tree. It is invisible to the user
 * (position: absolute, opacity: 0, off-screen coordinates) but fully
 * laid out so react-native-view-shot can capture it.
 *
 * Example:
 *   <WidgetCanvas widgetName="my_widget" width={320} height={160} deps={[count]}>
 *     <View style={{ flex: 1, backgroundColor: 'blue' }}>
 *       <Text style={{ color: 'white', fontSize: 32 }}>{count}</Text>
 *     </View>
 *   </WidgetCanvas>
 */
function WidgetCanvas({
  widgetName,
  width,
  height,
  clickAction,
  clickData,
  deps = [],
  children
}) {
  const viewRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(() => {
    // Defer one frame so the native layout pass completes before capture.
    const timer = setTimeout(() => {
      androidWidgets.updateWidgetWithView(widgetName, viewRef, {
        clickAction,
        clickData
      });
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetName, clickAction, ...deps]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    ref: viewRef,
    collapsable: false,
    style: [styles.offscreen, {
      width,
      height
    }]
  }, children);
}
const styles = _reactNative.StyleSheet.create({
  offscreen: {
    position: "absolute",
    opacity: 0,
    top: -10000,
    left: -10000
  }
});
//# sourceMappingURL=index.js.map