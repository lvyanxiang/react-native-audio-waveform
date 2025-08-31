import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {
  generateWaveform,
  getWaveformState,
  onWaveformStateChange,
  cancelWaveform,
  isProcessing,
  WaveformState,
  WaveformPoint,
} from 'react-native-audio-waveform';

export default function AsyncExample() {
  const [waveformState, setWaveformState] = useState<WaveformState>({
    loading: false,
    message: '空闲',
  });

  useEffect(() => {
    // 监听状态变化
    onWaveformStateChange((newState: WaveformState) => {
      console.log('状态变化:', newState);
      setWaveformState(newState);
    });

    // 获取当前状态
    getCurrentState();
  }, []);

  const getCurrentState = async () => {
    try {
      const state = await getWaveformState();
      setWaveformState(state);
    } catch (error) {
      console.error('获取状态失败:', error);
    }
  };

  const handleGenerateWaveform = () => {
    // 立即开始处理，不阻塞UI
    const initialState = generateWaveform({
      url: '/path/to/your/audio.mp3', // 替换为实际路径
      samples: 200,
      type: 'amplitude',
    });

    // 立即更新UI状态
    setWaveformState(initialState);
    
    console.log('开始生成波形，初始状态:', initialState);
  };

  const handleCancel = () => {
    cancelWaveform();
    Alert.alert('已取消', '波形生成任务已取消');
  };

  const handleRefresh = () => {
    getCurrentState();
  };

  // 渲染波形图
  const renderWaveform = (data: WaveformPoint[]) => {
    if (!data || data.length === 0) {
      return <Text style={styles.noData}>无波形数据</Text>;
    }

    return (
      <View style={styles.waveformContainer}>
        <Text style={styles.waveformTitle}>波形图预览</Text>
        <View style={styles.barsContainer}>
          {data.map((point, index) => (
            <View
              key={index}
              style={[
                styles.bar,
                { height: Math.max(2, point.value * 100) },
              ]}
            />
          ))}
        </View>
        <Text style={styles.stats}>
          总点数: {data.length} | 时长: {data[data.length - 1]?.time?.toFixed(1)}s
        </Text>
      </View>
    );
  };

  // 渲染状态信息
  const renderStatusInfo = () => {
    const { loading, message, error, data } = waveformState;

    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>当前状态</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>处理状态:</Text>
          <View style={styles.statusValue}>
            {loading ? (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>处理中</Text>
              </View>
            ) : (
              <Text style={styles.idleText}>空闲</Text>
            )}
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>消息:</Text>
          <Text style={styles.statusValue}>{message}</Text>
        </View>

        {error && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>错误:</Text>
            <Text style={[styles.statusValue, styles.errorText]}>{error}</Text>
          </View>
        )}

        {data && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>数据点数:</Text>
            <Text style={styles.statusValue}>{data.length}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>异步音频波形生成器</Text>
      
      {/* 状态信息 */}
      {renderStatusInfo()}

      {/* 操作按钮 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleGenerateWaveform}
          disabled={waveformState.loading}
        >
          <Text style={styles.buttonText}>生成波形</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={!waveformState.loading}
        >
          <Text style={styles.buttonText}>取消任务</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={handleRefresh}
        >
          <Text style={styles.buttonText}>刷新状态</Text>
        </TouchableOpacity>
      </View>

      {/* 波形显示 */}
      {waveformState.data && !waveformState.loading && (
        renderWaveform(waveformState.data)
      )}

      {/* 使用说明 */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>新API特点</Text>
        <Text style={styles.instructionText}>
          ✅ 立即返回状态，不阻塞UI
        </Text>
        <Text style={styles.instructionText}>
          ✅ 实时状态更新，支持进度显示
        </Text>
        <Text style={styles.instructionText}>
          ✅ 可以随时取消正在进行的任务
        </Text>
        <Text style={styles.instructionText}>
          ✅ 支持状态监听和手动刷新
        </Text>
        <Text style={styles.instructionText}>
          ✅ 后台处理，不影响用户体验
        </Text>
      </View>

      {/* 技术说明 */}
      <View style={styles.techInfo}>
        <Text style={styles.techTitle}>技术实现</Text>
        <Text style={styles.techText}>
          • Android: 使用ExecutorService在后台线程处理
        </Text>
        <Text style={styles.techText}>
          • iOS: 使用DispatchQueue在后台队列处理
        </Text>
        <Text style={styles.techText}>
          • 状态管理: 实时更新并通知UI
        </Text>
        <Text style={styles.techText}>
          • 资源管理: 自动清理和错误恢复
        </Text>
      </View>
    </ScrollView>
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
  statusContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  statusValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '600',
  },
  idleText: {
    color: '#34C759',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontWeight: '600',
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
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  refreshButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  waveformContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  waveformTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    padding: 8,
  },
  bar: {
    width: 2,
    backgroundColor: '#007AFF',
    marginRight: 1,
    borderRadius: 1,
  },
  stats: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  instructions: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
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
    marginBottom: 8,
    lineHeight: 20,
  },
  techInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  techTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  techText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
