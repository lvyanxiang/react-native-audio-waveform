#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AudioWaveform, NSObject)
RCT_EXTERN_METHOD(getWaveform:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseResolveBlock)reject)
RCT_EXTERN_METHOD(getWaveformState:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(onStateChange:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(cancel)
RCT_EXTERN_METHOD(isProcessing:(RCTResponseSenderBlock)callback)
@end
