package com.reactnativeandroidwidgets;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Store for persisting widget data and state
 */
public class WidgetDataStore {
    private static final String PREFS_NAME = "RNWidgetData";
    private static final String KEY_DATA_PREFIX = "data_";
    private static final String KEY_NAME_PREFIX = "name_";

    /**
     * Save widget data
     */
    public static void saveWidgetData(Context context, int widgetId, String jsonData) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_DATA_PREFIX + widgetId, jsonData).apply();
    }

    /**
     * Get widget data
     */
    public static String getWidgetData(Context context, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_DATA_PREFIX + widgetId, null);
    }

    /**
     * Delete widget data
     */
    public static void deleteWidgetData(Context context, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .remove(KEY_DATA_PREFIX + widgetId)
                .remove(KEY_NAME_PREFIX + widgetId)
                .apply();
    }

    /**
     * Save widget name (for filtering widgets by type)
     */
    public static void saveWidgetName(Context context, int widgetId, String widgetName) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_NAME_PREFIX + widgetId, widgetName).apply();
    }

    /**
     * Get widget name
     */
    public static String getWidgetName(Context context, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_NAME_PREFIX + widgetId, null);
    }

    /**
     * Check if widget has data
     */
    public static boolean hasWidgetData(Context context, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.contains(KEY_DATA_PREFIX + widgetId);
    }
}