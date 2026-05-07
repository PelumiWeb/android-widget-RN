import React, { useRef, useEffect } from "react";
import { AppRegistry, NativeModules, NativeEventEmitter, Platform, View, StyleSheet } from "react-native";

const { RNAndroidWidgets } = NativeModules;

if (Platform.OS === "android" && !RNAndroidWidgets) {
  throw new Error(
    "RNAndroidWidgets native module is not available. Make sure you have linked the library correctly and rebuilt the app."
  );
}

const eventEmitter =
  Platform.OS === "android" ? new NativeEventEmitter(RNAndroidWidgets) : null;

export interface WidgetLayout {
  width: "small" | "medium" | "large" | "expand";
  height: "small" | "medium" | "large" | "expand";
}

export interface TextWidgetData {
  type: "text";
  text: string;
  textSize?: number;
  textColor?: string;
  backgroundColor?: string;
}

export interface ImageWidgetData {
  type: "image";
  imageUri: string;
  contentDescription?: string;
}

export interface ButtonWidgetData {
  type: "button";
  text: string;
  action: string;
  data?: Record<string, any>;
}

export interface ClockWidgetData {
  type: "clock";
  /** java.text.SimpleDateFormat pattern for 12-hour clocks, e.g. "hh:mm a". Defaults to "hh:mm a". */
  format12?: string;
  /** java.text.SimpleDateFormat pattern for 24-hour clocks, e.g. "HH:mm". Defaults to "HH:mm". */
  format24?: string;
  textSize?: number;
  textColor?: string;
  backgroundColor?: string;
}

export interface WidgetComponent {
  id: string;
  type: "text" | "image" | "button" | "container" | "clock";
  data: TextWidgetData | ImageWidgetData | ButtonWidgetData | ClockWidgetData | any;
  children?: WidgetComponent[];
  style?: {
    padding?: number;
    margin?: number;
    backgroundColor?: string;
  };
}

export interface WidgetConfig {
  name: string;
  label: string;
  description?: string;
  minWidth: number;
  minHeight: number;
  previewImage?: string;
  updatePeriodMillis?: number;
  resizeMode?: "none" | "horizontal" | "vertical" | "both";
  widgetCategory?: "home_screen" | "keyguard";
}

export interface WidgetData {
  components: WidgetComponent[];
  clickAction?: string;
  clickData?: Record<string, any>;
}

export interface WidgetClickEvent {
  widgetId: number;
  action: string;
  data?: Record<string, any>;
}

export interface BitmapWidgetOptions {
  clickAction?: string;
  clickData?: Record<string, any>;
  /** PNG capture quality 0.0–1.0; defaults to 1.0 */
  quality?: number;
}

export interface IOSWidgetOptions {
  appGroupId: string;
}

export interface WidgetCanvasProps {
  widgetName: string;
  width: number;
  height: number;
  clickAction?: string;
  clickData?: Record<string, any>;
  /** Re-capture and push a new bitmap whenever any value in this array changes */
  deps?: React.DependencyList;
  /**
   * Re-capture and push a new bitmap every N milliseconds while mounted and foregrounded.
   * Useful for clock widgets or live-data widgets. Has no effect when the app is backgrounded.
   * Minimum recommended value: 1000 (1 second).
   */
  refreshInterval?: number;
  children: React.ReactNode;
}

class AndroidWidgets {
  private listeners: Map<string, any> = new Map();
  private iosAppGroupId: string | null = null;

  configureIOS(options: IOSWidgetOptions): void {
    this.iosAppGroupId = options.appGroupId;
  }

  async registerWidget(config: WidgetConfig): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.registerWidget(config);
    } catch (error) {
      console.error("Failed to register widget:", error);
      return false;
    }
  }

  async updateWidget(widgetName: string, data: WidgetData): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.updateWidget(widgetName, data);
    } catch (error) {
      console.error("Failed to update widget:", error);
      return false;
    }
  }
  //

  async updateWidgetById(
    widgetId: number,
    data: WidgetData
  ): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.updateWidgetById(widgetId, data);
    } catch (error) {
      console.error("Failed to update widget by ID:", error);
      return false;
    }
  }

  async getWidgetIds(widgetName: string): Promise<number[]> {
    if (Platform.OS !== "android") return [];
    try {
      return await RNAndroidWidgets.getWidgetIds(widgetName);
    } catch (error) {
      console.error("Failed to get widget IDs:", error);
      return [];
    }
  }

  async hasActiveWidgets(widgetName: string): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.hasActiveWidgets(widgetName);
    } catch (error) {
      console.error("Failed to check active widgets:", error);
      return false;
    }
  }

  async requestWidgetUpdate(widgetName: string): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.requestWidgetUpdate(widgetName);
    } catch (error) {
      console.error("Failed to request widget update:", error);
      return false;
    }
  }

  async updateWidgetWithView(
    widgetName: string,
    viewRef: React.RefObject<any>,
    options: BitmapWidgetOptions = {}
  ): Promise<boolean> {
    if (Platform.OS !== "android" && Platform.OS !== "ios") return false;
    let captureRef: (ref: any, opts: any) => Promise<string>;
    try {
      captureRef = require("react-native-view-shot").captureRef;
    } catch {
      console.error(
        "[AndroidWidgets] react-native-view-shot is not installed. " +
          "Run: npm install react-native-view-shot"
      );
      return false;
    }
    if (!viewRef.current) {
      console.error("[AndroidWidgets] updateWidgetWithView: viewRef.current is null");
      return false;
    }
    try {
      const uri: string = await captureRef(viewRef.current, {
        format: "png",
        quality: options.quality ?? 1.0,
        result: "tmpfile",
      });
      return this.updateWidgetWithBitmap(widgetName, uri, options);
    } catch (error) {
      console.error("[AndroidWidgets] Failed to capture view:", error);
      return false;
    }
  }

  async updateWidgetWithBitmap(
    widgetName: string,
    imageUri: string,
    options: BitmapWidgetOptions = {}
  ): Promise<boolean> {
    const clickData = options.clickData
      ? JSON.stringify(options.clickData)
      : null;

    if (Platform.OS === "ios") {
      if (!this.iosAppGroupId) {
        console.error(
          "[AndroidWidgets] Call AndroidWidgets.configureIOS({ appGroupId }) before updating widgets on iOS."
        );
        return false;
      }
      try {
        return await RNAndroidWidgets.updateWidgetWithBitmap(
          widgetName,
          imageUri,
          this.iosAppGroupId,
          options.clickAction ?? "",
          clickData
        );
      } catch (error) {
        console.error("[AndroidWidgets] iOS widget update failed:", error);
        return false;
      }
    }

    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.updateWidgetWithBitmap(
        widgetName,
        imageUri,
        options.clickAction ?? "",
        clickData
      );
    } catch (error) {
      console.error("[AndroidWidgets] Failed to update widget with bitmap:", error);
      return false;
    }
  }

  onWidgetClick(callback: (event: WidgetClickEvent) => void): () => void {
    if (!eventEmitter) return () => {};
    const subscription = eventEmitter.addListener("onWidgetClick", callback);
    const listenerId = Date.now().toString();
    this.listeners.set(listenerId, subscription);
    return () => {
      subscription.remove();
      this.listeners.delete(listenerId);
    };
  }

  onWidgetEnabled(widgetName: string, callback: () => void): () => void {
    if (!eventEmitter) return () => {};
    const subscription = eventEmitter.addListener(
      `onWidgetEnabled_${widgetName}`,
      callback
    );
    const listenerId = Date.now().toString();
    this.listeners.set(listenerId, subscription);
    return () => {
      subscription.remove();
      this.listeners.delete(listenerId);
    };
  }

  onWidgetDisabled(widgetName: string, callback: () => void): () => void {
    if (!eventEmitter) return () => {};
    const subscription = eventEmitter.addListener(
      `onWidgetDisabled_${widgetName}`,
      callback
    );
    const listenerId = Date.now().toString();
    this.listeners.set(listenerId, subscription);
    return () => {
      subscription.remove();
      this.listeners.delete(listenerId);
    };
  }

  onWidgetDeleted(callback: (widgetId: number) => void): () => void {
    if (!eventEmitter) return () => {};
    const subscription = eventEmitter.addListener(
      "onWidgetDeleted",
      callback
    );
    const listenerId = Date.now().toString();
    this.listeners.set(listenerId, subscription);
    return () => {
      subscription.remove();
      this.listeners.delete(listenerId);
    };
  }

  removeAllListeners(): void {
    this.listeners.forEach((subscription) => subscription.remove());
    this.listeners.clear();
  }

  /**
   * Register a JS function to run when the Android background fetch fires.
   * Call this once at app startup (e.g. in index.js, before AppRegistry.registerComponent).
   *
   * The handler receives `{ widgetName: string }` and should fetch data,
   * then call `AndroidWidgets.updateWidget()` or `updateWidgetWithBitmap()`.
   *
   * Example:
   *   AndroidWidgets.registerBackgroundHandler(async ({ widgetName }) => {
   *     const data = await fetch('https://api.example.com/data').then(r => r.json());
   *     await AndroidWidgets.updateWidget(widgetName, { components: [...] });
   *   });
   */
  registerBackgroundHandler(
    handler: (taskData: { widgetName: string }) => Promise<void>
  ): void {
    if (Platform.OS !== "android") return;
    AppRegistry.registerHeadlessTask("RNWidgetBackgroundFetch", () => handler);
  }

  async scheduleBackgroundFetch(
    widgetName: string,
    intervalMinutes: number
  ): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.scheduleBackgroundFetch(
        widgetName,
        intervalMinutes
      );
    } catch (error) {
      console.error("Failed to schedule background fetch:", error);
      return false;
    }
  }

  async cancelBackgroundFetch(widgetName: string): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    try {
      return await RNAndroidWidgets.cancelBackgroundFetch(widgetName);
    } catch (error) {
      console.error("Failed to cancel background fetch:", error);
      return false;
    }
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
  refreshInterval,
  children,
}: WidgetCanvasProps) {
  const viewRef = useRef<View>(null);

  useEffect(() => {
    // Defer one frame so the native layout pass completes before capture.
    const timer = setTimeout(() => {
      androidWidgets.updateWidgetWithView(widgetName, viewRef, {
        clickAction,
        clickData,
      });
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetName, clickAction, ...deps]);

  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    const id = setInterval(() => {
      androidWidgets.updateWidgetWithView(widgetName, viewRef, {
        clickAction,
        clickData,
      });
    }, refreshInterval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetName, clickAction, refreshInterval]);

  return (
    <View
      ref={viewRef}
      collapsable={false}
      style={[styles.offscreen, { width, height }]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: "absolute",
    opacity: 0,
    top: -10000,
    left: -10000,
  },
});
