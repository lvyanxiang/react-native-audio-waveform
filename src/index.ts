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

export interface WaveformState {
  loading: boolean; // 是否正在处理
  data?: WaveformPoint[]; // 波形数据
  error?: string; // 错误代码
  message?: string; // 状态消息
}

const { AudioWaveform } = NativeModules;

// 生成波形数据 - 立即返回状态对象，异步更新状态
export function generateWaveform(options: WaveformOptions): WaveformState {
  // 立即返回初始状态
  const initialState: WaveformState = {
    loading: true,
    message: "正在初始化...",
  };

  // 异步处理，不阻塞UI
  AudioWaveform.getWaveform(options);

  return initialState;
}

// 获取当前状态
export function getWaveformState(): WaveformState {
  return AudioWaveform.getWaveformState();
}

// 取消当前任务
export function cancelWaveform(): void {
  AudioWaveform.cancel();
}

// 检查是否正在处理
export function isProcessing(): boolean {
  return AudioWaveform.isProcessing();
}

// 监听状态变化（可选的回调方式）
export function onWaveformStateChange(
  callback: (state: WaveformState) => void
): void {
  AudioWaveform.onStateChange(callback);
}
