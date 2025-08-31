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

public class AudioWaveformModule extends ReactContextBaseJavaModule {

    private static final String TAG = "WaveformDebug";
    private AtomicBoolean isCancelled = new AtomicBoolean(false);
    private static final int FFT_SIZE = 1024;
    private static final float MAX_AMPLITUDE = 32767f;
    
    // 添加内存限制常量
    private static final int MAX_SAMPLES = 1000000; // 最大采样数限制
    private static final int MAX_BUFFER_SIZE = 8192; // 最大缓冲区大小

    public AudioWaveformModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AudioWaveform";
    }

    @ReactMethod
    public void getWaveform(ReadableMap options, Promise promise) {
        Log.d(TAG, "====== 开始处理波形生成 ======");
        
        // 确保在主线程上执行
        getReactApplicationContext().runOnUiQueueThread(() -> {
            try {
                processWaveform(options, promise);
            } catch (Exception e) {
                Log.e(TAG, "主线程处理异常: " + e.getMessage(), e);
                promise.reject("THREAD_ERROR", "线程处理异常: " + e.getMessage());
            }
        });
    }

    private void processWaveform(ReadableMap options, Promise promise) {
        String url = options.getString("url");
        int samples = options.hasKey("samples") ? options.getInt("samples") : 200;
        String waveformType = options.hasKey("type") ? options.getString("type") : "amplitude";
        
        // 限制采样数，防止内存问题
        samples = Math.max(1, Math.min(500, samples)); // 降低最大采样数

        Log.d(TAG, "参数信息 - URL:" + url + ", 采样点数:" + samples + ", 类型:" + waveformType);

        if (url == null || url.isEmpty()) {
            Log.e(TAG, "错误：音频 URL 为空");
            promise.reject("INVALID_URL", "音频文件路径不能为空");
            return;
        }

        MediaExtractor extractor = null;
        MediaCodec codec = null;

        try {
            // 1. 初始化提取器
            extractor = new MediaExtractor();
            extractor.setDataSource(url);
            Log.d(TAG, "提取器初始化成功，开始查找音频轨道");

            // 2. 查找音频轨道
            int audioTrackIndex = -1;
            MediaFormat format = null;
            for (int i = 0; i < extractor.getTrackCount(); i++) {
                MediaFormat f = extractor.getTrackFormat(i);
                String mime = f.getString(MediaFormat.KEY_MIME);
                Log.d(TAG, "轨道" + i + "格式:" + mime);
                if (mime != null && mime.startsWith("audio/")) {
                    audioTrackIndex = i;
                    format = f;
                    break;
                }
            }

            if (audioTrackIndex == -1 || format == null) {
                Log.e(TAG, "未找到音频轨道");
                promise.reject("NO_AUDIO_TRACK", "未找到音频轨道");
                return;
            }

            // 3. 打印音频格式信息
            int sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE);
            int channelCount = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
            long durationUs = format.getLong(MediaFormat.KEY_DURATION);
            double durationSec = durationUs / 1_000_000.0;
            
            Log.d(TAG, "音频格式信息 - 采样率:" + sampleRate + "Hz, 声道数:" + channelCount + 
                  ", 元数据时长:" + durationSec + "秒");

            extractor.selectTrack(audioTrackIndex);
            String mimeType = format.getString(MediaFormat.KEY_MIME);
            
            // 4. 初始化解码器
            codec = MediaCodec.createDecoderByType(mimeType);
            codec.configure(format, null, null, 0);
            codec.start();
            Log.d(TAG, "解码器初始化成功，开始解码 PCM 数据");

            // 5. 解码并收集数据
            List<PCMSample> allSamples = new ArrayList<>();
            MediaCodec.BufferInfo bufferInfo = new MediaCodec.BufferInfo();
            boolean isEOS = false;
            int totalFrames = 0;
            long processStartTime = System.currentTimeMillis();

            while (!isCancelled.get() && !isEOS) {
                // 检查超时
                if (System.currentTimeMillis() - processStartTime > 30000) {
                    Log.w(TAG, "处理超时，强制结束");
                    break;
                }

                // 检查内存使用
                if (allSamples.size() > MAX_SAMPLES) {
                    Log.w(TAG, "采样数过多，强制结束处理");
                    break;
                }

                // 处理输入缓冲区
                int inputIndex = codec.dequeueInputBuffer(10000);
                if (inputIndex >= 0) {
                    try {
                        ByteBuffer inputBuffer = codec.getInputBuffer(inputIndex);
                        if (inputBuffer != null) {
                            int sampleSize = extractor.readSampleData(inputBuffer, 0);
                            if (sampleSize < 0) {
                                Log.d(TAG, "输入缓冲区结束，标记 EOS");
                                codec.queueInputBuffer(inputIndex, 0, 0, 0, 
                                    MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                                isEOS = true;
                            } else {
                                long presentationTimeUs = extractor.getSampleTime();
                                Log.d(TAG, "处理输入缓冲区 - 大小:" + sampleSize + "字节，时间戳:" + 
                                      presentationTimeUs/1000000.0 + "秒");
                                codec.queueInputBuffer(inputIndex, 0, sampleSize, presentationTimeUs, 0);
                                extractor.advance();
                            }
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "输入缓冲区处理异常: " + e.getMessage());
                        break;
                    }
                }

                // 处理输出缓冲区
                int outputIndex = codec.dequeueOutputBuffer(bufferInfo, 10000);
                while (outputIndex >= 0 && !isCancelled.get()) {
                    try {
                        ByteBuffer outputBuffer = codec.getOutputBuffer(outputIndex);
                        if (outputBuffer != null && bufferInfo.size > 0) {
                            // 限制缓冲区大小
                            int bufferSize = Math.min(bufferInfo.size, MAX_BUFFER_SIZE);
                            short[] shorts = new short[bufferSize / 2];
                            outputBuffer.asShortBuffer().get(shorts);

                            // 计算时间
                            double startTimeSec = bufferInfo.presentationTimeUs / 1_000_000.0;
                            double sampleInterval = 1.0 / sampleRate;

                            // 处理立体声
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

                            // 采样数据，避免过多数据
                            int step = Math.max(1, processedShorts.length / 100);
                            for (int i = 0; i < processedShorts.length; i += step) {
                                if (allSamples.size() >= MAX_SAMPLES) break;
                                
                                short maxVal = 0;
                                int end = Math.min(i + step, processedShorts.length);
                                for (int j = i; j < end; j++) {
                                    maxVal = (short) Math.max(maxVal, processedShorts[j]);
                                }
                                
                                double sampleTime = startTimeSec + i * sampleInterval;
                                allSamples.add(new PCMSample(sampleTime, maxVal));
                            }

                            totalFrames += shorts.length;
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "输出缓冲区处理异常: " + e.getMessage());
                    } finally {
                        try {
                            codec.releaseOutputBuffer(outputIndex, false);
                        } catch (Exception e) {
                            Log.e(TAG, "释放输出缓冲区异常: " + e.getMessage());
                        }
                    }
                    
                    outputIndex = codec.dequeueOutputBuffer(bufferInfo, 0);
                }

                if ((bufferInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                    Log.d(TAG, "解码结束，总采样数:" + allSamples.size());
                    break;
                }
            }

            if (isCancelled.get()) {
                Log.d(TAG, "任务已取消");
                promise.reject("CANCELLED", "波形生成已取消");
                return;
            }

            // 6. 检查数据有效性
            if (allSamples.isEmpty()) {
                Log.w(TAG, "警告：未提取到任何 PCM 采样");
                promise.resolve(Arguments.createArray());
                return;
            }

            // 7. 生成波形点
            double actualDuration = allSamples.get(allSamples.size() - 1).time - allSamples.get(0).time;
            double timePerPoint = actualDuration / samples;
            
            Log.d(TAG, "生成波形点 - 总点数:" + samples + ", 每个点时间间隔:" + timePerPoint + "秒");

            WritableArray arr = Arguments.createArray();
            int sampleIndex = 0;
            int totalSamples = allSamples.size();

            for (int i = 0; i < samples; i++) {
                try {
                    double startTime = allSamples.get(0).time + i * timePerPoint;
                    double endTime = startTime + timePerPoint;

                    // 跳过空区间
                    if (sampleIndex >= totalSamples) {
                        WritableMap point = createWaveformPoint(startTime + timePerPoint / 2, 0, i);
                        arr.pushMap(point);
                        continue;
                    }

                    // 查找区间起点
                    while (sampleIndex < totalSamples && allSamples.get(sampleIndex).time < startTime) {
                        sampleIndex++;
                    }

                    // 收集区间采样
                    List<Short> intervalSamples = new ArrayList<>();
                    int startIndex = sampleIndex;
                    while (sampleIndex < totalSamples) {
                        PCMSample sample = allSamples.get(sampleIndex);
                        if (sample.time >= endTime) break;
                        intervalSamples.add(sample.value);
                        sampleIndex++;
                    }

                    // 计算波形值
                    double value = calculateWaveformValue(intervalSamples, waveformType);

                    // 打印关键信息
                    if (i % 50 == 0 || i >= samples - 10) {
                        Log.d(TAG, "波形点" + i + "- 时间区间: [" + startTime + "," + endTime + ")," +
                              "采样数:" + intervalSamples.size() + ", 值:" + value);
                    }

                    WritableMap point = createWaveformPoint(startTime + timePerPoint / 2, value, i);
                    arr.pushMap(point);
                    
                } catch (Exception e) {
                    Log.e(TAG, "生成波形点" + i + "异常: " + e.getMessage());
                    // 添加默认点，避免崩溃
                    WritableMap point = createWaveformPoint(0, 0, i);
                    arr.pushMap(point);
                }
            }

            Log.d(TAG, "波形生成完成，返回点数:" + arr.size());
            promise.resolve(arr);

        } catch (Exception e) {
            Log.e(TAG, "处理失败:" + e.getMessage(), e);
            promise.reject("DECODE_ERROR", "音频解析失败:" + e.getMessage());
        } finally {
            // 安全释放资源
            if (extractor != null) {
                try {
                    extractor.release();
                } catch (Exception ignored) {
                    Log.w(TAG, "释放提取器异常: " + ignored.getMessage());
                }
            }
            if (codec != null) {
                try {
                    codec.stop();
                    codec.release();
                } catch (Exception ignored) {
                    Log.w(TAG, "释放解码器异常: " + ignored.getMessage());
                }
            }
            isCancelled.set(false);
            Log.d(TAG, "====== 处理结束 ======\n");
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
                        if (s > max) max = s;
                    }
                    return max / MAX_AMPLITUDE;
                case "rms":
                    long sumSquares = 0;
                    for (short s : samples) {
                        sumSquares += (long) s * s;
                    }
                    double rms = Math.sqrt(sumSquares / samples.size());
                    return rms / MAX_AMPLITUDE;
                case "logarithmic":
                    long sum = 0;
                    for (short s : samples) {
                        sum += s;
                    }
                    double avg = sum / (double) samples.size();
                    return avg > 0 ? Math.log10(1 + avg) / Math.log10(1 + MAX_AMPLITUDE) : 0;
                case "amplitude":
                default:
                    long sumAmplitude = 0;
                    for (short s : samples) {
                        sumAmplitude += s;
                    }
                    return sumAmplitude / (double) samples.size() / MAX_AMPLITUDE;
            }
        } catch (Exception e) {
            Log.e(TAG, "计算波形值异常: " + e.getMessage());
            return 0;
        }
    }

    @ReactMethod
    public void cancel() {
        Log.d(TAG, "取消波形生成任务");
        isCancelled.set(true);
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