import React, { useRef, useEffect } from "react";
import { NativeModules, NativeEventEmitter, Platform, View, StyleSheet } from "react-native";
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
  async updateWidgetWithView(widgetName, viewRef, options = {}) {
    if (Platform.OS !== "android") return false;
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
    if (Platform.OS !== "android") return false;
    try {
      const clickData = options.clickData ? JSON.stringify(options.clickData) : null;
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
export default androidWidgets;

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
export function WidgetCanvas({
  widgetName,
  width,
  height,
  clickAction,
  clickData,
  deps = [],
  children
}) {
  const viewRef = useRef(null);
  useEffect(() => {
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
  return /*#__PURE__*/React.createElement(View, {
    ref: viewRef,
    collapsable: false,
    style: [styles.offscreen, {
      width,
      height
    }]
  }, children);
}
const styles = StyleSheet.create({
  offscreen: {
    position: "absolute",
    opacity: 0,
    top: -10000,
    left: -10000
  }
});
//# sourceMappingURL=index.js.map