"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
const {
  RNAndroidWidgets
} = _reactNative.NativeModules;
if (_reactNative.Platform.OS === "android" && !RNAndroidWidgets) {
  throw new Error("RNAndroidWidgets native module is not available. Make sure you have linked the library correctly and rebuilt the app.");
}
const eventEmitter = _reactNative.Platform.OS === "android" ? new _reactNative.NativeEventEmitter(RNAndroidWidgets) : null;
class AndroidWidgets {
  listeners = new Map();
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
var _default = exports.default = new AndroidWidgets();
//# sourceMappingURL=index.js.map