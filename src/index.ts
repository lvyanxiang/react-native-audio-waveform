import { NativeModules } from "react-native";

export interface WaveformOptions {
  url: string; // 音频文件路径，本地或网络
  samples?: number; // 波形点数，默认 200
  type?: "amplitude" | "peak" | "rms" | "logarithmic"; // 波形类型
}

export interface WaveformPoint {
  time: number; // 时间（秒）
  value: number; // 波形值（0.0-1.0）
  index: number; // 索引位置
}

export interface WaveformResult {
  status: "success" | "error";
  data?: WaveformPoint[];
  error?: string;
  message?: string;
}

const { AudioWaveform } = NativeModules;

export function getWaveform(options: WaveformOptions): Promise<WaveformResult> {
  return AudioWaveform.getWaveform(options);
}

// 取消当前任务
export function cancelWaveform(): void {
  AudioWaveform.cancel();
}

// 检查是否正在处理
export function isProcessing(): boolean {
  return AudioWaveform.isProcessing();
}
