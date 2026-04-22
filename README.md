# react-native-android-widgets

Create and manage Android home screen widgets from React Native. Design your widget UI with standard React Native components, or use the lower-level JSON component API — both are supported.

> **Android only.** All API calls are no-ops on iOS.

---

## Installation

```sh
npm install react-native-android-widgets
```

### For the View-based approach (recommended)

Install the peer dependency that handles view capture:

```sh
npm install react-native-view-shot
```

---

## Android setup

### 1. Register the package

In `android/app/src/main/java/.../MainApplication.java`:

```java
import com.reactnativeandroidwidgets.RNAndroidWidgetsPackage;

// inside getPackages():
add(new RNAndroidWidgetsPackage());
```

### 2. Declare the widget receiver

In `android/app/src/main/AndroidManifest.xml` inside `<application>`:

```xml
<receiver
    android:name="com.reactnativeandroidwidgets.RNWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
        <action android:name="com.reactnativeandroidwidgets.WIDGET_CLICK" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_provider_info" />
</receiver>
```

---

## Usage

### Approach 1 — WidgetCanvas (design with React Native Views)

This is the recommended approach. Write your widget UI exactly like any other React Native screen. The `WidgetCanvas` component renders it off-screen, captures a snapshot, and pushes it to the home screen widget automatically.

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import AndroidWidgets, { WidgetCanvas } from 'react-native-android-widgets';

export default function App() {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    // Register the widget type once on mount
    AndroidWidgets.registerWidget({
      name: 'fitness_widget',
      label: 'Fitness Tracker',
      minWidth: 180,
      minHeight: 110,
    });
  }, []);

  return (
    <>
      {/* Your normal app UI */}

      {/*
        WidgetCanvas is invisible to the user.
        It re-captures and updates the widget whenever `steps` changes.
      */}
      <WidgetCanvas
        widgetName="fitness_widget"
        width={320}
        height={160}
        deps={[steps]}
        clickAction="OPEN_APP"
      >
        <View style={{ flex: 1, backgroundColor: '#6200ee', borderRadius: 16, padding: 20 }}>
          <Text style={{ color: 'white', fontSize: 14, opacity: 0.8 }}>Today's steps</Text>
          <Text style={{ color: 'white', fontSize: 48, fontWeight: 'bold' }}>{steps}</Text>
          <Text style={{ color: 'white', fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            Tap to open app
          </Text>
        </View>
      </WidgetCanvas>
    </>
  );
}
```

#### WidgetCanvas props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `widgetName` | `string` | ✓ | The registered widget name |
| `width` | `number` | ✓ | Capture width in pixels |
| `height` | `number` | ✓ | Capture height in pixels |
| `deps` | `any[]` | | Re-capture when any value changes (like `useEffect` deps) |
| `clickAction` | `string` | | Action string fired when user taps the widget |
| `clickData` | `object` | | Extra data forwarded with the tap event |
| `children` | `ReactNode` | ✓ | The View tree to render as the widget |

#### Manual capture

If you need more control over when the capture happens, use `updateWidgetWithView` directly:

```tsx
const viewRef = useRef(null);

// Call this whenever you want to push a new snapshot
await AndroidWidgets.updateWidgetWithView('fitness_widget', viewRef, {
  clickAction: 'OPEN_APP',
  clickData: { screen: 'Dashboard' },
  quality: 0.9, // PNG quality 0.0–1.0
});

<View ref={viewRef} collapsable={false} style={{ width: 320, height: 160 }}>
  {/* widget content */}
</View>
```

Or if you already have a file URI (e.g. from your own capture pipeline):

```ts
await AndroidWidgets.updateWidgetWithBitmap('fitness_widget', 'file:///path/to/image.png', {
  clickAction: 'OPEN_APP',
});
```

---

### Approach 2 — JSON component tree

For simpler widgets, you can describe the UI as a data structure and skip the view capture step entirely. No `react-native-view-shot` required.

```ts
import AndroidWidgets from 'react-native-android-widgets';

await AndroidWidgets.registerWidget({
  name: 'weather_widget',
  label: 'Weather',
  minWidth: 110,
  minHeight: 110,
});

await AndroidWidgets.updateWidget('weather_widget', {
  components: [
    {
      id: 'title',
      type: 'text',
      data: {
        type: 'text',
        text: '24° London',
        textSize: 20,
        textColor: '#ffffff',
        backgroundColor: '#1e88e5',
      },
    },
    {
      id: 'refresh_btn',
      type: 'button',
      data: {
        type: 'button',
        text: 'Refresh',
        action: 'refresh_weather',
        data: { city: 'London' },
      },
    },
  ],
  clickAction: 'open_weather',
  clickData: { city: 'London' },
});
```

#### Supported component types

| `type` | Required `data` fields | Optional fields |
|--------|------------------------|-----------------|
| `text` | `text: string` | `textSize`, `textColor`, `backgroundColor` |
| `image` | `imageUri: string` | `contentDescription` |
| `button` | `text: string`, `action: string` | `data: object` |
| `container` | — | `children: WidgetComponent[]` |

---

## Handling widget taps

Both approaches fire the same click event. Listen for it anywhere in your app:

```ts
import { useEffect } from 'react';
import AndroidWidgets from 'react-native-android-widgets';

useEffect(() => {
  const unsubscribe = AndroidWidgets.onWidgetClick((event) => {
    console.log(event.action); // e.g. "OPEN_APP"
    console.log(event.data);   // the clickData object you passed
    console.log(event.widgetId);

    // Navigate or dispatch based on the action
    if (event.action === 'OPEN_APP') {
      navigation.navigate('Dashboard');
    }
  });

  return unsubscribe;
}, []);
```

---

## Full API reference

### Widget registration

```ts
AndroidWidgets.registerWidget(config: WidgetConfig): Promise<boolean>
```

Call once on app mount before pushing any updates.

```ts
interface WidgetConfig {
  name: string;               // unique identifier used in all other calls
  label: string;              // displayed in the widget picker
  description?: string;
  minWidth: number;           // dp
  minHeight: number;          // dp
  updatePeriodMillis?: number; // system-triggered update interval (min ~30 min)
  resizeMode?: 'none' | 'horizontal' | 'vertical' | 'both';
  widgetCategory?: 'home_screen' | 'keyguard';
}
```

### Pushing updates

```ts
// View-based (WidgetCanvas handles this automatically)
AndroidWidgets.updateWidgetWithView(widgetName, viewRef, options?): Promise<boolean>
AndroidWidgets.updateWidgetWithBitmap(widgetName, imageUri, options?): Promise<boolean>

// JSON component-based
AndroidWidgets.updateWidget(widgetName, data): Promise<boolean>
AndroidWidgets.updateWidgetById(widgetId, data): Promise<boolean>
```

### Querying state

```ts
AndroidWidgets.getWidgetIds(widgetName): Promise<number[]>
AndroidWidgets.hasActiveWidgets(widgetName): Promise<boolean>
AndroidWidgets.requestWidgetUpdate(widgetName): Promise<boolean>
```

### Lifecycle events

```ts
// Returns an unsubscribe function — call it in useEffect cleanup
AndroidWidgets.onWidgetClick(callback): () => void
AndroidWidgets.onWidgetEnabled(widgetName, callback): () => void   // first instance added
AndroidWidgets.onWidgetDisabled(widgetName, callback): () => void  // last instance removed
AndroidWidgets.onWidgetDeleted(callback): () => void               // specific instance removed
```

---

## How to place a widget on the home screen

1. Long-press an empty area on the Android home screen
2. Tap **Widgets**
3. Find **RN Android Widgets** in the list
4. Drag it onto the home screen

Your app's `onWidgetEnabled` event will fire, and the widget will display as soon as you call `updateWidget` or `WidgetCanvas` mounts.

---

## Known limitations

- **Click sub-regions (View approach):** The entire widget surface is one tap target. You cannot attach different actions to individual elements inside the widget when using `WidgetCanvas`. For per-element tap handling, use the JSON component approach with `button` components.
- **Bitmap cache:** When using `WidgetCanvas`, the captured image is stored in the app's cache directory. If the cache is cleared between reboots, the widget will show a blank placeholder until the app launches and `WidgetCanvas` mounts again.
- **Update frequency:** Android enforces a minimum ~30-minute interval for `updatePeriodMillis`. For real-time or user-triggered updates, call `updateWidget` / `updateWidgetWithView` directly from your app code.
- **Remote images (JSON approach):** HTTP image URIs are not fetched automatically. Use bundled drawable resources accessed natively, or switch to the `WidgetCanvas` approach which supports any `<Image>` source React Native supports.

---

## License

MIT
