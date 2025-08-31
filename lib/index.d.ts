export interface WaveformOptions {
    url: string;
    samples?: number;
    type?: "amplitude" | "peak" | "rms" | "logarithmic";
}
export interface WaveformPoint {
    time: number;
    value: number;
    index: number;
}
export interface WaveformState {
    loading: boolean;
    data?: WaveformPoint[];
    error?: string;
    message?: string;
}
export declare function generateWaveform(options: WaveformOptions): WaveformState;
export declare function getWaveformState(): WaveformState;
export declare function cancelWaveform(): void;
export declare function isProcessing(): boolean;
export declare function onWaveformStateChange(callback: (state: WaveformState) => void): void;
//# sourceMappingURL=index.d.ts.map