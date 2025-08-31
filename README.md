# react-native-audio-waveform

A React Native library for generating audio waveform data from audio files with high quality and precise time positioning.

## ✨ Features

- 🎵 **High-quality waveform generation** using peak detection and RMS algorithms
- ⏰ **Precise time positioning** - each waveform point corresponds to exact audio time
- 📱 **Cross-platform support** - iOS & Android
- 🚀 **Smart buffer management** - automatically adapts to file size
- 🎨 **Rich metadata** - audio format, duration, sample rate information
- 🛡️ **Robust error handling** with Chinese-friendly error messages
- 📊 **Multiple audio formats** - MP3, WAV, AAC, OGG, M4A, FLAC, etc.

## 📦 Installation

```bash
npm install @lvyanxiang/react-native-audio-waveform
# or
yarn add @lvyanxiang/react-native-audio-waveform
```

## ⚙️ Configuration

### Automatic Configuration (Recommended)

The package should automatically configure itself. After installation, you can directly import and use it.

### Manual Configuration (If Auto-config Fails)

If you encounter issues, please configure manually:

#### Android Configuration

1. **Add to `android/settings.gradle`:**
```gradle
include ':react-native-audio-waveform'
project(':react-native-audio-waveform').projectDir = new File(rootProject.projectDir, '../node_modules/@lvyanxiang/react-native-audio-waveform/android')
```

2. **Add to `android/app/build.gradle`:**
```gradle
dependencies {
    implementation project(':react-native-audio-waveform')
}
```

3. **Add to `android/app/src/main/java/com/yourapp/MainApplication.java`:**
```java
import com.audiowaveform.AudioWaveformPackage;

@Override
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new AudioWaveformPackage() // Add this line
    );
}
```

#### iOS Configuration

1. **Install pods:**
```bash
cd ios && pod install
```

2. **If you have a custom Podfile, add:**
```ruby
pod 'react-native-audio-waveform', :path => '../node_modules/@lvyanxiang/react-native-audio-waveform'
```

3. **Rebuild your project:**
```bash
npx react-native run-ios
```

## 🚀 Usage

### Basic Usage

```typescript
import { getWaveform, WaveformOptions, WaveformPoint } from '@lvyanxiang/react-native-audio-waveform';

const generateWaveform = async () => {
  try {
    const waveformData: WaveformPoint[] = await getWaveform({
      url: 'path/to/audio.mp3',
      samples: 1000
    });
    
    console.log('Waveform data:', waveformData);
    // Returns array of objects:
    // [
    //   { time: 0.0, value: 0.1, index: 0 },
    //   { time: 0.5, value: 0.8, index: 1 },
    //   { time: 1.0, value: 0.3, index: 2 },
    //   ...
    // ]
  } catch (error) {
    console.error('Waveform generation failed:', error);
  }
};
```

### Complete Component Example

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getWaveform, WaveformPoint } from '@lvyanxiang/react-native-audio-waveform';

interface AudioWaveformProps {
  audioUrl: string;
  samples?: number;
  onTimeSelect?: (time: number) => void;
}

export default function AudioWaveform({ 
  audioUrl, 
  samples = 1000, 
  onTimeSelect 
}: AudioWaveformProps) {
  const [waveformData, setWaveformData] = useState<WaveformPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (audioUrl) {
      generateWaveform();
    }
  }, [audioUrl, samples]);

  const generateWaveform = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getWaveform({
        url: audioUrl,
        samples: samples
      });
      
      setWaveformData(data);
    } catch (err: any) {
      setError(err.message || '生成波形失败');
    } finally {
      setLoading(false);
    }
  };

  const handleWaveformClick = (point: WaveformPoint) => {
    if (onTimeSelect) {
      onTimeSelect(point.time);
      console.log(`跳转到 ${point.time} 秒位置`);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>正在生成波形...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>错误: {error}</Text>
        <TouchableOpacity onPress={generateWaveform}>
          <Text style={styles.retryText}>点击重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>音频波形</Text>
      <View style={styles.waveformContainer}>
        {waveformData.map((point, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.bar,
              { height: Math.max(2, point.value * 100) }
            ]}
            onPress={() => handleWaveformClick(point)}
          >
            <Text style={styles.timeText}>{point.time.toFixed(1)}s</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
  },
  bar: {
    width: 3,
    backgroundColor: '#007AFF',
    marginRight: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 1,
  },
  timeText: {
    fontSize: 8,
    color: '#666',
    transform: [{ rotate: '90deg' }],
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
```

### Using the Component

```typescript
// In your screen or component
<AudioWaveform 
  audioUrl="file:///path/to/audio.mp3"
  samples={1000}
  onTimeSelect={(time) => {
    // Jump to specific time in audio player
    audioPlayer.seekTo(time);
  }}
/>
```

## 📊 API Reference

### `getWaveform(options: WaveformOptions): Promise<WaveformPoint[]>`

Generates waveform data from an audio file.

#### Parameters

- `options.url` (string, required): Path to the audio file (local or remote)
- `options.samples` (number, optional): Number of waveform points to generate. Default: 200

#### Returns

- `Promise<WaveformPoint[]>`: Array of waveform points with time and value information

### `WaveformPoint` Interface

```typescript
interface WaveformPoint {
  time: number;    // Time in seconds
  value: number;   // Waveform value (0.0-1.0)
  index: number;   // Array index
}
```

## 🎯 Recommended Samples Count

### Based on Audio Duration and Quality:

| Audio Duration | Low Quality | Medium Quality | High Quality | Professional |
|----------------|-------------|----------------|---------------|--------------|
| 1 minute       | 300         | 600            | 900           | 1500         |
| 3 minutes      | 900         | 1800           | 2700          | 4500         |
| 5 minutes      | 1500        | 3000           | 4500          | 7500         |
| 10 minutes     | 3000        | 6000           | 9000          | 15000        |

### Formula:
```typescript
// Recommended samples per second
const samplesPerSecond = 10; // 8-15 range

// Calculate based on duration
const duration = 180; // 3 minutes = 180 seconds
const recommendedSamples = duration * samplesPerSecond;
// Result: 180 * 10 = 1800
```

## 🔧 Troubleshooting

### Common Issues

1. **"Module not found" error**
   - Ensure manual configuration is completed
   - Rebuild the project after configuration

2. **"Permission denied" error**
   - Check file access permissions
   - Ensure audio file path is correct

3. **Waveform too smooth**
   - Increase `samples` count
   - Check if audio file is corrupted

4. **Build fails on Android**
   - Verify `android/settings.gradle` configuration
   - Clean and rebuild project

### Performance Tips

- **Small files (<5MB)**: Use 500-800 samples
- **Medium files (5-20MB)**: Use 800-1200 samples  
- **Large files (20-100MB)**: Use 1200-2000 samples
- **Very large files (>100MB)**: Use 2000+ samples

## 📱 Supported Platforms

- ✅ iOS 12.0+
- ✅ Android API 24+
- ✅ React Native 0.70.0+
- ✅ Expo (with custom development builds)

## 🎵 Supported Audio Formats

- **MP3** - Most common format
- **WAV** - Uncompressed audio
- **AAC** - Apple's preferred format
- **OGG** - Open source format
- **M4A** - iTunes format
- **FLAC** - Lossless compression
- **And more...**

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

If you encounter any issues, please:

1. Check the troubleshooting section above
2. Ensure manual configuration is completed
3. Try with different audio files
4. Open an issue with detailed error information
