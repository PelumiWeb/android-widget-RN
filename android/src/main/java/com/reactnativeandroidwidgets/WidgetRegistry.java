package com.reactnativeandroidwidgets;

import android.content.Context;
import android.content.SharedPreferences;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;

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

    public void registerWidget(WidgetConfig config) {
        widgets.put(config.getName(), config);
        saveWidgets();
    }

    public WidgetConfig getWidget(String name) {
        return widgets.get(name);
    }

    public boolean hasWidget(String name) {
        return widgets.containsKey(name);
    }

    public Map<String, WidgetConfig> getAllWidgets() {
        return new HashMap<>(widgets);
    }

    private void loadWidgets() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_WIDGETS, null);
        if (json != null) {
            Type type = new TypeToken<Map<String, WidgetConfig>>() {}.getType();
            widgets = gson.fromJson(json, type);
        } else {
            widgets = new HashMap<>();
        }
    }

    private void saveWidgets() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_WIDGETS, gson.toJson(widgets)).apply();
    }
}
