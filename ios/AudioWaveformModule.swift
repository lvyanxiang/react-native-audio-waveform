import Foundation
import AVFoundation
import React

@objc(AudioWaveformModule)
class AudioWaveformModule: NSObject {
  
  private var isProcessing = false
  private var isCancelled = false
  private let processingQueue = DispatchQueue(label: "AudioWaveformProcessing", qos: .userInitiated)

  @objc
  func getWaveform(_ options: [String: Any],
                   callback: @escaping RCTResponseSenderBlock) {
    
    // 检查是否已经在处理
    if isProcessing {
      print("已有任务正在处理中")
      return
    }
    
    // 在后台队列中处理
    processingQueue.async {
      self.processWaveformInBackground(options, callback: callback)
    }
  }

  private func processWaveformInBackground(_ options: [String: Any],
                                         callback: @escaping RCTResponseSenderBlock) {
    guard let urlString = options["url"] as? String, !urlString.isEmpty else {
      let errorResult: [String: Any] = ["error": "音频文件路径不能为空"]
      callback([errorResult])
      return
    }
    
    let samples = options["samples"] as? Int ?? 200
    let waveformType = options["type"] as? String ?? "amplitude"
    
    // 设置处理状态
    isProcessing = true
    isCancelled = false
    
    let fileURL: URL
    if urlString.hasPrefix("file://") {
      fileURL = URL(fileURLWithPath: String(urlString.dropFirst(7)))
    } else {
      fileURL = URL(fileURLWithPath: urlString)
    }
    
    do {
      let asset = AVURLAsset(url: fileURL)
      guard let track = asset.tracks(withMediaType: .audio).first else {
        let errorResult: [String: Any] = ["error": "未找到音频轨道"]
        callback([errorResult])
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
        // 检查是否被取消
        if isCancelled {
          let cancelResult: [String: Any] = ["error": "任务已取消"]
          callback([cancelResult])
          return
        }
        
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
              let value = calculateWaveformValue(tempValues, type: waveformType)
              waveform.append(value)
              
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
        let value = calculateWaveformValue(tempValues, type: waveformType)
        waveform.append(value)
      }
      
      // 确保波形数据数量正确
      while waveform.count < samples {
        waveform.append(0.0) // 用0填充不足的部分
      }
      
      if waveform.isEmpty {
        let errorResult: [String: Any] = ["error": "未提取到音频数据"]
        callback([errorResult])
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
      
      // 通过回调返回成功结果
      let finalResult: [String: Any] = [
        "data": result
      ]
      callback([finalResult])
      
    } catch {
      let errorResult: [String: Any] = ["error": "音频解析失败"]
      callback([errorResult])
    } finally {
      isProcessing = false
    }
  }
  
  @objc
  func cancel() {
    print("取消波形生成任务")
    isCancelled = true
    // 重置处理状态
    isProcessing = false
  }
  
  @objc
  func isProcessing(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(isProcessing)
  }
  
  private func calculateWaveformValue(_ values: [Double], type: String) -> Double {
    guard !values.isEmpty else { return 0.0 }
    
    switch type {
    case "peak":
      return values.max() ?? 0.0
    case "rms":
      let sum = values.reduce(0) { $0 + $1 * $1 }
      return sqrt(sum / Double(values.count))
    case "logarithmic":
      let avg = values.reduce(0, +) / Double(values.count)
      return avg > 0 ? log10(1 + avg) / log10(2) : 0.0
    case "amplitude":
    default:
      return values.reduce(0, +) / Double(values.count)
    }
  }
}
