#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const GREEN  = '\x1b[32m';
const CYAN   = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';

function log(msg)         { console.log(msg); }
function success(msg)     { console.log(`${GREEN}✔${RESET} ${msg}`); }
function info(msg)        { console.log(`${CYAN}ℹ${RESET} ${msg}`); }
function warn(msg)        { console.log(`${YELLOW}⚠${RESET} ${msg}`); }
function error(msg)       { console.error(`${RED}✖${RESET} ${msg}`); }
function step(n, msg)     { console.log(`\n${BOLD}${n}.${RESET} ${msg}`); }
function code(msg)        { console.log(`   ${CYAN}${msg}${RESET}`); }

// ─── Locate project root (where ios/ lives) ────────────────────────────────
const cwd = process.cwd();
const iosDir = path.join(cwd, 'ios');

if (!fs.existsSync(iosDir)) {
  error('Could not find an "ios/" directory. Run this command from your React Native project root.');
  process.exit(1);
}

// ─── Find widget extension folder (first dir inside ios/ that isn't the main app) ─
const iosContents = fs.readdirSync(iosDir).filter(name => {
  const full = path.join(iosDir, name);
  return fs.statSync(full).isDirectory() &&
    !name.startsWith('.') &&
    !name.endsWith('.xcodeproj') &&
    !name.endsWith('.xcworkspace') &&
    name !== 'Pods';
});

// Guess the widget extension folder — usually the only folder besides the main app
// The main app folder typically matches the project name (no "Widget" suffix)
let widgetFolder = null;
let mainAppFolder = null;

const xcodeproj = fs.readdirSync(iosDir).find(n => n.endsWith('.xcodeproj'));
const projectName = xcodeproj ? xcodeproj.replace('.xcodeproj', '') : null;

for (const dir of iosContents) {
  if (projectName && dir === projectName) {
    mainAppFolder = dir;
  } else if (dir.toLowerCase().includes('widget')) {
    widgetFolder = dir;
  }
}

// Fall back: if no widget folder found, use the first non-main-app folder
if (!widgetFolder) {
  widgetFolder = iosContents.find(d => d !== mainAppFolder) || null;
}

// ─── Source template ────────────────────────────────────────────────────────
const templateSrc = path.join(__dirname, '..', 'widget-template', 'RNWidget.swift');

if (!fs.existsSync(templateSrc)) {
  error('Could not find widget-template/RNWidget.swift inside the package. Try reinstalling the package.');
  process.exit(1);
}

// ─── Copy ───────────────────────────────────────────────────────────────────
let destDir;
let destRelative;

if (widgetFolder) {
  destDir = path.join(iosDir, widgetFolder);
  destRelative = `ios/${widgetFolder}/RNWidget.swift`;
} else {
  // No widget folder found yet — copy to ios/ root as a fallback
  destDir = iosDir;
  destRelative = 'ios/RNWidget.swift';
}

const destPath = path.join(destDir, 'RNWidget.swift');

try {
  fs.copyFileSync(templateSrc, destPath);
} catch (e) {
  error(`Failed to copy template: ${e.message}`);
  process.exit(1);
}

// ─── Output ─────────────────────────────────────────────────────────────────
log('');
log(`${BOLD}react-native-android-widgets — iOS Widget Setup${RESET}`);
log('─'.repeat(50));
success(`Copied RNWidget.swift → ${destRelative}`);

if (!widgetFolder) {
  warn('No Widget Extension folder detected in ios/. Make sure you have created one in Xcode first.');
  warn('Then move RNWidget.swift into that folder and add it to the target (see step 2 below).');
}

log('');
log(`${BOLD}Next steps:${RESET}`);

step(1, 'Open your project in Xcode:');
if (xcodeproj) {
  code(`open ios/${projectName}.xcworkspace`);
} else {
  code('open ios/<YourApp>.xcworkspace');
}

if (!widgetFolder) {
  step(2, 'Create a Widget Extension target if you haven\'t already:');
  log('   File → New → Target → Widget Extension');
  log('   Uncheck "Include Configuration Intent" → Finish');
}

step(widgetFolder ? 2 : 3, `Add RNWidget.swift to your Widget Extension target in Xcode:`);
if (widgetFolder) {
  log(`   • In the Xcode sidebar, find the "${widgetFolder}" folder`);
} else {
  log('   • In the Xcode sidebar, find your Widget Extension folder');
}
log('   • Right-click the folder → "Add Files to ..."');
log(`   • Select ${destRelative}`);
log('   • Check "Copy items if needed" and select ONLY your Widget Extension target');
log('   • Delete the placeholder .swift files Xcode generated (they conflict with @main)');

step(widgetFolder ? 3 : 4, 'Update the two constants at the top of RNWidget.swift:');
code(`private let appGroupId = "group.com.yourapp.widget"  // ← your App Group ID`);
code(`private let widgetName = "my_widget"                 // ← matches registerWidget({ name })`);

step(widgetFolder ? 4 : 5, 'Enable App Groups in Xcode (Signing & Capabilities tab):');
log('   • Main app target → + Capability → App Groups → add "group.com.yourapp.widget"');
log('   • Widget Extension target → same steps, same group ID');

step(widgetFolder ? 5 : 6, 'Configure in JavaScript (call once on app mount):');
code(`AndroidWidgets.configureIOS({ appGroupId: 'group.com.yourapp.widget' });`);

step(widgetFolder ? 6 : 7, 'Install pods and rebuild:');
code('cd ios && pod install');
code('npx react-native run-ios');

log('');
success('Setup complete! Your widget will update whenever WidgetCanvas re-renders.');
log('');
