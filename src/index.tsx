import { NativeModules, NativeEventEmitter, Platform } from "react-native";

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

export interface WidgetComponent {
  id: string;
  type: "text" | "image" | "button" | "container";
  data: TextWidgetData | ImageWidgetData | ButtonWidgetData | any;
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

class AndroidWidgets {
  private listeners: Map<string, any> = new Map();

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
}

export default new AndroidWidgets();
