package com.reactnativeandroidwidgets;

import android.content.Context;
import android.content.SharedPreferences;

public class WidgetDataStore {
    private static final String PREFS_NAME = "RNWidgetData";
    private static final String KEY_DATA_PREFIX = "data_";
    private static final String KEY_NAME_PREFIX = "name_";

    public static void saveWidgetData(Context context, int widgetId, String jsonData) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_DATA_PREFIX + widgetId, jsonData).apply();
    }

    public static String getWidgetData(Context context, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_DATA_PREFIX + widgetId, null);
    }

    public static void deleteWidgetData(Context context, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .remove(KEY_DATA_PREFIX + widgetId)
                .remove(KEY_NAME_PREFIX + widgetId)
                .apply();
    }

    public static void saveWidgetName(Context context, int widgetId, String widgetName) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_NAME_PREFIX + widgetId, widgetName).apply();
    }

    public static String getWidgetName(Context context, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_NAME_PREFIX + widgetId, null);
    }

    public static boolean hasWidgetData(Context context, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.contains(KEY_DATA_PREFIX + widgetId);
    }
}
