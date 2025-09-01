package com.audiowaveform;

import com.facebook.react.bridge.*;
import android.media.MediaExtractor;
import android.media.MediaCodec;
import android.media.MediaFormat;
import android.util.Log;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AudioWaveformModule extends ReactContextBaseJavaModule {

    private static final String TAG = "AudioWaveform";
    private AtomicBoolean isCancelled = new AtomicBoolean(false);
    private AtomicBoolean isProcessing = new AtomicBoolean(false);
    private static final float MAX_AMPLITUDE = 32767f;

    // 限制常量
    private static final int MAX_SAMPLES = 5000000; // 增加到500万样本，支持更大的音频文件
    private static final int MAX_BUFFER_SIZE = 8192;
    private static final float SILENCE_THRESHOLD = 0.001f; // 静音阈值

    private ExecutorService executorService;

    public AudioWaveformModule(ReactApplicationContext reactContext) {
        super(reactContext);
        executorService = Executors.newSingleThreadExecutor();
    }

    @Override
    public String getName() {
        return "AudioWaveform";
    }

    @ReactMethod
    public void getWaveform(ReadableMap options, Callback callback) {
        Log.d(TAG, "开始处理波形生成");

        if (isProcessing.get()) {
            Log.w(TAG, "已有任务正在处理中");
            return;
        }

        executorService.execute(() -> {
            processWaveformInBackground(options, callback);
        });
    }

    private void processWaveformInBackground(ReadableMap options, Callback callback) {
        String url = options.getString("url");
        int samples = options.hasKey("samples") ? options.getInt("samples") : 200;
        String waveformType = options.hasKey("type") ? options.getString("type") : "amplitude";

        samples = Math.max(1, Math.min(500, samples));
        Log.d(TAG, "参数信息 - URL:" + url + ", 采样点数:" + samples + ", 类型:" + waveformType);

        if (url == null || url.isEmpty()) {
            WritableMap errorResult = Arguments.createMap();
            errorResult.putString("error", "音频文件路径不能为空");
            callback.invoke(errorResult);
            return;
        }

        isProcessing.set(true);
        isCancelled.set(false);

        MediaExtractor extractor = null;
        MediaCodec codec = null;

        try {
            extractor = new MediaExtractor();
            extractor.setDataSource(url);

            int audioTrackIndex = -1;
            MediaFormat format = null;
            for (int i = 0; i < extractor.getTrackCount(); i++) {
                MediaFormat f = extractor.getTrackFormat(i);
                String mime = f.getString(MediaFormat.KEY_MIME);
                if (mime != null && mime.startsWith("audio/")) {
                    audioTrackIndex = i;
                    format = f;
                    break;
                }
            }

            if (audioTrackIndex == -1 || format == null) {
                WritableMap errorResult = Arguments.createMap();
                errorResult.putString("error", "未找到音频轨道");
                callback.invoke(errorResult);
                return;
            }

            int sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE);
            int channelCount = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
            long durationUs = format.getLong(MediaFormat.KEY_DURATION);
            double durationSec = durationUs / 1_000_000.0;

            extractor.selectTrack(audioTrackIndex);
            String mimeType = format.getString(MediaFormat.KEY_MIME);

            codec = MediaCodec.createDecoderByType(mimeType);
            codec.configure(format, null, null, 0);
            codec.start();

            List<PCMSample> allSamples = new ArrayList<>();
            MediaCodec.BufferInfo bufferInfo = new MediaCodec.BufferInfo();
            boolean isEOS = false;
            long processStartTime = System.currentTimeMillis();

            while (!isCancelled.get() && !isEOS) {
                // 只检查内存限制，不设置超时
                if (allSamples.size() > MAX_SAMPLES) {
                    Log.w(TAG, "采样数过多，停止处理。当前样本数:" + allSamples.size());
                    break;
                }
                
                // 每10秒输出一次进度
                long currentTime = System.currentTimeMillis();
                long elapsed = currentTime - processStartTime;
                if (elapsed > 0 && elapsed % 10000 < 100 && elapsed > 10000) {
                    Log.d(TAG, "处理进度 - 已收集样本数:" + allSamples.size() + 
                          ", 耗时:" + elapsed + "ms");
                }

                int inputIndex = codec.dequeueInputBuffer(10000);
                if (inputIndex >= 0) {
                    ByteBuffer inputBuffer = codec.getInputBuffer(inputIndex);
                    if (inputBuffer != null) {
                        int sampleSize = extractor.readSampleData(inputBuffer, 0);
                        if (sampleSize < 0) {
                            codec.queueInputBuffer(inputIndex, 0, 0, 0,
                                    MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            isEOS = true;
                        } else {
                            long presentationTimeUs = extractor.getSampleTime();
                            codec.queueInputBuffer(inputIndex, 0, sampleSize, presentationTimeUs, 0);
                            extractor.advance();
                        }
                    }
                }

                int outputIndex = codec.dequeueOutputBuffer(bufferInfo, 10000);
                while (outputIndex >= 0 && !isCancelled.get()) {
                    ByteBuffer outputBuffer = codec.getOutputBuffer(outputIndex);
                    if (outputBuffer != null && bufferInfo.size > 0) {
                        int bufferSize = Math.min(bufferInfo.size, MAX_BUFFER_SIZE);
                        short[] shorts = new short[bufferSize / 2];
                        outputBuffer.asShortBuffer().get(shorts);

                        double startTimeSec = bufferInfo.presentationTimeUs / 1_000_000.0;
                        double sampleInterval = 1.0 / sampleRate;

                        // --- 立体声转单声道 ---
                        short[] processedShorts = shorts;
                        if (channelCount > 1) {
                            processedShorts = new short[shorts.length / channelCount];
                            for (int i = 0, j = 0; i < shorts.length; i += channelCount, j++) {
                                int sum = 0;
                                for (int c = 0; c < channelCount; c++) {
                                    sum += Math.abs(shorts[i + c]);
                                }
                                processedShorts[j] = (short) (sum / channelCount);
                            }
                        }

                        // --- 区间采样 ---
                        int step = Math.max(1, processedShorts.length / 100);
                        for (int i = 0; i < processedShorts.length; i += step) {
                            if (allSamples.size() >= MAX_SAMPLES) break;

                            short maxVal = 0;
                            int end = Math.min(i + step, processedShorts.length);
                            for (int j = i; j < end; j++) {
                                short absVal = (short) Math.abs(processedShorts[j]);
                                if (absVal > maxVal) {
                                    maxVal = absVal;
                                }
                            }

                            double sampleTime = startTimeSec + i * sampleInterval;
                            allSamples.add(new PCMSample(sampleTime, maxVal));
                        }
                    }
                    codec.releaseOutputBuffer(outputIndex, false);
                    outputIndex = codec.dequeueOutputBuffer(bufferInfo, 0);
                }

                if ((bufferInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                    Log.d(TAG, "解码结束，总收集样本数:" + allSamples.size() + 
                          ", 总耗时:" + (System.currentTimeMillis() - processStartTime) + "ms");
                    break;
                }
            }

            if (isCancelled.get()) {
                WritableMap cancelResult = Arguments.createMap();
                cancelResult.putString("error", "任务已取消");
                callback.invoke(cancelResult);
                return;
            }

            if (allSamples.isEmpty()) {
                WritableMap errorResult = Arguments.createMap();
                errorResult.putString("error", "未提取到音频数据");
                callback.invoke(errorResult);
                return;
            }

            double actualDuration = allSamples.get(allSamples.size() - 1).time - allSamples.get(0).time;
            double timePerPoint = actualDuration / samples;
            
            // 添加关键调试信息
            Log.d(TAG, "=== 波形生成调试信息 ===");
            Log.d(TAG, "总样本数:" + allSamples.size());
            Log.d(TAG, "第一个样本时间:" + String.format("%.3f", allSamples.get(0).time) + "秒");
            Log.d(TAG, "最后一个样本时间:" + String.format("%.3f", allSamples.get(allSamples.size() - 1).time) + "秒");
            Log.d(TAG, "实际时长:" + String.format("%.3f", actualDuration) + "秒");
            Log.d(TAG, "每个点时间间隔:" + String.format("%.6f", timePerPoint) + "秒");
            Log.d(TAG, "目标生成点数:" + samples);
            
            // 显示最后几个样本的值，确认是否真的静音
            Log.d(TAG, "最后10个样本的值:");
            for (int i = Math.max(0, allSamples.size() - 10); i < allSamples.size(); i++) {
                PCMSample sample = allSamples.get(i);
                Log.d(TAG, "样本" + i + " - 时间:" + String.format("%.3f", sample.time) + "s, 值:" + sample.value);
            }

            WritableArray arr = Arguments.createArray();
            int sampleIndex = 0;
            int totalSamples = allSamples.size();

            for (int i = 0; i < samples; i++) {
                double startTime = allSamples.get(0).time + i * timePerPoint;
                double endTime = startTime + timePerPoint;

                if (sampleIndex >= totalSamples) {
                    Log.d(TAG, "区间" + i + " - sampleIndex超出范围(" + sampleIndex + ">=" + totalSamples + "), 返回0");
                    arr.pushMap(createWaveformPoint(startTime + timePerPoint / 2, 0, i));
                    continue;
                }

                // 记录区间开始前的sampleIndex
                int startSampleIndex = sampleIndex;
                while (sampleIndex < totalSamples && allSamples.get(sampleIndex).time < startTime) {
                    sampleIndex++;
                }

                List<Short> intervalSamples = new ArrayList<>();
                int collectedCount = 0;
                while (sampleIndex < totalSamples) {
                    PCMSample sample = allSamples.get(sampleIndex);
                    if (sample.time >= endTime) break;
                    intervalSamples.add(sample.value);
                    sampleIndex++;
                    collectedCount++;
                }

                // 添加调试日志
                if (i % 50 == 0 || i >= samples - 10 || intervalSamples.size() == 0) {
                    Log.d(TAG, "区间" + i + " - 时间[" + String.format("%.3f", startTime) + "," + String.format("%.3f", endTime) + 
                          "], sampleIndex从" + startSampleIndex + "到" + sampleIndex + 
                          ", 收集样本数:" + collectedCount + ", 区间样本数:" + intervalSamples.size());
                }

                double value = calculateWaveformValue(intervalSamples, waveformType);
                
                // 添加值调试
                if (i % 50 == 0 || i >= samples - 10) {
                    Log.d(TAG, "区间" + i + " - 计算值:" + String.format("%.6f", value));
                }
                
                arr.pushMap(createWaveformPoint(startTime + timePerPoint / 2, value, i));
            }

            WritableMap result = Arguments.createMap();
            result.putArray("data", arr);
            callback.invoke(result);

        } catch (Exception e) {
            WritableMap errorResult = Arguments.createMap();
            errorResult.putString("error", "音频解析失败: " + e.getMessage());
            callback.invoke(errorResult);
        } finally {
            if (extractor != null) {
                try { extractor.release(); } catch (Exception ignored) {}
            }
            if (codec != null) {
                try { codec.stop(); codec.release(); } catch (Exception ignored) {}
            }
            isProcessing.set(false);
            isCancelled.set(false);
        }
    }

    private WritableMap createWaveformPoint(double time, double value, int index) {
        WritableMap point = Arguments.createMap();
        point.putDouble("time", time);
        point.putDouble("value", Math.min(1.0, Math.max(0.0, value)));
        point.putInt("index", index);
        return point;
    }

    private double calculateWaveformValue(List<Short> samples, String type) {
        if (samples.isEmpty()) return 0;

        try {
            switch (type) {
                case "peak":
                    short max = 0;
                    for (short s : samples) {
                        short absVal = (short) Math.abs(s);
                        if (absVal > max) max = absVal;
                    }
                    double peak = max / MAX_AMPLITUDE;
                    return (peak < SILENCE_THRESHOLD) ? 0 : peak;

                case "rms":
                    long sumSquares = 0;
                    for (short s : samples) {
                        int absVal = Math.abs(s);
                        sumSquares += (long) absVal * absVal;
                    }
                    double rms = Math.sqrt(sumSquares / (double) samples.size());
                    double rmsNorm = rms / MAX_AMPLITUDE;
                    return (rmsNorm < SILENCE_THRESHOLD) ? 0 : rmsNorm;

                case "logarithmic":
                    long sum = 0;
                    for (short s : samples) {
                        sum += Math.abs(s);
                    }
                    double avg = sum / (double) samples.size();
                    double logVal = Math.log10(1 + avg) / Math.log10(1 + MAX_AMPLITUDE);
                    return (logVal < SILENCE_THRESHOLD) ? 0 : logVal;

                case "amplitude":
                default:
                    long sumAmplitude = 0;
                    for (short s : samples) {
                        sumAmplitude += Math.abs(s);
                    }
                    double avgAmp = (sumAmplitude / (double) samples.size()) / MAX_AMPLITUDE;
                    return (avgAmp < SILENCE_THRESHOLD) ? 0 : avgAmp;
            }
        } catch (Exception e) {
            Log.e(TAG, "计算波形值异常: " + e.getMessage());
            return 0;
        }
    }

    @ReactMethod
    public void cancel() {
        isCancelled.set(true);
        isProcessing.set(false);
    }

    @ReactMethod
    public void isProcessing(Promise promise) {
        promise.resolve(isProcessing.get());
    }

    private static class PCMSample {
        double time;
        short value;
        PCMSample(double time, short value) {
            this.time = time;
            this.value = value;
        }
    }
}
