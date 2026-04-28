#!/usr/bin/env node

'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');
const xcode    = require('xcode');

// ─── Colours ────────────────────────────────────────────────────────────────
const R = '\x1b[0m', BOLD = '\x1b[1m', GREEN = '\x1b[32m',
      CYAN = '\x1b[36m', YELLOW = '\x1b[33m', RED = '\x1b[31m', DIM = '\x1b[2m';

const ok    = msg => console.log(`${GREEN}✔${R} ${msg}`);
const info  = msg => console.log(`${CYAN}ℹ${R} ${msg}`);
const warn  = msg => console.log(`${YELLOW}⚠${R} ${msg}`);
const fail  = msg => { console.error(`${RED}✖${R} ${msg}`); process.exit(1); };
const step  = (n, msg) => console.log(`\n${BOLD}Step ${n}${R} — ${msg}`);
const hint  = msg => console.log(`  ${DIM}${msg}${R}`);
const code  = msg => console.log(`  ${CYAN}${msg}${R}`);

// ─── Helpers ────────────────────────────────────────────────────────────────
function ask(rl, question, fallback) {
  return new Promise(resolve => {
    const display = fallback ? `${question} ${DIM}(${fallback})${R}: ` : `${question}: `;
    rl.question(display, answer => resolve(answer.trim() || fallback || ''));
  });
}

function findXcodeproj(iosDir) {
  return fs.readdirSync(iosDir).find(f => f.endsWith('.xcodeproj'));
}

function findWidgetTargets(iosDir, projectName) {
  return fs.readdirSync(iosDir).filter(name => {
    const full = path.join(iosDir, name);
    return fs.statSync(full).isDirectory()
      && !name.startsWith('.')
      && !name.endsWith('.xcodeproj')
      && !name.endsWith('.xcworkspace')
      && name !== 'Pods'
      && name !== projectName;
  });
}

function suggestAppGroup(iosDir, projectName) {
  // Try to read bundle ID from main pbxproj
  try {
    const pbxPath = path.join(iosDir, `${projectName}.xcodeproj`, 'project.pbxproj');
    const content = fs.readFileSync(pbxPath, 'utf8');
    const match = content.match(/PRODUCT_BUNDLE_IDENTIFIER\s*=\s*([\w.]+);/);
    if (match) return `group.${match[1]}.widget`;
  } catch {}
  return 'group.com.yourapp.widget';
}

function addFileToXcodeTarget(iosDir, projectName, targetName, swiftFileName) {
  const pbxPath = path.join(iosDir, `${projectName}.xcodeproj`, 'project.pbxproj');
  const project = xcode.project(pbxPath);
  project.parseSync();

  // Find the widget extension target UUID
  const targets = project.pbxNativeTargetSection();
  let targetUuid = null;
  for (const [uuid, target] of Object.entries(targets)) {
    if (target && target.name === targetName) {
      targetUuid = uuid;
      break;
    }
  }

  if (!targetUuid) {
    warn(`Could not find target "${targetName}" in Xcode project. You may need to add RNWidget.swift to the target manually.`);
    return false;
  }

  // Add the swift file to the target
  const filePath = `${targetName}/${swiftFileName}`;
  project.addSourceFile(filePath, { target: targetUuid }, targetUuid);
  fs.writeFileSync(pbxPath, project.writeSync());
  return true;
}

function writeEntitlements(iosDir, targetName, appGroupId) {
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>com.apple.security.application-groups</key>
\t<array>
\t\t<string>${appGroupId}</string>
\t</array>
</dict>
</plist>
`;
  const dir = path.join(iosDir, targetName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${targetName}.entitlements`);
  fs.writeFileSync(filePath, content);
  return `ios/${targetName}/${targetName}.entitlements`;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${BOLD}react-native-android-widgets — iOS Setup${R}`);
  console.log('─'.repeat(45));

  const cwd = process.cwd();
  const iosDir = path.join(cwd, 'ios');
  if (!fs.existsSync(iosDir)) fail('No "ios/" folder found. Run this from your React Native project root.');

  const xcodeproj = findXcodeproj(iosDir);
  if (!xcodeproj) fail('No .xcodeproj found inside ios/.');
  const projectName = xcodeproj.replace('.xcodeproj', '');

  const candidates = findWidgetTargets(iosDir, projectName);
  const suggestedTarget = candidates.find(d => d.toLowerCase().includes('widget')) || candidates[0];
  const suggestedGroup  = suggestAppGroup(iosDir, projectName);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(`\n${DIM}Answer a few questions and setup will handle the rest.${R}\n`);

  const targetName  = await ask(rl, 'Widget Extension target name (from Xcode)', suggestedTarget || 'MyWidget');
  const appGroupId  = await ask(rl, 'App Group ID', suggestedGroup);
  const widgetName  = await ask(rl, 'Widget name (must match registerWidget name)', 'my_widget');

  rl.close();
  console.log('');

  // 1. Copy RNWidget.swift
  const templateSrc = path.join(__dirname, '..', 'widget-template', 'RNWidget.swift');
  if (!fs.existsSync(templateSrc)) fail('widget-template/RNWidget.swift not found. Reinstall the package.');

  const targetDir = path.join(iosDir, targetName);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const destPath = path.join(targetDir, 'RNWidget.swift');

  let content = fs.readFileSync(templateSrc, 'utf8');
  content = content
    .replace(/private let appGroupId\s*=\s*"[^"]*"/, `private let appGroupId = "${appGroupId}"`)
    .replace(/private let widgetName\s*=\s*"[^"]*"/, `private let widgetName = "${widgetName}"`);
  fs.writeFileSync(destPath, content);
  ok(`Copied RNWidget.swift → ios/${targetName}/RNWidget.swift (constants pre-filled)`);

  // 2. Add to Xcode project
  const added = addFileToXcodeTarget(iosDir, projectName, targetName, 'RNWidget.swift');
  if (added) ok(`Added RNWidget.swift to "${targetName}" target in Xcode project`);

  // 3. Write entitlements file for widget extension
  const entPath = writeEntitlements(iosDir, targetName, appGroupId);
  ok(`Created entitlements file → ${entPath}`);

  // 4. Print remaining steps
  console.log(`\n${BOLD}Almost done! Two manual steps left in Xcode:${R}`);

  step(1, 'Enable App Groups on your main app target');
  hint(`Open Xcode → select "${projectName}" target`);
  hint('Signing & Capabilities → + Capability → App Groups');
  hint(`Add: ${CYAN}${appGroupId}${R}`);

  step(2, 'Enable App Groups on the Widget Extension target');
  hint(`Select "${targetName}" target → same steps`);
  hint(`Use the exact same ID: ${CYAN}${appGroupId}${R}`);

  console.log(`\n${BOLD}Then in your app (once on mount):${R}`);
  code(`AndroidWidgets.configureIOS({ appGroupId: '${appGroupId}' });`);
  code(`AndroidWidgets.registerWidget({ name: '${widgetName}', label: 'My Widget', minWidth: 110, minHeight: 110 });`);

  console.log(`\n${BOLD}Finally, rebuild:${R}`);
  code('cd ios && pod install');
  code('npx react-native run-ios');

  console.log('');
  ok('Setup complete!');
  console.log('');
}

main().catch(e => fail(e.message));
