import Foundation
import React

@objc(AudioWaveformPackage)
class AudioWaveformPackage: NSObject, RCTBridgeModule {
  @objc
  static func moduleName() -> String! {
    return "AudioWaveform"
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
