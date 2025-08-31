"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWaveform = generateWaveform;
exports.getWaveformState = getWaveformState;
exports.cancelWaveform = cancelWaveform;
exports.isProcessing = isProcessing;
exports.onWaveformStateChange = onWaveformStateChange;
const react_native_1 = require("react-native");
const { AudioWaveform } = react_native_1.NativeModules;
// 生成波形数据 - 立即返回状态对象，异步更新状态
function generateWaveform(options) {
    // 立即返回初始状态
    const initialState = {
        loading: true,
        message: "正在初始化...",
    };
    // 异步处理，不阻塞UI
    AudioWaveform.getWaveform(options);
    return initialState;
}
// 获取当前状态
function getWaveformState() {
    return AudioWaveform.getWaveformState();
}
// 取消当前任务
function cancelWaveform() {
    AudioWaveform.cancel();
}
// 检查是否正在处理
function isProcessing() {
    return AudioWaveform.isProcessing();
}
// 监听状态变化（可选的回调方式）
function onWaveformStateChange(callback) {
    AudioWaveform.onStateChange(callback);
}
//# sourceMappingURL=index.js.map