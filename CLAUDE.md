# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **react-native-android-widgets**, an npm library that bridges React Native (JavaScript) with native Android AppWidget APIs to create and manage Android home screen widgets.

## Commands

### JavaScript/TypeScript
```bash
# Build the library (generates CommonJS, ESM, and TypeScript declaration outputs)
npm run prepare

# Type-check TypeScript
npm run typescript

# Lint
npm run lint

# Run tests
npm test
```

### Android
```bash
# Build Android AAR from the root of an integrating app
./gradlew :react-native-android-widgets:assembleRelease
```

## Architecture

### Layers

The library has two distinct layers that communicate via React Native's native module bridge:

**TypeScript layer (`index.tsx`)** — Public API surface. Exports `AndroidWidgets` (singleton class) with promise-based methods and an `NativeEventEmitter` for lifecycle events. Also exports all TypeScript interfaces (`WidgetConfig`, `WidgetData`, `WidgetComponent`, etc.).

**Java/Android layer** — Implements the native side:

| File | Role |
|------|------|
| `RNAndroidWidgetsPackage.java` | React Native package registration entry point |
| `RNAndroidWidgetsModule.java` | Bridge: exposes `@ReactMethod`s callable from JS, emits events back via `RCTDeviceEventEmitter` |
| `RNWidgetProvider.java` | `AppWidgetProvider` subclass — handles widget lifecycle (`onUpdate`, `onDeleted`, `onEnabled`, `onDisabled`) and click intents |
| `WidgetViewBuilder.java` | Converts the JSON component tree from JS into Android `RemoteViews` — the rendering engine |
| `WidgetRegistry.java` | Singleton; persists widget *type* configurations in SharedPreferences using Gson |
| `WidgetDataStore.java` | Persists per-widget-instance state (by `appWidgetId`) in SharedPreferences |
| `WidgetConfig.java` | POJO data model for widget type configuration |

### Data flow

```
JS (AndroidWidgets class)
  → Native bridge (RNAndroidWidgetsModule)
    → WidgetRegistry (config) / WidgetDataStore (instance data)
    → RNWidgetProvider.updateWidget()
      → WidgetViewBuilder (JSON → RemoteViews)
        → Android home screen display
```

Click events travel the reverse path: a `PendingIntent` fires → `RNWidgetProvider.onReceive()` → `RCTDeviceEventEmitter` → JS `onWidgetClick` listener.

### Widget component model

Widget UI is described as a recursive JSON tree using `WidgetComponent` nodes with types: `text`, `image`, `button`, `container`. `WidgetViewBuilder` processes this tree recursively onto the base layout (`widget_base.xml`) which contains pre-defined view IDs: `widget_container`, `widget_text`, `widget_image`, `widget_button`.

### Persistence

Both `WidgetRegistry` and `WidgetDataStore` use Android `SharedPreferences` with Gson serialization. `WidgetDataStore` keys widget content under `data_<appWidgetId>` and widget type names under `name_<appWidgetId>`.

### Android build config

- **Package namespace:** `com.reactnativeandroidwidgets`
- **Min SDK:** 21, **Target/Compile SDK:** 33
- **Key deps:** `androidx.work:work-runtime:2.8.1`, `com.google.code.gson:gson:2.10.1`

### npm package outputs

Built with `react-native-builder-bob`, producing three targets configured in `package.json`:
- `lib/commonjs` — CJS for Node
- `lib/module` — ESM
- `lib/typescript` — type declarations
