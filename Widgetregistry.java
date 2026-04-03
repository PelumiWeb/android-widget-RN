package com.reactnativeandroidwidgets;

import android.content.Context;
import android.content.SharedPreferences;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;

/**
 * Registry for managing widget configurations
 */
public class WidgetRegistry {
    private static final String PREFS_NAME = "RNWidgetRegistry";
    private static final String KEY_WIDGETS = "widgets";

    private static WidgetRegistry instance;
    private final Context context;
    private final Gson gson;
    private Map<String, WidgetConfig> widgets;

    private WidgetRegistry(Context context) {
        this.context = context.getApplicationContext();
        this.gson = new Gson();
        loadWidgets();
    }

    public static synchronized WidgetRegistry getInstance(Context context) {
        if (instance == null) {
            instance = new WidgetRegistry(context);
        }
        return instance;
    }

    /**
     * Register a new widget configuration
     */
    public void registerWidget(WidgetConfig config) {
        widgets.put(config.getName(), config);
        saveWidgets();
    }

    /**
     * Get widget configuration by name
     */
    public WidgetConfig getWidget(String name) {
        return widgets.get(name);
    }

    /**
     * Check if widget is registered
     */
    public boolean hasWidget(String name) {
        return widgets.containsKey(name);
    }

    /**
     * Get all registered widgets
     */
    public Map<String, WidgetConfig> getAllWidgets() {
        return new HashMap<>(widgets);
    }

    /**
     * Load widgets from SharedPreferences
     */
    private void loadWidgets() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_WIDGETS, null);

        if (json != null) {
            Type type = new TypeToken<Map<String, WidgetConfig>>() {
            }.getType();
            widgets = gson.fromJson(json, type);
        } else {
            widgets = new HashMap<>();
        }
    }

    /**
     * Save widgets to SharedPreferences
     */
    private void saveWidgets() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = gson.toJson(widgets);
        prefs.edit().putString(KEY_WIDGETS, json).apply();
    }
}