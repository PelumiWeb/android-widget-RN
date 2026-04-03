package com.reactnativeandroidwidgets;

/**
 * Configuration object for a widget
 */
public class WidgetConfig {
    private String name;
    private String label;
    private String description;
    private int minWidth;
    private int minHeight;
    private int updatePeriodMillis;
    private String previewImage;
    private String resizeMode;
    private String widgetCategory;

    public WidgetConfig(String name, String label, String description,
            int minWidth, int minHeight, int updatePeriodMillis) {
        this.name = name;
        this.label = label;
        this.description = description;
        this.minWidth = minWidth;
        this.minHeight = minHeight;
        this.updatePeriodMillis = updatePeriodMillis;
        this.resizeMode = "both";
        this.widgetCategory = "home_screen";
    }

    // Getters
    public String getName() {
        return name;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }

    public int getMinWidth() {
        return minWidth;
    }

    public int getMinHeight() {
        return minHeight;
    }

    public int getUpdatePeriodMillis() {
        return updatePeriodMillis;
    }

    public String getPreviewImage() {
        return previewImage;
    }

    public String getResizeMode() {
        return resizeMode;
    }

    public String getWidgetCategory() {
        return widgetCategory;
    }

    // Setters
    public void setPreviewImage(String previewImage) {
        this.previewImage = previewImage;
    }

    public void setResizeMode(String resizeMode) {
        this.resizeMode = resizeMode;
    }

    public void setWidgetCategory(String widgetCategory) {
        this.widgetCategory = widgetCategory;
    }
}