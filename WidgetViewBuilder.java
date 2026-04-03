package com.reactnativeandroidwidgets;

import android.content.Context;
import android.graphics.Color;
import android.widget.RemoteViews;
import android.app.PendingIntent;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Builds RemoteViews from JSON widget data
 */
public class WidgetViewBuilder {

    /**
     * Build a RemoteViews widget from JSON data
     */
    public static RemoteViews buildWidgetView(Context context, int widgetId, JSONObject data) {
        try {
            // Create the base RemoteViews with a simple layout
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_base);

            // Get components array
            if (data.has("components")) {
                JSONArray components = data.getJSONArray("components");
                processComponents(context, views, components, widgetId);
            }

            // Set up click action if provided
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

    /**
     * Process widget components recursively
     */
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
                    // Containers with children can be processed recursively
                    if (component.has("children")) {
                        JSONArray children = component.getJSONArray("children");
                        processComponents(context, views, children, widgetId);
                    }
                    break;
            }
        }
    }

    /**
     * Process text component
     */
    private static void processTextComponent(RemoteViews views, JSONObject component) throws JSONException {
        JSONObject data = component.getJSONObject("data");
        String text = data.getString("text");

        // Set text on the text view
        views.setTextViewText(R.id.widget_text, text);

        // Set text size if provided
        if (data.has("textSize")) {
            int textSize = data.getInt("textSize");
            views.setTextViewTextSize(R.id.widget_text, android.util.TypedValue.COMPLEX_UNIT_SP, textSize);
        }

        // Set text color if provided
        if (data.has("textColor")) {
            String colorStr = data.getString("textColor");
            int color = parseColor(colorStr);
            views.setTextColor(R.id.widget_text, color);
        }

        // Set background color if provided
        if (data.has("backgroundColor")) {
            String colorStr = data.getString("backgroundColor");
            int color = parseColor(colorStr);
            views.setInt(R.id.widget_text, "setBackgroundColor", color);
        }
    }

    /**
     * Process image component
     */
    private static void processImageComponent(Context context, RemoteViews views, JSONObject component)
            throws JSONException {
        JSONObject data = component.getJSONObject("data");
        String imageUri = data.getString("imageUri");

        // For now, we'll need to handle loading images
        // This is a simplified version - you'd need to implement proper image loading
        // from URIs, which might involve downloading and caching

        // Set content description if provided
        if (data.has("contentDescription")) {
            String description = data.getString("contentDescription");
            views.setContentDescription(R.id.widget_image, description);
        }
    }

    /**
     * Process button component
     */
    private static void processButtonComponent(Context context, RemoteViews views,
            JSONObject component, int widgetId) throws JSONException {
        JSONObject data = component.getJSONObject("data");
        String text = data.getString("text");
        String action = data.getString("action");

        // Set button text
        views.setTextViewText(R.id.widget_button, text);

        // Set up click intent
        String clickData = data.has("data") ? data.getJSONObject("data").toString() : null;
        PendingIntent pendingIntent = RNWidgetProvider.createClickIntent(context, widgetId, action, clickData);
        views.setOnClickPendingIntent(R.id.widget_button, pendingIntent);
    }

    /**
     * Parse color string (supports hex colors like #RRGGBB or #AARRGGBB)
     */
    private static int parseColor(String colorStr) {
        try {
            return Color.parseColor(colorStr);
        } catch (IllegalArgumentException e) {
            // Default to black if parsing fails
            return Color.BLACK;
        }
    }
}