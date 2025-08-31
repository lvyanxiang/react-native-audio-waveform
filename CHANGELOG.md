# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-19

### 🚀 Major Features
- **全新的异步状态管理API** - 不再阻塞UI线程
- **立即响应** - `generateWaveform()` 立即返回状态对象
- **实时状态更新** - 支持状态监听和进度反馈
- **任务取消支持** - 可以随时取消正在进行的处理任务

### ✨ New API
- `generateWaveform(options)` - 立即开始处理，返回初始状态
- `getWaveformState()` - 获取当前处理状态
- `onWaveformStateChange(callback)` - 监听状态变化
- `cancelWaveform()` - 取消正在进行的任务
- `isProcessing()` - 检查是否正在处理

### 🔄 Breaking Changes
- **重大变更**: `getWaveform()` 现在返回 `WaveformResult` 而不是 `WaveformPoint[]`
- **接口更新**: 新增 `WaveformState` 接口，包含 `loading`, `data`, `error`, `message` 字段
- **状态管理**: 从同步Promise模式改为异步状态管理模式

### 🛠️ Technical Improvements
- **Android**: 使用 `ExecutorService` 在后台线程处理音频
- **iOS**: 使用 `DispatchQueue` 在后台队列处理音频
- **内存管理**: 改进的内存使用和资源清理
- **错误处理**: 更清晰的错误代码和中文错误消息

### 📱 User Experience
- **无阻塞UI**: 音频处理不再阻塞用户界面
- **实时反馈**: 用户可以看到处理进度和状态
- **可取消操作**: 长时间处理时可以取消任务
- **状态清晰**: 明确的loading、success、error状态

### 🔧 Compatibility
- **React Native**: >= 0.70.0
- **React**: >= 17.0.0
- **iOS**: 12.0+
- **Android**: API 24+

### 📚 Documentation
- 完整的API文档和使用示例
- 新的异步API使用指南
- 状态管理最佳实践
- 跨平台兼容性说明

## [1.0.31] - 2024-12-18

### 🐛 Bug Fixes
- 修复Android平台内存泄漏问题
- 改进错误处理和资源清理
- 优化音频解码性能

### 📱 Platform Support
- 支持更多音频格式
- 改进iOS和Android兼容性

## [1.0.0] - 2024-12-01

### 🎉 Initial Release
- 基础音频波形生成功能
- 支持iOS和Android平台
- TypeScript类型定义
- 多种波形算法支持
