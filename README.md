# React Native Audio Waveform

一个用于生成音频波形图的React Native库，支持Android和iOS平台。

## 功能特性

- 🎵 支持多种音频格式
- 📊 生成高质量波形数据
- ⚡ 异步处理，不阻塞UI
- 🚫 支持取消正在进行的任务
- 📱 专为React Native优化

## 安装

```bash
npm install react-native-audio-waveform
# 或
yarn add react-native-audio-waveform
```

## 链接

### Android

```bash
npx react-native link react-native-audio-waveform
```

### iOS

```bash
cd ios && pod install
```

## 使用方法

### 新的异步API（推荐）

```typescript
import { 
  generateWaveform, 
  getWaveformState, 
  onWaveformStateChange,
  cancelWaveform, 
  isProcessing 
} from 'react-native-audio-waveform';

// 立即开始处理，不阻塞UI
const handleGenerateWaveform = () => {
  // 立即返回初始状态
  const initialState = generateWaveform({
    url: '/path/to/audio.mp3',
    samples: 200,
    type: 'amplitude'
  });
  
  // 立即更新UI状态
  setWaveformState(initialState);
};

// 监听状态变化
useEffect(() => {
  onWaveformStateChange((newState) => {
    setWaveformState(newState);
  });
}, []);

// 获取当前状态
const getCurrentState = async () => {
  const state = await getWaveformState();
  setWaveformState(state);
};

// 取消任务
const cancelTask = () => {
  cancelWaveform();
};
```

### 状态对象结构

```typescript
interface WaveformState {
  loading: boolean;        // 是否正在处理
  data?: WaveformPoint[];  // 波形数据（处理完成后）
  error?: string;          // 错误代码（如果有错误）
  message: string;         // 状态消息
}
```

### 传统Promise方式（兼容性）

```typescript
import { getWaveform, cancelWaveform, isProcessing } from 'react-native-audio-waveform';

// 生成波形数据
const generateWaveform = async () => {
  try {
    const result = await getWaveform({
      url: '/path/to/audio.mp3',
      samples: 200,
      type: 'amplitude'
    });

    if (result.status === 'success') {
      console.log('波形数据:', result.data);
    } else {
      console.error('生成失败:', result.error, result.message);
    }
  } catch (error) {
    console.error('调用失败:', error);
  }
};
```

### 波形类型说明

- **amplitude**: 振幅平均值（默认）
- **peak**: 峰值
- **rms**: 均方根值
- **logarithmic**: 对数平均值

### 返回数据格式

成功时返回：
```typescript
{
  status: 'success',
  data: [
    {
      time: 0.5,      // 时间（秒）
      value: 0.8,     // 波形值（0.0-1.0）
      index: 0        // 索引位置
    },
    // ... 更多点
  ],
  message: '波形生成完成'
}
```

失败时返回：
```typescript
{
  status: 'error',
  error: 'ERROR_CODE',
  message: '错误描述'
}
```

### 错误代码

- `INVALID_URL`: 音频文件路径无效
- `NO_AUDIO_TRACK`: 未找到音频轨道
- `NO_DATA`: 未提取到音频数据
- `DECODE_ERROR`: 音频解析失败
- `CANCELLED`: 任务被取消

## 注意事项

1. **新API优势**: 使用`generateWaveform()`立即返回状态，不阻塞UI
2. **状态监听**: 使用`onWaveformStateChange()`监听实时状态变化
3. **音频文件路径**: 支持本地文件路径和网络URL
4. **性能优化**: 处理大文件时建议适当减少采样点数
5. **任务管理**: 长时间处理时可以使用`cancelWaveform()`取消任务
6. **状态检查**: 使用`getWaveformState()`获取当前状态
7. **跨平台**: iOS和Android平台都支持相同的API接口
8. **技术实现**: iOS使用AVFoundation框架，Android使用MediaCodec框架

## 许可证

MIT
