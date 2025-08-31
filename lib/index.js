"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWaveform = getWaveform;
const react_native_1 = require("react-native");
const { AudioWaveform } = react_native_1.NativeModules;
function getWaveform(options) {
    return AudioWaveform.getWaveform(options);
}
//# sourceMappingURL=index.js.map