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
declare class AndroidWidgets {
    private listeners;
    /**
     * Register a widget provider
     */
    registerWidget(config: WidgetConfig): Promise<boolean>;
    /**
     * Update widget data
     */
    updateWidget(widgetName: string, data: WidgetData): Promise<boolean>;
    /**
     * Update a specific widget instance by ID
     */
    updateWidgetById(widgetId: number, data: WidgetData): Promise<boolean>;
    /**
     * Get all active widget IDs for a given widget name
     */
    getWidgetIds(widgetName: string): Promise<number[]>;
    /**
     * Check if any widgets are active
     */
    hasActiveWidgets(widgetName: string): Promise<boolean>;
    /**
     * Request widget update from the system
     */
    requestWidgetUpdate(widgetName: string): Promise<boolean>;
    /**
     * Listen for widget click events
     */
    onWidgetClick(callback: (event: WidgetClickEvent) => void): () => void;
    /**
     * Listen for widget enabled events
     */
    onWidgetEnabled(widgetName: string, callback: () => void): () => void;
    /**
     * Listen for widget disabled events
     */
    onWidgetDisabled(widgetName: string, callback: () => void): () => void;
    /**
     * Listen for widget deleted events
     */
    onWidgetDeleted(callback: (widgetId: number) => void): () => void;
    /**
     * Remove all listeners
     */
    removeAllListeners(): void;
}
declare const _default: AndroidWidgets;
export default _default;
//# sourceMappingURL=index.d.ts.map