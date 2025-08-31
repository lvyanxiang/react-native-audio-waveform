import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { generateWaveform, isProcessing, cancelWaveform } from '../src/index';

export default function SimpleExample() {
  const [loading, setLoading] = useState(false);
  const [waveformData, setWaveformData] = useState<any[]>([]);

  const handleGenerateWaveform = () => {
    // 检查是否已经在处理
    isProcessing().then((processing) => {
      if (processing) {
        Alert.alert('提示', '已有任务正在处理中');
        return;
      }

      // 设置loading状态
      setLoading(true);
      setWaveformData([]);

      // 调用波形生成
      const result = generateWaveform(
        {
          url: '/path/to/your/audio/file.mp3', // 替换为你的音频文件路径
          samples: 100, // 生成100个波形点
          type: 'amplitude', // 波形类型
        },
        (waveformResult) => {
          // 回调函数，处理生成结果
          setLoading(false); // 处理完成，设置loading为false
          
          if (waveformResult.data) {
            setWaveformData(waveformResult.data);
            console.log('波形数据生成完成:', waveformResult.data.length, '个点');
          } else if (waveformResult.error) {
            console.log('波形生成失败:', waveformResult.error);
            Alert.alert('错误', waveformResult.error);
          }
        }
      );

      // 立即获取loading状态
      console.log('开始生成波形，loading状态:', result.loading);
    });
  };

  const handleCancel = () => {
    cancelWaveform();
    setLoading(false);
    setWaveformData([]);
    Alert.alert('提示', '已取消波形生成');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>音频波形生成示例</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGenerateWaveform}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '生成中...' : '生成波形'}
          </Text>
        </TouchableOpacity>

        {loading && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          状态: {loading ? '处理中...' : '空闲'}
        </Text>
        <Text style={styles.statusText}>
          波形点数: {waveformData.length}
        </Text>
      </View>

      {waveformData.length > 0 && (
        <ScrollView style={styles.dataContainer}>
          <Text style={styles.dataTitle}>波形数据预览:</Text>
          {waveformData.slice(0, 10).map((point, index) => (
            <Text key={index} style={styles.dataText}>
              点{point.index}: 时间={point.time.toFixed(2)}s, 值={point.value.toFixed(3)}
            </Text>
          ))}
          {waveformData.length > 10 && (
            <Text style={styles.dataText}>... 还有 {waveformData.length - 10} 个点</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  dataContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    maxHeight: 300,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  dataText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
    fontFamily: 'monospace',
  },
});
