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
  data?: WaveformPoint[]; // 波形数据
  error?: string; // 错误信息（可选）
}

const { AudioWaveform } = NativeModules;

// 生成波形数据 - 同步返回loading状态，通过回调通知结果
export function generateWaveform(
  options: WaveformOptions,
  callback: (result: WaveformResult) => void
): { loading: boolean } {
  // 立即返回loading状态
  const initialState = { loading: true };

  // 异步处理，完成后通过回调通知
  AudioWaveform.getWaveform(options, callback);

  return initialState;
}

// 检查是否正在处理
export function isProcessing(): Promise<boolean> {
  return AudioWaveform.isProcessing();
}

// 取消当前任务
export function cancelWaveform(): void {
  AudioWaveform.cancel();
}
