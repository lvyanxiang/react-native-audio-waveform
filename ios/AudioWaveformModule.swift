import Foundation
import AVFoundation
import React

@objc(AudioWaveformModule)
class AudioWaveformModule: NSObject {

  @objc
  func getWaveform(_ options: [String: Any],
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let urlString = options["url"] as? String, !urlString.isEmpty else {
      reject("INVALID_URL", "音频文件路径不能为空", nil)
      return
    }
    
    let samples = options["samples"] as? Int ?? 200
    let fileURL: URL
    if urlString.hasPrefix("file://") {
      fileURL = URL(fileURLWithPath: String(urlString.dropFirst(7)))
    } else {
      fileURL = URL(fileURLWithPath: urlString)
    }
    
    do {
      let asset = AVURLAsset(url: fileURL)
      guard let track = asset.tracks(withMediaType: .audio).first else {
        reject("NO_AUDIO_TRACK", "未找到音频轨道，请检查文件是否包含音频", nil)
        return
      }
      
      // 获取音频时长
      let durationSeconds = CMTimeGetSeconds(asset.duration)
      
      // 获取实际采样率
      let sampleRate = track.naturalTimeScale
      let timePerSample: Double = 1.0 / Double(sampleRate)
      
      print("Audio sample rate: \(sampleRate) Hz")
      print("Time per sample: \(timePerSample) seconds")
      
      // 计算每个样本对应的音频时长
      let sampleDuration = durationSeconds / Double(samples)
      
      let reader = try AVAssetReader(asset: asset)
      let outputSettings: [String: Any] = [
        AVFormatIDKey: kAudioFormatLinearPCM,
        AVLinearPCMIsFloatKey: true,
        AVLinearPCMBitDepthKey: 32,
        AVLinearPCMIsNonInterleaved: false
      ]
      let trackOutput = AVAssetReaderTrackOutput(track: track, outputSettings: outputSettings)
      reader.add(trackOutput)
      reader.startReading()
      
      var waveform: [Double] = []
      var tempValues: [Double] = []
      
      // 按时间窗口收集数据
      var currentTime: Double = 0
      var windowStartTime: Double = 0
      var windowEndTime: Double = sampleDuration
      
      // 获取采样率（假设44.1kHz，实际应该从track获取）
      let startTime = Date()
      
      while let sampleBuffer = trackOutput.copyNextSampleBuffer() {
        guard let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else { continue }
        let length = CMBlockBufferGetDataLength(blockBuffer)
        var data = [Float](repeating: 0, count: length / MemoryLayout<Float>.size)
        CMBlockBufferCopyDataBytes(blockBuffer, atOffset: 0, dataLength: length, destination: &data)
        
        for v in data {
          let absV = abs(Double(v))
          tempValues.append(absV)
          
          // 计算当前样本的时间位置
          currentTime += timePerSample
          
          // 如果当前时间窗口结束，计算该窗口的波形值
          if currentTime >= windowEndTime {
            if !tempValues.isEmpty {
              let rmsValue = calculateRMS(tempValues)
              let peakValue = findPeak(tempValues)
              let finalValue = peakValue * 0.7 + rmsValue * 0.3
              waveform.append(finalValue)
              
              // 移动到下一个时间窗口
              windowStartTime = windowEndTime
              windowEndTime += sampleDuration
              
              // 清空临时数据
              tempValues.removeAll()
            }
          }
          
          // 如果已经收集足够的样本，提前退出
          if waveform.count >= samples {
            break
          }
        }
        
        // 如果已经收集足够的样本或超时，退出
        if waveform.count >= samples || Date().timeIntervalSince(startTime) > 30 {
          break
        }
      }
      
      // 处理最后一个时间窗口的数据
      if !tempValues.isEmpty && waveform.count < samples {
        let rmsValue = calculateRMS(tempValues)
        let peakValue = findPeak(tempValues)
        let finalValue = peakValue * 0.7 + rmsValue * 0.3
        waveform.append(finalValue)
      }
      
      // 确保波形数据数量正确
      while waveform.count < samples {
        waveform.append(0.0) // 用0填充不足的部分
      }
      
      if waveform.isEmpty {
        reject("NO_AUDIO_DATA", "无法从音频文件中提取数据，请检查文件是否损坏", nil)
        return
      }
      
      // 归一化处理
      let maxValue = waveform.max() ?? 1.0
      let minValue = waveform.min() ?? 0.0
      let range = maxValue - minValue
      
      if range > 0 {
        for i in 0..<waveform.count {
          waveform[i] = (waveform[i] - minValue) / range
        }
      }
      
      var result: [[String: Any]] = []
      
      for i in 0..<samples {
        let value = waveform[i]
        let timePoint = Double(i) * durationSeconds / Double(samples - 1)
        result.append([
          "time": timePoint,
          "value": value,
          "index": i
        ])
      }
      
      let processingTime = Date().timeIntervalSince(startTime) * 1000
      print("Successfully generated waveform with \(samples) samples")
      print("Audio duration: \(durationSeconds) seconds")
      print("Processing time: \(processingTime)ms")
      
      resolve(result)
      
    } catch {
      let errorMessage = getErrorMessage(error)
      reject("DECODE_ERROR", errorMessage, error)
    }
  }
  
  private func calculateRMS(_ values: [Double]) -> Double {
    guard !values.isEmpty else { return 0.0 }
    let sum = values.reduce(0) { $0 + $1 * $1 }
    return sqrt(sum / Double(values.count))
  }
  
  private func findPeak(_ values: [Double]) -> Double {
    guard !values.isEmpty else { return 0.0 }
    return values.max() ?? 0.0
  }
  
  private func getErrorMessage(_ error: Error) -> String {
    let errorDescription = error.localizedDescription
    
    if errorDescription.contains("Permission") {
      return "权限不足，请检查文件访问权限"
    } else if errorDescription.contains("FileNotFound") {
      return "文件未找到，请检查路径"
    } else if errorDescription.contains("Malformed") {
      return "音频文件损坏或格式错误"
    } else if errorDescription.contains("IndexOutOfBounds") {
      return "音频数据读取错误"
    } else if errorDescription.contains("Security") {
      return "安全权限不足，请检查应用权限"
    } else if errorDescription.contains("IllegalArgumentException") {
      return "音频文件过大或格式不支持"
    } else {
      return "音频处理失败: \(errorDescription)"
    }
  }
}
