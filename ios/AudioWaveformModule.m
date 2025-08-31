#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AudioWaveform, NSObject)
RCT_EXTERN_METHOD(getWaveform:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
