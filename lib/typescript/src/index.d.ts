import React from "react";
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
export interface BitmapWidgetOptions {
    clickAction?: string;
    clickData?: Record<string, any>;
    /** PNG capture quality 0.0–1.0; defaults to 1.0 */
    quality?: number;
}
export interface WidgetCanvasProps {
    widgetName: string;
    width: number;
    height: number;
    clickAction?: string;
    clickData?: Record<string, any>;
    /** Re-capture and push a new bitmap whenever any value in this array changes */
    deps?: React.DependencyList;
    children: React.ReactNode;
}
declare class AndroidWidgets {
    private listeners;
    registerWidget(config: WidgetConfig): Promise<boolean>;
    updateWidget(widgetName: string, data: WidgetData): Promise<boolean>;
    updateWidgetById(widgetId: number, data: WidgetData): Promise<boolean>;
    getWidgetIds(widgetName: string): Promise<number[]>;
    hasActiveWidgets(widgetName: string): Promise<boolean>;
    requestWidgetUpdate(widgetName: string): Promise<boolean>;
    updateWidgetWithView(widgetName: string, viewRef: React.RefObject<any>, options?: BitmapWidgetOptions): Promise<boolean>;
    updateWidgetWithBitmap(widgetName: string, imageUri: string, options?: BitmapWidgetOptions): Promise<boolean>;
    onWidgetClick(callback: (event: WidgetClickEvent) => void): () => void;
    onWidgetEnabled(widgetName: string, callback: () => void): () => void;
    onWidgetDisabled(widgetName: string, callback: () => void): () => void;
    onWidgetDeleted(callback: (widgetId: number) => void): () => void;
    removeAllListeners(): void;
}
declare const androidWidgets: AndroidWidgets;
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
export declare function WidgetCanvas({ widgetName, width, height, clickAction, clickData, deps, children, }: WidgetCanvasProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map