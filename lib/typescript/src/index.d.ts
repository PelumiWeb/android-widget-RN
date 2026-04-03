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
declare class AndroidWidgets {
    private listeners;
    registerWidget(config: WidgetConfig): Promise<boolean>;
    updateWidget(widgetName: string, data: WidgetData): Promise<boolean>;
    updateWidgetById(widgetId: number, data: WidgetData): Promise<boolean>;
    getWidgetIds(widgetName: string): Promise<number[]>;
    hasActiveWidgets(widgetName: string): Promise<boolean>;
    requestWidgetUpdate(widgetName: string): Promise<boolean>;
    onWidgetClick(callback: (event: WidgetClickEvent) => void): () => void;
    onWidgetEnabled(widgetName: string, callback: () => void): () => void;
    onWidgetDisabled(widgetName: string, callback: () => void): () => void;
    onWidgetDeleted(callback: (widgetId: number) => void): () => void;
    removeAllListeners(): void;
}
declare const _default: AndroidWidgets;
export default _default;
//# sourceMappingURL=index.d.ts.map