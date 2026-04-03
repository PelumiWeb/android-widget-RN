# react-native-android-widgets

Android home screen widgets for React Native. Define widget layouts in JavaScript and push updates from your app.

> **Android only.** All API calls are no-ops on iOS.

## Installation

```sh
npm install react-native-android-widgets
```

### Android setup

1. **Register the package** in `android/app/src/main/java/.../MainApplication.java` (or `.kt`):

```java
import com.reactnativeandroidwidgets.RNAndroidWidgetsPackage;

// inside getPackages():
packages.add(new RNAndroidWidgetsPackage());
```

2. **Declare the widget receiver** in your app's `android/app/src/main/AndroidManifest.xml` inside `<application>`:

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

3. **Copy the widget resource files** from `node_modules/react-native-android-widgets/android/src/main/res/` into your app's `android/app/src/main/res/`. You need:
   - `layout/widget_base.xml`, `layout/widget_default.xml`, `layout/widget_error.xml`
   - `drawable/widget_background.xml`
   - `xml/widget_provider_info.xml`
   - `values/strings.xml` (merge with your existing strings)

## Usage

```ts
import AndroidWidgets from 'react-native-android-widgets';
import type { WidgetData } from 'react-native-android-widgets';

// 1. Register your widget type once (e.g. in App.tsx on mount)
await AndroidWidgets.registerWidget({
  name: 'myWidget',
  label: 'My Widget',
  minWidth: 110,
  minHeight: 110,
});

// 2. Push content to all active instances of 'myWidget'
const data: WidgetData = {
  components: [
    {
      id: 'title',
      type: 'text',
      data: {
        type: 'text',
        text: 'Hello from React Native!',
        textSize: 18,
        textColor: '#000000',
      },
    },
    {
      id: 'btn',
      type: 'button',
      data: {
        type: 'button',
        text: 'Open App',
        action: 'open_app',
        data: { screen: 'Home' },
      },
    },
  ],
  // Optional: make the entire widget clickable
  clickAction: 'widget_tapped',
  clickData: { source: 'widget' },
};

await AndroidWidgets.updateWidget('myWidget', data);
```

### Handling clicks

```ts
import { useEffect } from 'react';
import AndroidWidgets from 'react-native-android-widgets';

useEffect(() => {
  const unsubscribe = AndroidWidgets.onWidgetClick((event) => {
    console.log('Widget clicked:', event.action, event.data);
    // Navigate or dispatch actions based on event.action
  });
  return unsubscribe;
}, []);
```

### Other API

```ts
// Update a specific widget instance by its system ID
await AndroidWidgets.updateWidgetById(widgetId, data);

// Get all active system IDs for a named widget type
const ids = await AndroidWidgets.getWidgetIds('myWidget');

// Check whether any instances of a widget are on the home screen
const active = await AndroidWidgets.hasActiveWidgets('myWidget');

// Force the system to re-call onUpdate for all instances
await AndroidWidgets.requestWidgetUpdate('myWidget');

// Lifecycle listeners (each returns an unsubscribe function)
AndroidWidgets.onWidgetEnabled('myWidget', () => { /* first instance added */ });
AndroidWidgets.onWidgetDisabled('myWidget', () => { /* last instance removed */ });
AndroidWidgets.onWidgetDeleted((widgetId) => { /* specific instance removed */ });
```

## Component types

| type | required `data` fields | optional fields |
|------|------------------------|-----------------|
| `text` | `text: string` | `textSize`, `textColor`, `backgroundColor` |
| `image` | `imageUri: string` | `contentDescription` |
| `button` | `text: string`, `action: string` | `data: object` |
| `container` | — | `children: WidgetComponent[]` |

## Local testing (before publishing to npm)

```sh
# In this package directory — build the JS outputs first
npm install
npm run prepare

# Pack to a tarball
npm pack
# produces react-native-android-widgets-1.0.0.tgz

# In your test React Native app
npm install /path/to/react-native-android-widgets-1.0.0.tgz
```

Then build and run:

```sh
npx react-native run-android
```

Long-press on the home screen → Widgets → find "RN Android Widgets", place it, then call `updateWidget` from your app.

## Known limitations

- **Image URIs**: Remote HTTP images are not loaded automatically. To display an image, use a bundled drawable resource accessed natively.
- **Multiple widget types**: All widget types share one `RNWidgetProvider`. Newly placed widgets are claimed by the first `updateWidget` call that targets them. Subclass `RNWidgetProvider` per type if you need true isolation.
- **Background update interval**: Android enforces a minimum ~30-minute interval for `updatePeriodMillis`. For more frequent updates call `updateWidget` / `requestWidgetUpdate` directly from your app.

## License

MIT
