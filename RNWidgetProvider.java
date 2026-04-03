package com.reactnativeandroidwidgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.app.PendingIntent;
import android.widget.RemoteViews;
import android.os.Bundle;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONObject;
import org.json.JSONArray;

/**
 * Base AppWidgetProvider for React Native widgets
 */
public class RNWidgetProvider extends AppWidgetProvider {
    private static final String ACTION_WIDGET_CLICK = "com.reactnativeandroidwidgets.WIDGET_CLICK";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Update each widget
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        // Clean up widget data
        for (int appWidgetId : appWidgetIds) {
            WidgetDataStore.deleteWidgetData(context, appWidgetId);

            // Notify JavaScript
            if (context instanceof ReactContext) {
                WritableMap params = Arguments.createMap();
                params.putInt("widgetId", appWidgetId);
                RNAndroidWidgetsModule.sendEvent((ReactContext) context, "onWidgetDeleted", params);
            }
        }
    }

    @Override
    public void onEnabled(Context context) {
        // First widget added - notify JS if possible
        super.onEnabled(context);
    }

    @Override
    public void onDisabled(Context context) {
        // Last widget removed - notify JS if possible
        super.onDisabled(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent.getAction();
        if (ACTION_WIDGET_CLICK.equals(action)) {
            handleWidgetClick(context, intent);
        }
    }

    /**
     * Update a single widget
     */
    private void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        String widgetData = WidgetDataStore.getWidgetData(context, appWidgetId);

        if (widgetData != null) {
            updateWidget(context, appWidgetManager, appWidgetId, widgetData);
        } else {
            // Create default view if no data
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_default);
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    /**
     * Public static method to update widget from module
     */
    public static void updateWidget(Context context, AppWidgetManager appWidgetManager,
            int appWidgetId, String jsonData) {
        try {
            JSONObject data = new JSONObject(jsonData);
            RemoteViews views = WidgetViewBuilder.buildWidgetView(context, appWidgetId, data);

            if (views != null) {
                appWidgetManager.updateAppWidget(appWidgetId, views);
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Fall back to error view
            RemoteViews errorView = new RemoteViews(context.getPackageName(), R.layout.widget_error);
            errorView.setTextViewText(R.id.error_text, "Error: " + e.getMessage());
            appWidgetManager.updateAppWidget(appWidgetId, errorView);
        }
    }

    /**
     * Handle widget click events
     */
    private void handleWidgetClick(Context context, Intent intent) {
        int widgetId = intent.getIntExtra("widgetId", -1);
        String action = intent.getStringExtra("action");
        String data = intent.getStringExtra("data");

        if (context instanceof ReactContext) {
            WritableMap params = Arguments.createMap();
            params.putInt("widgetId", widgetId);
            params.putString("action", action);

            if (data != null) {
                try {
                    JSONObject jsonData = new JSONObject(data);
                    params.putMap("data", convertJsonToMap(jsonData));
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            RNAndroidWidgetsModule.sendEvent((ReactContext) context, "onWidgetClick", params);
        }
    }

    /**
     * Helper to convert JSONObject to WritableMap
     */
    private static WritableMap convertJsonToMap(JSONObject jsonObject) {
        WritableMap map = Arguments.createMap();

        try {
            java.util.Iterator<String> iterator = jsonObject.keys();
            while (iterator.hasNext()) {
                String key = iterator.next();
                Object value = jsonObject.get(key);

                if (value instanceof JSONObject) {
                    map.putMap(key, convertJsonToMap((JSONObject) value));
                } else if (value instanceof JSONArray) {
                    map.putArray(key, convertJsonToArray((JSONArray) value));
                } else if (value instanceof Boolean) {
                    map.putBoolean(key, (Boolean) value);
                } else if (value instanceof Integer) {
                    map.putInt(key, (Integer) value);
                } else if (value instanceof Double) {
                    map.putDouble(key, (Double) value);
                } else if (value instanceof String) {
                    map.putString(key, (String) value);
                } else {
                    map.putString(key, value.toString());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return map;
    }

    private static com.facebook.react.bridge.WritableArray convertJsonToArray(JSONArray jsonArray) {
        com.facebook.react.bridge.WritableArray array = Arguments.createArray();

        try {
            for (int i = 0; i < jsonArray.length(); i++) {
                Object value = jsonArray.get(i);

                if (value instanceof JSONObject) {
                    array.pushMap(convertJsonToMap((JSONObject) value));
                } else if (value instanceof JSONArray) {
                    array.pushArray(convertJsonToArray((JSONArray) value));
                } else if (value instanceof Boolean) {
                    array.pushBoolean((Boolean) value);
                } else if (value instanceof Integer) {
                    array.pushInt((Integer) value);
                } else if (value instanceof Double) {
                    array.pushDouble((Double) value);
                } else if (value instanceof String) {
                    array.pushString((String) value);
                } else {
                    array.pushString(value.toString());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return array;
    }

    /**
     * Create a pending intent for widget clicks
     */
    public static PendingIntent createClickIntent(Context context, int widgetId, String action, String data) {
        Intent intent = new Intent(context, RNWidgetProvider.class);
        intent.setAction(ACTION_WIDGET_CLICK);
        intent.putExtra("widgetId", widgetId);
        intent.putExtra("action", action);
        if (data != null) {
            intent.putExtra("data", data);
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, widgetId, intent, flags);
    }
}