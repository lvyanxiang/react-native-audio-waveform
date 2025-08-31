export interface WaveformOptions {
    url: string;
    samples?: number;
}
export interface WaveformPoint {
    time: number;
    value: number;
    index: number;
}
export declare function getWaveform(options: WaveformOptions): Promise<WaveformPoint[]>;
//# sourceMappingURL=index.d.ts.map