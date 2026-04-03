import { NativeModules, NativeEventEmitter } from "react-native";

const { RNAndroidWidgets } = NativeModules;

if (!RNAndroidWidgets) {
  throw new Error(
    "RNAndroidWidgets native module is not available. Make sure you have linked the library correctly."
  );
}

const eventEmitter = new NativeEventEmitter(RNAndroidWidgets);


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

/**
 * Widget click event
 */
export interface WidgetClickEvent {
  widgetId: number;
  action: string;
  data?: Record<string, any>;
}

/**
 * Main Android Widgets API
 */
class AndroidWidgets {
  private listeners: Map<string, any> = new Map();

  /**
   * Register a widget provider
   */
  async registerWidget(config: WidgetConfig): Promise<boolean> {
    try {
      return await RNAndroidWidgets.registerWidget(config);
    } catch (error) {
      console.error("Failed to register widget:", error);
      return false;
    }
  }

  /**
   * Update widget data
   */
  async updateWidget(widgetName: string, data: WidgetData): Promise<boolean> {
    try {
      return await RNAndroidWidgets.updateWidget(widgetName, data);
    } catch (error) {
      console.error("Failed to update widget:", error);
      return false;
    }
  }

  /**
   * Update a specific widget instance by ID
   */
  async updateWidgetById(widgetId: number, data: WidgetData): Promise<boolean> {
    try {
      return await RNAndroidWidgets.updateWidgetById(widgetId, data);
    } catch (error) {
      console.error("Failed to update widget by ID:", error);
      return false;
    }
  }

  /**
   * Get all active widget IDs for a given widget name
   */
  async getWidgetIds(widgetName: string): Promise<number[]> {
    try {
      return await RNAndroidWidgets.getWidgetIds(widgetName);
    } catch (error) {
      console.error("Failed to get widget IDs:", error);
      return [];
    }
  }

  /**
   * Check if any widgets are active
   */
  async hasActiveWidgets(widgetName: string): Promise<boolean> {
    try {
      return await RNAndroidWidgets.hasActiveWidgets(widgetName);
    } catch (error) {
      console.error("Failed to check active widgets:", error);
      return false;
    }
  }

  /**
   * Request widget update from the system
   */
  async requestWidgetUpdate(widgetName: string): Promise<boolean> {
    try {
      return await RNAndroidWidgets.requestWidgetUpdate(widgetName);
    } catch (error) {
      console.error("Failed to request widget update:", error);
      return false;
    }
  }

  /**
   * Listen for widget click events
   */
  onWidgetClick(callback: (event: WidgetClickEvent) => void): () => void {
    const subscription = eventEmitter.addListener("onWidgetClick", callback);
    const listenerId = Date.now().toString();
    this.listeners.set(listenerId, subscription);

    return () => {
      subscription.remove();
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Listen for widget enabled events
   */
  onWidgetEnabled(widgetName: string, callback: () => void): () => void {
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

  /**
   * Listen for widget disabled events
   */
  onWidgetDisabled(widgetName: string, callback: () => void): () => void {
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

  /**
   * Listen for widget deleted events
   */
  onWidgetDeleted(callback: (widgetId: number) => void): () => void {
    const subscription = eventEmitter.addListener("onWidgetDeleted", callback);
    const listenerId = Date.now().toString();
    this.listeners.set(listenerId, subscription);

    return () => {
      subscription.remove();
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.forEach((subscription) => subscription.remove());
    this.listeners.clear();
  }
}

export default new AndroidWidgets();
