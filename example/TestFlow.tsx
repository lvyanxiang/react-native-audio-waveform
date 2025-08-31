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

export default function TestFlow() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testFlow = () => {
    addLog('=== 开始测试流程 ===');
    
    // 1. 测试初始状态
    addLog(`初始状态 - isProcessing: ${isProcessing()}`);
    
    // 2. 调用generateWaveform
    addLog('调用 generateWaveform...');
    const result = generateWaveform(
      {
        url: '/test/audio.mp3',
        samples: 50,
        type: 'amplitude'
      },
      (waveformResult) => {
        addLog('收到回调结果:');
        if (waveformResult.data) {
          addLog(`✅ 成功 - 数据点数: ${waveformResult.data.length}`);
          setLoading(false);
        } else if (waveformResult.error) {
          addLog(`❌ 失败 - 错误: ${waveformResult.error}`);
          setLoading(false);
        }
      }
    );
    
    // 3. 验证立即返回结果
    addLog(`立即返回结果: ${JSON.stringify(result)}`);
    addLog(`返回的loading状态: ${result.loading}`);
    
    // 4. 设置loading状态
    setLoading(true);
    
    // 5. 检查处理状态
    setTimeout(() => {
      addLog(`延迟检查 - isProcessing: ${isProcessing()}`);
    }, 100);
  };

  const testCancel = () => {
    addLog('测试取消功能...');
    cancelWaveform();
    addLog(`取消后 - isProcessing: ${isProcessing()}`);
    setLoading(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>流程测试</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testFlow}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '测试中...' : '测试流程'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={testCancel}>
          <Text style={styles.cancelButtonText}>测试取消</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
          <Text style={styles.clearButtonText}>清空日志</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          当前状态: {loading ? '处理中' : '空闲'}
        </Text>
        <Text style={styles.statusText}>
          isProcessing(): {isProcessing().toString()}
        </Text>
      </View>

      <ScrollView style={styles.logsContainer}>
        <Text style={styles.logsTitle}>测试日志:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
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
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
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
  logsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    flex: 1,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  logText: {
    fontSize: 12,
    marginBottom: 3,
    color: '#666',
    fontFamily: 'monospace',
  },
});
