# react-native-android-widgets

Create and manage home screen widgets from React Native — on both **Android** and **iOS**. Design your widget UI using standard React Native components, just like any other screen in your app.

---

## Installation

```sh
npm install react-native-android-widgets react-native-view-shot
```

---

## iOS Setup

There are **2 steps in Xcode** and **1 command in your terminal**. That's it.

### Step 1 — Create a Widget Extension in Xcode

1. Open your project's `.xcworkspace` file in Xcode
2. Go to **File → New → Target**
3. Choose **Widget Extension** → click **Next**
4. Give it a name (e.g. `MyWidget`), **uncheck** "Include Configuration Intent" → **Finish → Activate**

### Step 2 — Enable App Groups in Xcode

App Groups let your app and the widget share data. You need to enable it on **both** targets.

> **What is an App Group ID?** It's a name you make up yourself. Use your app's bundle ID as a base — e.g. if your bundle ID is `com.yourcompany.myapp`, your App Group ID would be `group.com.yourcompany.myapp.widget`. You can find your bundle ID in Xcode under your main app target → General tab.

**On your main app target:**
1. Click your project name in the Xcode sidebar
2. Select your **main app target** (e.g. `MyApp`)
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability** → search for **App Groups** → double-click it
5. Click **+** and enter your App Group ID (e.g. `group.com.yourcompany.myapp.widget`)

**On your Widget Extension target:**
1. Switch to your **widget target** (e.g. `MyWidget`) in the same tab
2. Click **+ Capability → App Groups**
3. Your group ID will already appear — just **check the box**

### Step 3 — Run the setup command

From your **project root** (not inside `ios/`):

```sh
npx react-native-android-widgets setup-ios
```

The command will ask you 3 questions:

| Question | Example answer |
|----------|---------------|
| Widget Extension target name | `MyWidget` |
| App Group ID | `group.com.yourcompany.myapp.widget` |
| Widget name | `my_widget` |

It will then automatically:
- Copy `RNWidget.swift` into your widget extension folder
- Add it to the correct Xcode target (no drag-and-drop needed)
- Pre-fill the App Group ID and widget name inside the file
- Generate the entitlements file for the extension

### Step 4 — Configure in JavaScript

Call `configureIOS` once when your app mounts, before any widget updates:

```tsx
import AndroidWidgets, { WidgetCanvas } from 'react-native-android-widgets';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // iOS: tell the library which App Group to use
    // Must match the App Group ID you entered during setup
    AndroidWidgets.configureIOS({ appGroupId: 'group.com.yourcompany.myapp.widget' });

    // Register the widget (same on both platforms)
    AndroidWidgets.registerWidget({
      name: 'my_widget',
      label: 'My Widget',
      minWidth: 110,
      minHeight: 110,
    });
  }, []);

  return (
    <>
      {/* Your normal app UI */}

      {/* WidgetCanvas is invisible — it captures the view and sends it to the widget */}
      <WidgetCanvas widgetName="my_widget" width={320} height={160}>
        <View style={{ flex: 1, backgroundColor: '#6200ee', padding: 20 }}>
          <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>
            Hello Widget!
          </Text>
        </View>
      </WidgetCanvas>
    </>
  );
}
```

### Step 5 — Build and run

```sh
cd ios && pod install
npx react-native run-ios
```

To add the widget: long-press the home screen → **+** (top left) → search for your app → add the widget.

---

## Android Setup

### Step 1 — Register the package

In `android/app/src/main/java/.../MainApplication.java`:

```java
import com.reactnativeandroidwidgets.RNAndroidWidgetsPackage;

// inside getPackages():
packages.add(new RNAndroidWidgetsPackage());
```

### Step 2 — Declare the widget receiver

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

### Step 3 — Register and use in JavaScript

```tsx
import AndroidWidgets, { WidgetCanvas } from 'react-native-android-widgets';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    AndroidWidgets.registerWidget({
      name: 'my_widget',
      label: 'My Widget',
      minWidth: 110,
      minHeight: 110,
    });
  }, []);

  return (
    <>
      <WidgetCanvas widgetName="my_widget" width={320} height={160}>
        <View style={{ flex: 1, backgroundColor: '#6200ee', padding: 20 }}>
          <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>
            Hello Widget!
          </Text>
        </View>
      </WidgetCanvas>
    </>
  );
}
```

To add the widget: long-press the home screen → **Widgets** → find your app → drag it onto the screen.

---

## WidgetCanvas props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `widgetName` | `string` | ✓ | Must match the name used in `registerWidget` |
| `width` | `number` | ✓ | Capture width in pixels |
| `height` | `number` | ✓ | Capture height in pixels |
| `deps` | `any[]` | | Re-captures when any value changes (works like `useEffect` deps) |
| `clickAction` | `string` | | Action string fired when user taps the widget |
| `clickData` | `object` | | Extra data forwarded with the tap event |
| `children` | `ReactNode` | ✓ | The View tree to render as the widget |

---

## Handling widget taps

```ts
import { useEffect } from 'react';
import AndroidWidgets from 'react-native-android-widgets';

useEffect(() => {
  const unsubscribe = AndroidWidgets.onWidgetClick((event) => {
    console.log(event.action);   // e.g. "OPEN_APP"
    console.log(event.data);     // the clickData object you passed
    console.log(event.widgetId);

    if (event.action === 'OPEN_APP') {
      navigation.navigate('Dashboard');
    }
  });

  return unsubscribe;
}, []);
```

---

## Full API reference

### Registration

```ts
AndroidWidgets.registerWidget(config: WidgetConfig): Promise<boolean>
AndroidWidgets.configureIOS({ appGroupId: string }): void  // iOS only, call before registerWidget
```

### Pushing updates

```ts
// Recommended — WidgetCanvas handles this automatically
AndroidWidgets.updateWidgetWithView(widgetName, viewRef, options?): Promise<boolean>
AndroidWidgets.updateWidgetWithBitmap(widgetName, imageUri, options?): Promise<boolean>

// Android only — JSON component tree
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
// Each returns an unsubscribe function — use it in useEffect cleanup
AndroidWidgets.onWidgetClick(callback): () => void
AndroidWidgets.onWidgetEnabled(widgetName, callback): () => void
AndroidWidgets.onWidgetDisabled(widgetName, callback): () => void
AndroidWidgets.onWidgetDeleted(callback): () => void
```

---

## Known limitations

- **Click sub-regions:** When using `WidgetCanvas`, the entire widget is one tap target. For per-element tap handling on Android, use the JSON component approach with `button` types instead.
- **iOS widget refresh:** iOS widgets only refresh when your app is open and `WidgetCanvas` is mounted. Background refresh is controlled by WidgetKit, not by this library.
- **Bitmap cache (Android):** The captured image is stored in the app's cache. If the cache is cleared, the widget shows a blank placeholder until the app relaunches.
- **Update frequency (Android):** The system enforces a minimum ~30-minute interval for automatic updates. Call `updateWidgetWithView` directly for real-time updates.

---

## License

MIT
