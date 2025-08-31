import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  getWaveform,
  cancelWaveform,
  isProcessing,
  WaveformResult,
} from 'react-native-audio-waveform';

export default function SimpleExample() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WaveformResult | null>(null);

  const handleGenerateWaveform = async () => {
    try {
      setLoading(true);
      setResult(null);

      // 注意：这里需要替换为实际的音频文件路径
      const audioUrl = '/path/to/your/audio.mp3';
      
      const waveformResult = await getWaveform({
        url: audioUrl,
        samples: 100,
        type: 'amplitude',
      });

      setResult(waveformResult);
      
      if (waveformResult.status === 'success') {
        Alert.alert('成功', `生成了 ${waveformResult.data?.length} 个波形点`);
      } else {
        Alert.alert('失败', waveformResult.message || '未知错误');
      }
    } catch (error) {
      console.error('生成波形失败:', error);
      Alert.alert('错误', '生成波形时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    cancelWaveform();
    Alert.alert('已取消', '波形生成任务已取消');
  };

  const checkStatus = () => {
    const processing = isProcessing();
    Alert.alert('状态', processing ? '正在处理中' : '空闲');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>音频波形生成器</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleGenerateWaveform}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>生成波形</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleCancel}
        >
          <Text style={styles.buttonText}>取消任务</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={checkStatus}
        >
          <Text style={styles.buttonText}>检查状态</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>处理结果</Text>
          <Text style={styles.resultText}>
            状态: {result.status === 'success' ? '成功' : '失败'}
          </Text>
          {result.message && (
            <Text style={styles.resultText}>消息: {result.message}</Text>
          )}
          {result.error && (
            <Text style={styles.resultText}>错误: {result.error}</Text>
          )}
          {result.status === 'success' && result.data && (
            <Text style={styles.resultText}>
              数据点数: {result.data.length}
            </Text>
          )}
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>使用说明</Text>
        <Text style={styles.instructionText}>
          1. 点击"生成波形"开始处理音频文件
        </Text>
        <Text style={styles.instructionText}>
          2. 处理过程中可以点击"取消任务"停止
        </Text>
        <Text style={styles.instructionText}>
          3. 使用"检查状态"查看当前处理状态
        </Text>
        <Text style={styles.instructionText}>
          4. 记得替换示例中的音频文件路径
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#FF3B30',
  },
  infoButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  instructions: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
});
