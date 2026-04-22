import Foundation
import React
import WidgetKit

@objc(RNAndroidWidgets)
class RNAndroidWidgetsModule: NSObject {

  @objc
  func updateWidgetWithBitmap(
    _ widgetName: String,
    imageUri: String,
    appGroupId: String,
    clickAction: String?,
    clickData: String?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let containerURL = FileManager.default.containerURL(
      forSecurityApplicationGroupIdentifier: appGroupId
    ) else {
      reject(
        "APP_GROUP_ERROR",
        "Could not access App Group: \(appGroupId). Make sure it is configured in your Xcode entitlements.",
        nil
      )
      return
    }

    let path = imageUri.hasPrefix("file://")
      ? String(imageUri.dropFirst(7))
      : imageUri
    let sourceURL = URL(fileURLWithPath: path)
    let destinationURL = containerURL.appendingPathComponent("widget_\(widgetName).png")

    do {
      if FileManager.default.fileExists(atPath: destinationURL.path) {
        try FileManager.default.removeItem(at: destinationURL)
      }
      try FileManager.default.copyItem(at: sourceURL, to: destinationURL)
      WidgetCenter.shared.reloadAllTimelines()
      resolve(true)
    } catch {
      reject(
        "WIDGET_UPDATE_ERROR",
        "Failed to save widget image: \(error.localizedDescription)",
        error
      )
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { return false }
}
