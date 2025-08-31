"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWaveform = generateWaveform;
exports.isProcessing = isProcessing;
exports.cancelWaveform = cancelWaveform;
const react_native_1 = require("react-native");
const { AudioWaveform } = react_native_1.NativeModules;
// 生成波形数据 - 同步返回loading状态，通过回调通知结果
function generateWaveform(options, callback) {
    // 立即返回loading状态
    const initialState = { loading: true };
    // 异步处理，完成后通过回调通知
    AudioWaveform.getWaveform(options, callback);
    return initialState;
}
// 检查是否正在处理
function isProcessing() {
    return AudioWaveform.isProcessing();
}
// 取消当前任务
function cancelWaveform() {
    AudioWaveform.cancel();
}
//# sourceMappingURL=index.js.map