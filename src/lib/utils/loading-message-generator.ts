/**
 * 智能加载文案生成器
 * 根据加载进度和数据类型生成有意义的加载提示
 */

export interface LoadingMessageConfig {
  /**
   * 当前操作阶段
   */
  stage: 'init' | 'connecting' | 'reading' | 'parsing' | 'processing' | 'validating' | 'completed';

  /**
   * 数据类型
   */
  dataType: 'csv' | 'json' | 'excel' | 'api' | 'database' | 'local';

  /**
   * 当前进度
   */
  progress: number;

  /**
   * 已加载数量
   */
  loaded: number;

  /**
   * 总数量
   */
  total: number;

  /**
   * 文件名或数据源名称
   */
  sourceName?: string;

  /**
   * 周数（如果是周数据）
   */
  weekNumber?: number;

  /**
   * 是否显示详细信息
   */
  verbose?: boolean;
}

export interface LoadingMessage {
  /**
   * 主要消息
   */
  primary: string;

  /**
   * 次要消息（可选）
   */
  secondary?: string;

  /**
   * 详细消息（可选）
   */
  detail?: string;

  /**
   * 预计剩余时间（秒）
   */
  estimatedTime?: number;

  /**
   * 处理速度（条/秒）
   */
  speed?: number;
}

class LoadingMessageGenerator {
  private startTime: number = 0;
  private lastProgress: number = 0;
  private lastTime: number = 0;

  /**
   * 生成加载消息
   */
  generate(config: LoadingMessageConfig): LoadingMessage {
    const { stage, progress, loaded, total, sourceName, weekNumber, verbose } = config;

    // 计算处理速度和预计时间
    const currentTime = Date.now();
    if (this.startTime === 0 && loaded > 0) {
      this.startTime = currentTime;
      this.lastProgress = loaded;
      this.lastTime = currentTime;
    }

    const timeElapsed = (currentTime - this.startTime) / 1000;
    const recentTimeElapsed = (currentTime - this.lastTime) / 1000;
    const recentProgress = loaded - this.lastProgress;

    let speed: number | undefined;
    let estimatedTime: number | undefined;

    if (timeElapsed > 0 && loaded > 0) {
      speed = loaded / timeElapsed;
      if (speed > 0 && total > loaded) {
        estimatedTime = (total - loaded) / speed;
      }

      // 更新上次记录
      if (recentTimeElapsed > 1) {
        this.lastProgress = loaded;
        this.lastTime = currentTime;
      }
    }

    // 生成主要消息
    const primary = this.generatePrimaryMessage(config);

    // 生成次要消息
    const secondary = this.generateSecondaryMessage(config, speed);

    // 生成详细消息
    const detail = verbose ? this.generateDetailMessage(config, estimatedTime) : undefined;

    return {
      primary,
      secondary,
      detail,
      estimatedTime,
      speed,
    };
  }

  /**
   * 生成主要消息
   */
  private generatePrimaryMessage(config: LoadingMessageConfig): string {
    const { stage, dataType, sourceName, weekNumber } = config;

    const stageMessages = {
      init: {
        csv: '📂 准备解析CSV文件...',
        json: '📄 准备读取JSON数据...',
        excel: '📊 准备加载Excel表格...',
        api: '🌐 连接到API服务器...',
        database: '🗄️ 连接到数据库...',
        local: '💾 读取本地数据...',
      },
      connecting: {
        csv: `📂 正在打开 ${sourceName || 'CSV文件'}...`,
        json: `📄 正在读取 ${sourceName || 'JSON数据'}...`,
        excel: `📊 正在加载 ${sourceName || 'Excel文件'}...`,
        api: '🌐 正在建立连接...',
        database: '🗄️ 正在查询数据库...',
        local: '💾 正在访问本地文件...',
      },
      reading: {
        csv: '📖 正在读取CSV数据行...',
        json: '📖 正在解析JSON结构...',
        excel: '📖 正在读取Excel工作表...',
        api: '📡 正在获取API数据...',
        database: '🔍 正在执行SQL查询...',
        local: '📖 正在读取文件内容...',
      },
      parsing: {
        csv: '🔍 正在解析CSV数据格式...',
        json: '🔍 正在解析JSON字段...',
        excel: '🔍 正在转换Excel数据...',
        api: '🔄 正在处理API响应...',
        database: '🔄 正在转换查询结果...',
        local: '🔍 正在解析数据格式...',
      },
      processing: {
        csv: weekNumber
          ? `⚡ 正在处理第 ${weekNumber} 周数据...`
          : '⚡ 正在处理数据记录...',
        json: '⚡ 正在处理JSON对象...',
        excel: '⚡ 正在处理Excel数据...',
        api: '⚡ 正在处理API数据...',
        database: '⚡ 正在处理数据库记录...',
        local: '⚡ 正在处理数据...',
      },
      validating: {
        csv: '✅ 正在验证数据完整性...',
        json: '✅ 正在验证JSON格式...',
        excel: '✅ 正在验证Excel数据...',
        api: '✅ 正在验证API数据...',
        database: '✅ 正在验证查询结果...',
        local: '✅ 正在验证数据...',
      },
      completed: {
        csv: '🎉 CSV数据加载完成！',
        json: '🎉 JSON数据加载完成！',
        excel: '🎉 Excel数据加载完成！',
        api: '🎉 API数据获取完成！',
        database: '🎉 数据查询完成！',
        local: '🎉 本地数据加载完成！',
      },
    };

    return stageMessages[stage]?.[dataType] || '正在处理数据...';
  }

  /**
   * 生成次要消息
   */
  private generateSecondaryMessage(
    config: LoadingMessageConfig,
    speed?: number
  ): string | undefined {
    const { progress, loaded, total, dataType } = config;

    if (progress === 100) {
      return `成功加载 ${loaded.toLocaleString('zh-CN')} 条记录`;
    }

    // 显示加载进度
    const progressText = `进度 ${progress.toFixed(1)}% (${loaded.toLocaleString('zh-CN')} / ${total?.toLocaleString('zh-CN') || '∞'} 条)`;

    // 显示处理速度
    if (speed && speed > 0) {
      const speedText = `速度 ${speed.toFixed(0)} 条/秒`;
      return `${progressText} · ${speedText}`;
    }

    return progressText;
  }

  /**
   * 生成详细消息
   */
  private generateDetailMessage(
    config: LoadingMessageConfig,
    estimatedTime?: number
  ): string | undefined {
    const { stage, dataType, progress } = config;

    // 阶段相关的详细信息
    const stageDetails = {
      init: {
        csv: '检查文件格式和编码...',
        json: '验证JSON结构...',
        excel: '检测工作表和列...',
        api: '初始化连接参数...',
        database: '建立数据库连接...',
        local: '定位数据文件...',
      },
      connecting: {
        csv: '打开文件并准备读取...',
        json: '加载JSON到内存...',
        excel: '初始化Excel解析器...',
        api: '发送连接请求...',
        database: '执行数据库连接...',
        local: '读取文件元数据...',
      },
      reading: {
        csv: '逐行读取CSV内容...',
        json: '递归解析JSON树...',
        excel: '读取单元格数据...',
        api: '接收API响应流...',
        database: '获取查询结果集...',
        local: '流式读取文件...',
      },
      parsing: {
        csv: '转换数据类型和格式...',
        json: '映射JSON到数据模型...',
        excel: '处理公式和格式...',
        api: '解析JSON响应...',
        database: '映射字段到对象...',
        local: '解析数据结构...',
      },
      processing: {
        csv: '应用业务规则和验证...',
        json: '转换和清理数据...',
        excel: '计算和处理数据...',
        api: '转换API数据格式...',
        database: '后处理查询结果...',
        local: '应用数据转换...',
      },
      validating: {
        csv: '检查必填字段和值域...',
        json: '验证数据完整性...',
        excel: '验证数据一致性...',
        api: '验证响应数据...',
        database: '验证数据完整性...',
        local: '执行数据校验...',
      },
      completed: {
        csv: '数据已准备就绪',
        json: '数据已准备就绪',
        excel: '数据已准备就绪',
        api: '数据已准备就绪',
        database: '数据已准备就绪',
        local: '数据已准备就绪',
      },
    };

    const detail = stageDetails[stage]?.[dataType];

    if (!detail) return undefined;

    // 添加预计时间
    if (estimatedTime && estimatedTime > 0 && progress < 100) {
      const minutes = Math.floor(estimatedTime / 60);
      const seconds = Math.floor(estimatedTime % 60);
      const timeText = minutes > 0 ? `预计还需 ${minutes} 分 ${seconds} 秒` : `预计还需 ${seconds} 秒`;
      return `${detail} · ${timeText}`;
    }

    return detail;
  }

  /**
   * 重置计时器
   */
  reset(): void {
    this.startTime = 0;
    this.lastProgress = 0;
    this.lastTime = 0;
  }
}

// 导出单例实例
export const loadingMessageGenerator = new LoadingMessageGenerator();

/**
 * 便捷函数：生成智能加载消息
 */
export function generateLoadingMessage(config: Partial<LoadingMessageConfig>): LoadingMessage {
  const defaultConfig: LoadingMessageConfig = {
    stage: 'processing',
    dataType: 'local',
    progress: 0,
    loaded: 0,
    total: 0,
    verbose: false,
  };

  return loadingMessageGenerator.generate({ ...defaultConfig, ...config });
}