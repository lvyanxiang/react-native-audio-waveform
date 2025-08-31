# React Native Audio Waveform

一个简化的React Native音频波形生成库，专注于提供PCM数据和loading状态管理。

## 特性

- 🎵 支持多种音频格式（MP3, WAV, AAC等）
- 📊 生成音频波形数据（PCM采样点）
- ⚡ 异步处理，不阻塞UI线程
- 🔄 简单的loading状态管理
- 📱 支持iOS和Android
- 🚫 可取消正在进行的任务

## 安装

```bash
npm install @lvyanxiang/react-native-audio-waveform
```

## 使用方法

### 基本用法

```typescript
import { generateWaveform, isProcessing, cancelWaveform } from '@lvyanxiang/react-native-audio-waveform';

// 生成波形数据
const result = generateWaveform(
  {
    url: '/path/to/your/audio.mp3', // 音频文件路径
    samples: 200,                    // 波形点数
    type: 'amplitude'                // 波形类型
  },
  (waveformResult) => {
    // 回调函数，处理生成结果
    if (waveformResult.data) {
      console.log('波形数据:', waveformResult.data);
      // waveformResult.data 包含波形点数组
      // 每个点包含: time(时间), value(值), index(索引)
    } else if (waveformResult.error) {
      console.log('波形生成失败:', waveformResult.error);
    }
  }
);

// 立即获取loading状态
console.log('Loading:', result.loading); // true
```

### 检查处理状态

```typescript
// 检查是否正在处理
isProcessing().then((processing) => {
  if (processing) {
    console.log('正在处理音频...');
  }
});
```

### 取消任务

```typescript
// 取消正在进行的任务
cancelWaveform();
```

## API 参考

### generateWaveform(options, callback)

生成音频波形数据。

**参数:**
- `options` (WaveformOptions): 配置选项
  - `url` (string): 音频文件路径（必需）
  - `samples` (number): 波形点数，默认200
  - `type` (string): 波形类型，可选值：'amplitude', 'peak', 'rms', 'logarithmic'
- `callback` (function): 回调函数，接收生成结果

**返回值:**
- `{ loading: boolean }`: 立即返回的loading状态

**回调参数:**
- `waveformResult` (WaveformResult):
  - `data` (WaveformPoint[]): 波形数据数组（成功时）
  - `error` (string): 错误信息（失败时）

### isProcessing()

检查是否正在处理音频。

**返回值:**
- `Promise<boolean>`: 是否正在处理

### cancelWaveform()

取消正在进行的波形生成任务。

## 波形类型

- **amplitude**: 平均振幅（默认）
- **peak**: 峰值
- **rms**: 均方根值
- **logarithmic**: 对数平均值

## 示例

查看 `example/SimpleExample.tsx` 获取完整的使用示例。

## 注意事项

1. 音频文件路径需要是设备可访问的路径
2. 大文件处理可能需要较长时间，建议设置合理的超时时间
3. 处理过程中可以随时取消任务
4. 支持本地文件和网络文件（需要网络权限）

## 许可证

MIT
