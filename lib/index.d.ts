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
export interface WaveformResult {
    data?: WaveformPoint[];
    error?: string;
}
export declare function generateWaveform(options: WaveformOptions, callback: (result: WaveformResult) => void): {
    loading: boolean;
};
export declare function isProcessing(): Promise<boolean>;
export declare function cancelWaveform(): void;
//# sourceMappingURL=index.d.ts.map