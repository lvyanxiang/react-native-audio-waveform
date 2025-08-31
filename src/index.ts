import { NativeModules } from "react-native";

export interface WaveformOptions {
  url: string; // 音频文件路径，本地或网络
  samples?: number; // 波形点数，默认 200
}

export interface WaveformPoint {
  time: number; // 时间（秒）
  value: number; // 波形值（0.0-1.0）
  index: number; // 索引位置
}

const { AudioWaveform } = NativeModules;

export function getWaveform(
  options: WaveformOptions
): Promise<WaveformPoint[]> {
  return AudioWaveform.getWaveform(options);
}
