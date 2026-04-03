package com.reactnativeandroidwidgets;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.gson.Gson;

import java.util.HashMap;
import java.util.Map;

public class RNAndroidWidgetsModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "RNAndroidWidgets";
    private final ReactApplicationContext reactContext;
    private final WidgetRegistry widgetRegistry;
    private final Gson gson;

    public RNAndroidWidgetsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.widgetRegistry = WidgetRegistry.getInstance(reactContext);
        this.gson = new Gson();
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("MODULE_NAME", MODULE_NAME);
        return constants;
    }

    /**
     * Register a widget with its configuration
     */
    @ReactMethod
    public void registerWidget(ReadableMap config, Promise promise) {
        try {
            String name = config.getString("name");
            String label = config.getString("label");
            String description = config.hasKey("description") ? config.getString("description") : "";
            int minWidth = config.getInt("minWidth");
            int minHeight = config.getInt("minHeight");
            int updatePeriod = config.hasKey("updatePeriodMillis")
                    ? config.getInt("updatePeriodMillis")
                    : 1800000; // 30 minutes default

            WidgetConfig widgetConfig = new WidgetConfig(
                    name, label, description, minWidth, minHeight, updatePeriod);

            widgetRegistry.registerWidget(widgetConfig);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("REGISTER_ERROR", "Failed to register widget: " + e.getMessage(), e);
        }
    }

    /**
     * Update widget by name - updates all instances of this widget type
     */
    @ReactMethod
    public void updateWidget(String widgetName, ReadableMap data, Promise promise) {
        try {
            WidgetConfig config = widgetRegistry.getWidget(widgetName);
            if (config == null) {
                promise.reject("WIDGET_NOT_FOUND", "Widget not registered: " + widgetName);
                return;
            }

            // Convert ReadableMap to JSON string for easier handling
            String jsonData = convertReadableMapToJson(data);

            // Get all widget IDs for this widget type
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(reactContext);
            ComponentName provider = new ComponentName(reactContext, RNWidgetProvider.class);
            int[] widgetIds = appWidgetManager.getAppWidgetIds(provider);

            // Update all widgets with this name
            boolean updated = false;
            for (int widgetId : widgetIds) {
                String storedName = WidgetDataStore.getWidgetName(reactContext, widgetId);
                if (widgetName.equals(storedName)) {
                    WidgetDataStore.saveWidgetData(reactContext, widgetId, jsonData);
                    RNWidgetProvider.updateWidget(reactContext, appWidgetManager, widgetId, jsonData);
                    updated = true;
                }
            }

            promise.resolve(updated);
        } catch (Exception e) {
            promise.reject("UPDATE_ERROR", "Failed to update widget: " + e.getMessage(), e);
        }
    }

    /**
     * Update a specific widget by its ID
     */
    @ReactMethod
    public void updateWidgetById(int widgetId, ReadableMap data, Promise promise) {
        try {
            String jsonData = convertReadableMapToJson(data);
            WidgetDataStore.saveWidgetData(reactContext, widgetId, jsonData);

            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(reactContext);
            RNWidgetProvider.updateWidget(reactContext, appWidgetManager, widgetId, jsonData);

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("UPDATE_ERROR", "Failed to update widget: " + e.getMessage(), e);
        }
    }

    /**
     * Get all widget IDs for a given widget name
     */
    @ReactMethod
    public void getWidgetIds(String widgetName, Promise promise) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(reactContext);
            ComponentName provider = new ComponentName(reactContext, RNWidgetProvider.class);
            int[] allWidgetIds = appWidgetManager.getAppWidgetIds(provider);

            WritableArray widgetIds = Arguments.createArray();
            for (int widgetId : allWidgetIds) {
                String storedName = WidgetDataStore.getWidgetName(reactContext, widgetId);
                if (widgetName.equals(storedName)) {
                    widgetIds.pushInt(widgetId);
                }
            }

            promise.resolve(widgetIds);
        } catch (Exception e) {
            promise.reject("GET_IDS_ERROR", "Failed to get widget IDs: " + e.getMessage(), e);
        }
    }

    /**
     * Check if any widgets are active
     */
    @ReactMethod
    public void hasActiveWidgets(String widgetName, Promise promise) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(reactContext);
            ComponentName provider = new ComponentName(reactContext, RNWidgetProvider.class);
            int[] widgetIds = appWidgetManager.getAppWidgetIds(provider);

            boolean hasActive = false;
            for (int widgetId : widgetIds) {
                String storedName = WidgetDataStore.getWidgetName(reactContext, widgetId);
                if (widgetName.equals(storedName)) {
                    hasActive = true;
                    break;
                }
            }

            promise.resolve(hasActive);
        } catch (Exception e) {
            promise.reject("CHECK_ERROR", "Failed to check active widgets: " + e.getMessage(), e);
        }
    }

    /**
     * Request widget update from the system
     */
    @ReactMethod
    public void requestWidgetUpdate(String widgetName, Promise promise) {
        try {
            Intent intent = new Intent(reactContext, RNWidgetProvider.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);

            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(reactContext);
            ComponentName provider = new ComponentName(reactContext, RNWidgetProvider.class);
            int[] widgetIds = appWidgetManager.getAppWidgetIds(provider);

            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds);
            reactContext.sendBroadcast(intent);

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("UPDATE_REQUEST_ERROR", "Failed to request update: " + e.getMessage(), e);
        }
    }

    /**
     * Send events to JavaScript
     */
    public static void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        }
    }

    /**
     * Helper method to convert ReadableMap to JSON string
     */
    private String convertReadableMapToJson(ReadableMap readableMap) {
        Map<String, Object> map = readableMap.toHashMap();
        return gson.toJson(map);
    }
}