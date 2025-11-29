/**
 * @owner 飞友
 * @status 完成
 * @doc See [FEAT-P1-03: CSV导入智能纠错](./../../../开发文档/01_features/FEAT-P1-03_fuzzy-matching-correction.md)
 *
 * 模糊匹配工具
 * 用于智能纠正枚举值的拼写错误
 */

/**
 * 计算两个字符串的 Levenshtein 距离（编辑距离）
 * @param str1 字符串1
 * @param str2 字符串2
 * @returns 编辑距离
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // 创建距离矩阵
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // 初始化第一行和第一列
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // 填充矩阵
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 删除
        matrix[i][j - 1] + 1, // 插入
        matrix[i - 1][j - 1] + cost, // 替换
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * 计算字符串相似度（0-1之间）
 * @param str1 字符串1
 * @param str2 字符串2
 * @returns 相似度分数，1表示完全相同，0表示完全不同
 */
export function similarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * 模糊匹配结果
 */
export interface FuzzyMatchResult<T = string> {
  /**
   * 匹配到的值
   */
  value: T;

  /**
   * 相似度分数 (0-1)
   */
  score: number;

  /**
   * 是否精确匹配
   */
  exact: boolean;
}

/**
 * 在一组候选值中查找最佳匹配
 * @param input 输入值
 * @param candidates 候选值列表
 * @param threshold 最低相似度阈值（默认0.6）
 * @returns 最佳匹配结果，如果没有找到匹配则返回null
 */
export function fuzzyMatch<T = string>(
  input: string,
  candidates: T[],
  threshold = 0.6,
  extractString?: (item: T) => string,
): FuzzyMatchResult<T> | null {
  if (!input || candidates.length === 0) {
    return null;
  }

  const inputLower = input.toLowerCase().trim();

  // 转换函数，用于从候选项提取字符串
  const getString = extractString || ((item: T) => String(item));

  // 计算所有候选值的相似度
  const results = candidates.map((candidate) => {
    const candidateStr = getString(candidate).toLowerCase().trim();

    // 检查是否精确匹配
    const exact = inputLower === candidateStr;

    // 计算相似度
    const score = exact ? 1 : similarity(inputLower, candidateStr);

    return {
      value: candidate,
      score,
      exact,
    };
  });

  // 按相似度降序排序
  results.sort((a, b) => b.score - a.score);

  // 返回最佳匹配（如果超过阈值）
  const best = results[0];
  if (best && best.score >= threshold) {
    return best;
  }

  return null;
}

/**
 * 查找多个匹配结果
 * @param input 输入值
 * @param candidates 候选值列表
 * @param threshold 最低相似度阈值
 * @param limit 返回结果数量限制
 * @returns 匹配结果数组，按相似度降序排序
 */
export function fuzzyMatchAll<T = string>(
  input: string,
  candidates: T[],
  threshold = 0.6,
  limit = 5,
  extractString?: (item: T) => string,
): FuzzyMatchResult<T>[] {
  if (!input || candidates.length === 0) {
    return [];
  }

  const inputLower = input.toLowerCase().trim();
  const getString = extractString || ((item: T) => String(item));

  const results = candidates
    .map((candidate) => {
      const candidateStr = getString(candidate).toLowerCase().trim();
      const exact = inputLower === candidateStr;
      const score = exact ? 1 : similarity(inputLower, candidateStr);

      return {
        value: candidate,
        score,
        exact,
      };
    })
    .filter((result) => result.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}

/**
 * 常见枚举值的映射规则
 */
export const ENUM_MAPPINGS: Record<string, Record<string, string>> = {
  insurance_type: {
    商业保险: "商业险",
    商险: "商业险",
    商业: "商业险",
    交强: "交强险",
    交强保险: "交强险",
    强制险: "交强险",
  },
  renewal_status: {
    新: "新保",
    新保单: "新保",
    续: "续保",
    续保单: "续保",
    转: "转保",
    转保单: "转保",
  },
  coverage_type: {
    全险: "全保",
    基本险: "基本",
    基础: "基本",
  },
};

/**
 * 智能枚举值纠正
 * @param value 输入值
 * @param enumKey 枚举类型（如 'insurance_type'）
 * @param validValues 有效值列表
 * @returns 纠正后的值和置信度
 */
export function correctEnumValue(
  value: string | null | undefined,
  enumKey: string,
  validValues: string[],
): { corrected: string; confidence: number; suggestions: string[] } | null {
  if (!value) return null;

  const trimmed = value.trim();

  // 1. 检查是否已经是有效值
  if (validValues.includes(trimmed)) {
    return {
      corrected: trimmed,
      confidence: 1,
      suggestions: [],
    };
  }

  // 2. 检查预定义的映射规则
  const mapping = ENUM_MAPPINGS[enumKey];
  if (mapping && mapping[trimmed]) {
    return {
      corrected: mapping[trimmed],
      confidence: 0.95,
      suggestions: [],
    };
  }

  // 3. 使用模糊匹配
  const match = fuzzyMatch(trimmed, validValues, 0.6);
  if (match) {
    // 获取其他可能的匹配
    const allMatches = fuzzyMatchAll(trimmed, validValues, 0.5, 3);
    const suggestions = allMatches
      .filter((m) => m.value !== match.value)
      .map((m) => m.value);

    return {
      corrected: match.value,
      confidence: match.score,
      suggestions,
    };
  }

  return null;
}

/**
 * 批量纠正枚举值
 * @param values 输入值数组
 * @param enumKey 枚举类型
 * @param validValues 有效值列表
 * @returns 纠正结果
 */
export interface EnumCorrectionResult {
  original: string;
  corrected: string | null;
  confidence: number;
  needsReview: boolean;
  suggestions: string[];
}

export function correctEnumValues(
  values: (string | null | undefined)[],
  enumKey: string,
  validValues: string[],
): EnumCorrectionResult[] {
  return values
    .filter((v): v is string => v != null && v.trim().length > 0)
    .map((value) => {
      const result = correctEnumValue(value, enumKey, validValues);

      if (!result) {
        return {
          original: value,
          corrected: null,
          confidence: 0,
          needsReview: true,
          suggestions: [],
        };
      }

      return {
        original: value,
        corrected: result.corrected,
        confidence: result.confidence,
        needsReview: result.confidence < 0.8,
        suggestions: result.suggestions,
      };
    });
}
