import { NativeModules, NativeEventEmitter, Platform } from "react-native";
const {
  RNAndroidWidgets
} = NativeModules;
if (Platform.OS === "android" && !RNAndroidWidgets) {
  throw new Error("RNAndroidWidgets native module is not available. Make sure you have linked the library correctly and rebuilt the app.");
}
const eventEmitter = Platform.OS === "android" ? new NativeEventEmitter(RNAndroidWidgets) : null;
class AndroidWidgets {
  listeners = new Map();
  async registerWidget(config) {
    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.registerWidget(config);
    } catch (error) {
      console.error("Failed to register widget:", error);
      return false;
    }
  }
  async updateWidget(widgetName, data) {
    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.updateWidget(widgetName, data);
    } catch (error) {
      console.error("Failed to update widget:", error);
      return false;
    }
  }
  async updateWidgetById(widgetId, data) {
    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.updateWidgetById(widgetId, data);
    } catch (error) {
      console.error("Failed to update widget by ID:", error);
      return false;
    }
  }
  async getWidgetIds(widgetName) {
    if (Platform.OS !== "android") return [];
    try {
      return await RNAndroidWidgets.getWidgetIds(widgetName);
    } catch (error) {
      console.error("Failed to get widget IDs:", error);
      return [];
    }
  }
  async hasActiveWidgets(widgetName) {
    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.hasActiveWidgets(widgetName);
    } catch (error) {
      console.error("Failed to check active widgets:", error);
      return false;
    }
  }
  async requestWidgetUpdate(widgetName) {
    if (Platform.OS !== "android") return false;
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
export default new AndroidWidgets();
//# sourceMappingURL=index.js.map