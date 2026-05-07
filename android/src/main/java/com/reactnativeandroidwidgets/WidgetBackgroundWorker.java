package com.reactnativeandroidwidgets;

import android.content.Context;
import android.content.Intent;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

public class WidgetBackgroundWorker extends Worker {
    public static final String KEY_WIDGET_NAME = "widgetName";

    public WidgetBackgroundWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        String widgetName = getInputData().getString(KEY_WIDGET_NAME);
        if (widgetName == null) return Result.failure();

        Intent intent = new Intent(getApplicationContext(), WidgetUpdateService.class);
        intent.putExtra(KEY_WIDGET_NAME, widgetName);
        getApplicationContext().startService(intent);
        return Result.success();
    }
}
