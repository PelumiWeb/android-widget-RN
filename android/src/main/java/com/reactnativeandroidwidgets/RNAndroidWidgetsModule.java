package com.reactnativeandroidwidgets;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
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

    // Static reference so RNWidgetProvider can emit events even when called
    // outside the React lifecycle (e.g. from AppWidgetProvider callbacks).
    private static ReactApplicationContext staticReactContext;

    private final ReactApplicationContext reactContext;
    private final WidgetRegistry widgetRegistry;
    private final Gson gson;

    public RNAndroidWidgetsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        staticReactContext = reactContext;
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

    // Required by NativeEventEmitter on React Native >= 0.65
    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(int count) {}

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
                    : 1800000;

            WidgetConfig widgetConfig = new WidgetConfig(
                    name, label, description, minWidth, minHeight, updatePeriod);

            widgetRegistry.registerWidget(widgetConfig);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("REGISTER_ERROR", "Failed to register widget: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void updateWidget(String widgetName, ReadableMap data, Promise promise) {
        try {
            WidgetConfig config = widgetRegistry.getWidget(widgetName);
            if (config == null) {
                promise.reject("WIDGET_NOT_FOUND", "Widget not registered: " + widgetName);
                return;
            }

            String jsonData = convertReadableMapToJson(data);

            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(reactContext);
            ComponentName provider = new ComponentName(reactContext, RNWidgetProvider.class);
            int[] widgetIds = appWidgetManager.getAppWidgetIds(provider);

            boolean updated = false;
            for (int widgetId : widgetIds) {
                String storedName = WidgetDataStore.getWidgetName(reactContext, widgetId);
                // Claim unclaimed widgets and update matching ones
                if (storedName == null || widgetName.equals(storedName)) {
                    WidgetDataStore.saveWidgetName(reactContext, widgetId, widgetName);
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

    @ReactMethod
    public void requestWidgetUpdate(String widgetName, Promise promise) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(reactContext);
            ComponentName provider = new ComponentName(reactContext, RNWidgetProvider.class);
            int[] widgetIds = appWidgetManager.getAppWidgetIds(provider);

            Intent intent = new Intent(reactContext, RNWidgetProvider.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds);
            reactContext.sendBroadcast(intent);

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("UPDATE_REQUEST_ERROR", "Failed to request update: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void updateWidgetWithBitmap(String widgetName, String imageUri,
            String clickAction, String clickData, Promise promise) {
        try {
            WidgetConfig config = widgetRegistry.getWidget(widgetName);
            if (config == null) {
                promise.reject("WIDGET_NOT_FOUND", "Widget not registered: " + widgetName);
                return;
            }

            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(reactContext);
            ComponentName provider = new ComponentName(reactContext, RNWidgetProvider.class);
            int[] widgetIds = appWidgetManager.getAppWidgetIds(provider);

            boolean updated = false;
            for (int widgetId : widgetIds) {
                String storedName = WidgetDataStore.getWidgetName(reactContext, widgetId);
                if (storedName == null || widgetName.equals(storedName)) {
                    WidgetDataStore.saveWidgetName(reactContext, widgetId, widgetName);

                    org.json.JSONObject rec = new org.json.JSONObject();
                    rec.put("type", "bitmap");
                    rec.put("imageUri", imageUri);
                    if (clickAction != null && !clickAction.isEmpty()) rec.put("clickAction", clickAction);
                    if (clickData != null) rec.put("clickData", clickData);
                    WidgetDataStore.saveWidgetData(reactContext, widgetId, rec.toString());

                    RemoteViews views = WidgetViewBuilder.buildBitmapWidget(
                            reactContext, widgetId, imageUri, clickAction, clickData, 800_000);
                    if (views != null) {
                        appWidgetManager.updateAppWidget(widgetId, views);
                        updated = true;
                    }
                }
            }

            promise.resolve(updated);
        } catch (Exception e) {
            promise.reject("BITMAP_UPDATE_ERROR", "Failed to update bitmap widget: " + e.getMessage(), e);
        }
    }

    public static void sendEvent(String eventName, @Nullable WritableMap params) {
        if (staticReactContext != null && staticReactContext.hasActiveCatalystInstance()) {
            staticReactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        }
    }

    private String convertReadableMapToJson(ReadableMap readableMap) {
        Map<String, Object> map = readableMap.toHashMap();
        return gson.toJson(map);
    }
}
