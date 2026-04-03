package com.reactnativeandroidwidgets;

import android.content.Context;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;
import android.app.PendingIntent;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class WidgetViewBuilder {

    public static RemoteViews buildWidgetView(Context context, int widgetId, JSONObject data) {
        try {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_base);

            if (data.has("components")) {
                JSONArray components = data.getJSONArray("components");
                processComponents(context, views, components, widgetId);
            }

            if (data.has("clickAction")) {
                String action = data.getString("clickAction");
                String clickData = data.has("clickData") ? data.getJSONObject("clickData").toString() : null;
                PendingIntent pendingIntent = RNWidgetProvider.createClickIntent(context, widgetId, action, clickData);
                views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);
            }

            return views;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private static void processComponents(Context context, RemoteViews views,
            JSONArray components, int widgetId) throws JSONException {
        for (int i = 0; i < components.length(); i++) {
            JSONObject component = components.getJSONObject(i);
            String type = component.getString("type");

            switch (type) {
                case "text":
                    processTextComponent(views, component);
                    break;
                case "image":
                    processImageComponent(context, views, component);
                    break;
                case "button":
                    processButtonComponent(context, views, component, widgetId);
                    break;
                case "container":
                    if (component.has("children")) {
                        processComponents(context, views, component.getJSONArray("children"), widgetId);
                    }
                    break;
            }
        }
    }

    private static void processTextComponent(RemoteViews views, JSONObject component) throws JSONException {
        JSONObject data = component.getJSONObject("data");
        String text = data.getString("text");

        views.setViewVisibility(R.id.widget_text, View.VISIBLE);
        views.setTextViewText(R.id.widget_text, text);

        if (data.has("textSize")) {
            views.setTextViewTextSize(R.id.widget_text, android.util.TypedValue.COMPLEX_UNIT_SP, data.getInt("textSize"));
        }
        if (data.has("textColor")) {
            views.setTextColor(R.id.widget_text, parseColor(data.getString("textColor")));
        }
        if (data.has("backgroundColor")) {
            views.setInt(R.id.widget_text, "setBackgroundColor", parseColor(data.getString("backgroundColor")));
        }
    }

    private static void processImageComponent(Context context, RemoteViews views, JSONObject component)
            throws JSONException {
        JSONObject data = component.getJSONObject("data");

        views.setViewVisibility(R.id.widget_image, View.VISIBLE);

        if (data.has("contentDescription")) {
            views.setContentDescription(R.id.widget_image, data.getString("contentDescription"));
        }
        // Note: loading remote image URIs requires a background download + bitmap.
        // For drawable resources use: views.setImageViewResource(R.id.widget_image, resId);
    }

    private static void processButtonComponent(Context context, RemoteViews views,
            JSONObject component, int widgetId) throws JSONException {
        JSONObject data = component.getJSONObject("data");
        String text = data.getString("text");
        String action = data.getString("action");

        views.setViewVisibility(R.id.widget_button, View.VISIBLE);
        views.setTextViewText(R.id.widget_button, text);

        String clickData = data.has("data") ? data.getJSONObject("data").toString() : null;
        PendingIntent pendingIntent = RNWidgetProvider.createClickIntent(context, widgetId, action, clickData);
        views.setOnClickPendingIntent(R.id.widget_button, pendingIntent);
    }

    private static int parseColor(String colorStr) {
        try {
            return Color.parseColor(colorStr);
        } catch (IllegalArgumentException e) {
            return Color.BLACK;
        }
    }
}
