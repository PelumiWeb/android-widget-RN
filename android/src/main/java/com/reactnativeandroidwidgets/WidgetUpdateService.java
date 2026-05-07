package com.reactnativeandroidwidgets;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.Nullable;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

public class WidgetUpdateService extends HeadlessJsTaskService {
    @Override
    protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        Bundle extras = intent.getExtras();
        if (extras == null) return null;
        WritableMap data = Arguments.fromBundle(extras);
        return new HeadlessJsTaskConfig(
            "RNWidgetBackgroundFetch",
            data,
            10_000,
            true
        );
    }
}
