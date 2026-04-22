#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNAndroidWidgets, NSObject)

RCT_EXTERN_METHOD(
  updateWidgetWithBitmap:(NSString *)widgetName
  imageUri:(NSString *)imageUri
  appGroupId:(NSString *)appGroupId
  clickAction:(NSString *)clickAction
  clickData:(NSString *)clickData
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

@end
