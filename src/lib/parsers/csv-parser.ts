/**
 * CSV 文件解析器 - 优化版
 * 使用 Papa Parse 实现流式解析，支持大文件，优化内存使用和错误处理
 */

import Papa from "papaparse";
import type {
  InsuranceRecord,
  VehicleInsuranceGrade,
  HighwayRiskGrade,
  TruckScore,
} from "@/types/insurance";
import { validateRecords } from "../validations/insurance-schema";
import { fuzzyMatch, ENUM_MAPPINGS } from "./fuzzy-matcher";
import { normalizeChineseText } from "@/lib/utils";

type SupportedEncoding = "utf-8" | "gb18030" | "gbk" | "gb2312";
const FALLBACK_ENCODINGS: SupportedEncoding[] = ["gb18030", "gbk", "gb2312"];

function decodeBufferWithEncoding(
  buffer: ArrayBuffer,
  encoding: SupportedEncoding,
): string | null {
  try {
    const decoder = new TextDecoder(encoding, { fatal: false });
    return decoder.decode(buffer);
  } catch (error) {
    console.warn(`[CSV Parser] 当前环境不支持编码 ${encoding}`, error);
    return null;
  }
}

function evaluateDecodedTextQuality(text: string): number {
  const sample = text.slice(0, 20000);
  let cjkCount = 0;
  let replacementCount = 0;
  let latinExtendedCount = 0;

  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code === 0xfffd) {
      replacementCount++;
      continue;
    }
    if (
      (code >= 0x4e00 && code <= 0x9fff) || // 基本中日韩统一表意文字
      (code >= 0x3400 && code <= 0x4dbf) // 扩展A
    ) {
      cjkCount++;
      continue;
    }
    if (code >= 0x00c0 && code <= 0x024f) {
      latinExtendedCount++;
    }
  }

  return cjkCount * 5 - replacementCount * 20 - latinExtendedCount;
}

async function normalizeFileEncoding(file: File): Promise<{
  file: File;
  encoding: SupportedEncoding;
}> {
  // 先采样前 256KB 数据用于编码判断，避免一次性读取超大文件
  const sampleSize = Math.min(file.size, 256 * 1024);
  const sampleBuffer = await file.slice(0, sampleSize).arrayBuffer();

  const candidateEncodings: SupportedEncoding[] = [
    "utf-8",
    ...FALLBACK_ENCODINGS,
  ];

  const candidates = candidateEncodings
    .map((encoding) => {
      const sampleText = decodeBufferWithEncoding(sampleBuffer, encoding);
      if (sampleText === null) {
        return null;
      }

      const score = evaluateDecodedTextQuality(sampleText);
      return { encoding, score };
    })
    .filter(
      (item): item is { encoding: SupportedEncoding; score: number } =>
        item !== null,
    );

  if (candidates.length === 0) {
    return { file, encoding: "utf-8" };
  }

  const bestCandidate = candidates.reduce((best, current) =>
    current.score > best.score ? current : best,
  );

  if (bestCandidate.encoding === "utf-8") {
    return { file, encoding: "utf-8" };
  }

  console.info(
    `[CSV Parser] 检测到可能的非 UTF-8 编码 (${bestCandidate.encoding})，开始转换...`,
  );

  const fullBuffer = await file.arrayBuffer();
  const decodedText =
    decodeBufferWithEncoding(fullBuffer, bestCandidate.encoding) ??
    decodeBufferWithEncoding(fullBuffer, "utf-8") ??
    "";

  const normalizedFile = new File([decodedText], file.name, {
    type: "text/csv;charset=utf-8",
  });

  return {
    file: normalizedFile,
    encoding: bestCandidate.encoding,
  };
}

/**
 * CSV 解析结果
 */
export interface CSVParseResult {
  success: boolean;
  data: InsuranceRecord[];
  errors: Array<{
    row: number;
    field?: string;
    message: string;
    severity: "error" | "warning" | "info";
  }>;
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    parseTime: number;
    fileSize: number;
    processingSpeed: number; // 行/秒
    encoding: string;
  };
}

/**
 * 解析进度回调 - 增强版
 */
export type ProgressCallback = (progress: {
  percentage: number;
  processedRows: number;
  currentPhase: "parsing" | "validating" | "transforming";
  estimatedTimeRemaining?: number;
  totalRows?: number; // 总行数估算
  errorCount?: number; // 错误计数
}) => void;

/**
 * 转换 CSV 行数据为 InsuranceRecord 格式
 */
function transformCSVRow(
  row: Record<string, unknown>,
  rowIndex: number,
): {
  data: Partial<InsuranceRecord>;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    console.log(`[CSV Parser] 转换第 ${rowIndex + 1} 行:`, row);

    const data: Partial<InsuranceRecord> = {
      // 时间维度 - 添加格式验证
      snapshot_date: String(row.snapshot_date || "").trim(),
      policy_start_year: parseNumber(
        row.policy_start_year,
        "policy_start_year",
        errors,
      ),
      week_number: parseNumber(row.week_number, "week_number", errors),

      // 组织维度
      chengdu_branch: parseEnum(
        row.chengdu_branch,
        ["成都", "中支"],
        "成都",
      ) as "成都" | "中支",
      third_level_organization: normalizeChineseText(
        String(row.third_level_organization || "").trim(),
      ),

      // 客户维度
      customer_category_3: normalizeChineseText(
        String(row.customer_category_3 || "").trim(),
      ),

      // 产品维度
      insurance_type: parseEnum(
        row.insurance_type,
        ["商业险", "交强险"],
        "商业险",
        "insurance_type",
      ) as "商业险" | "交强险",
      business_type_category: normalizeChineseText(
        String(row.business_type_category || "").trim(),
      ),
      coverage_type: parseEnum(
        row.coverage_type,
        ["主全", "交三", "单交"],
        "主全",
        "coverage_type",
      ) as "主全" | "交三" | "单交",

      // 业务属性
      renewal_status: parseEnum(
        row.renewal_status,
        ["新保", "续保", "转保"],
        "新保",
        "renewal_status",
      ) as "新保" | "续保" | "转保",
      is_new_energy_vehicle: parseBoolean(
        row.is_new_energy_vehicle,
        "is_new_energy_vehicle",
        errors,
      ),
      is_transferred_vehicle: parseBoolean(
        row.is_transferred_vehicle,
        "is_transferred_vehicle",
        errors,
      ),

      // 评级维度 - 允许空值，不设置默认值
      vehicle_insurance_grade: parseOptionalEnum<VehicleInsuranceGrade>(
        row.vehicle_insurance_grade,
        ["A", "B", "C", "D", "E", "F", "G"],
      ),
      highway_risk_grade: parseOptionalEnum<HighwayRiskGrade>(
        row.highway_risk_grade,
        ["A", "B", "C", "D", "E", "F", "X"],
      ),
      large_truck_score: parseOptionalEnum<TruckScore>(row.large_truck_score, [
        "A",
        "B",
        "C",
        "D",
        "E",
        "X",
      ]),
      small_truck_score: parseOptionalEnum<TruckScore>(row.small_truck_score, [
        "A",
        "B",
        "C",
        "D",
        "E",
        "X",
      ]),

      // 渠道维度
      terminal_source: normalizeChineseText(
        String(row.terminal_source || "").trim(),
      ),

      // 业务指标 - 添加范围验证
      signed_premium_yuan: parseNumber(
        row.signed_premium_yuan,
        "signed_premium_yuan",
        errors,
        { min: 0, max: 10000000 },
      ),
      matured_premium_yuan: parseNumber(
        row.matured_premium_yuan,
        "matured_premium_yuan",
        errors,
        { min: 0, max: 10000000 },
      ),
      policy_count: parseNumber(row.policy_count, "policy_count", errors, {
        min: 0,
        integer: true,
      }),
      claim_case_count: parseNumber(
        row.claim_case_count,
        "claim_case_count",
        errors,
        { min: 0, integer: true },
      ),
      reported_claim_payment_yuan: parseNumber(
        row.reported_claim_payment_yuan,
        "reported_claim_payment_yuan",
        errors,
        { min: 0 },
      ),
      expense_amount_yuan: parseNumber(
        row.expense_amount_yuan,
        "expense_amount_yuan",
        errors,
        { min: 0 },
      ),
      commercial_premium_before_discount_yuan: parseNumber(
        row.commercial_premium_before_discount_yuan,
        "commercial_premium_before_discount_yuan",
        errors,
        { min: 0 },
      ),
      premium_plan_yuan:
        row.premium_plan_yuan !== null &&
        row.premium_plan_yuan !== undefined &&
        row.premium_plan_yuan !== ""
          ? parseNumber(row.premium_plan_yuan, "premium_plan_yuan", errors, {
              min: 0,
            })
          : null,
      marginal_contribution_amount_yuan: parseNumber(
        row.marginal_contribution_amount_yuan,
        "marginal_contribution_amount_yuan",
        errors,
      ),
    };

    console.log(
      `[CSV Parser] 第 ${rowIndex + 1} 行转换完成，错误数: ${errors.length}`,
    );
    return { data, errors };
  } catch (error) {
    const errorMsg = `行 ${rowIndex + 1}: 数据转换失败 - ${error instanceof Error ? error.message : "未知错误"}`;
    console.error(`[CSV Parser] ${errorMsg}`, error);
    errors.push(errorMsg);
    return { data: {}, errors };
  }
}

/**
 * 解析数字 - 增强版，支持字符串数字转换
 */
function parseNumber(
  value: unknown,
  fieldName: string,
  errors: string[],
  options: { min?: number; max?: number; integer?: boolean } = {},
): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  // 处理字符串格式的数字，去除空格
  let processedValue = value;
  if (typeof value === "string") {
    processedValue = value.trim();
    if (processedValue === "") {
      return 0;
    }
  }

  const num = Number(processedValue);
  if (isNaN(num)) {
    errors.push(`${fieldName}: 无效的数字格式 "${value}"`);
    return 0;
  }

  if (options.integer && !Number.isInteger(num)) {
    errors.push(`${fieldName}: 必须是整数，当前值 "${value}"`);
    return Math.round(num);
  }

  if (options.min !== undefined && num < options.min) {
    errors.push(`${fieldName}: 值 ${num} 小于最小值 ${options.min}`);
    return options.min;
  }

  if (options.max !== undefined && num > options.max) {
    errors.push(`${fieldName}: 值 ${num} 大于最大值 ${options.max}`);
    return options.max;
  }

  return num;
}

/**
 * 解析枚举值 - 支持值映射转换、模糊匹配和空值处理
 */
function parseEnum<T extends string>(
  value: unknown,
  validValues: T[],
  defaultValue: T,
  enumKey?: string,
): T {
  const str = String(value || "").trim();

  // 如果是空值，直接返回默认值
  if (!str) {
    return defaultValue;
  }

  // 1. 精确匹配
  if (validValues.includes(str as T)) {
    return str as T;
  }

  // 2. 检查预定义的映射规则
  if (enumKey) {
    const mapping = ENUM_MAPPINGS[enumKey];
    if (mapping && mapping[str]) {
      const mapped = mapping[str];
      if (validValues.includes(mapped as T)) {
        return mapped as T;
      }
    }
  }

  // 3. 模糊匹配（相似度阈值60%）
  const fuzzyResult = fuzzyMatch(str, validValues, 0.6);
  if (fuzzyResult) {
    console.log(
      `[智能纠错] "${str}" → "${fuzzyResult.value}" (相似度: ${(fuzzyResult.score * 100).toFixed(1)}%)`,
    );
    return fuzzyResult.value;
  }

  // 4. 都失败了，返回默认值
  console.warn(
    `[枚举解析警告] 无法匹配 "${str}"，使用默认值 "${defaultValue}"`,
  );
  return defaultValue;
}

/**
 * 解析可选枚举值 - 允许空值，支持模糊匹配
 */
function parseOptionalEnum<T extends string>(
  value: unknown,
  validValues: T[],
  enumKey?: string,
): T | undefined {
  const str = String(value || "").trim();

  // 如果是空值，返回 undefined
  if (!str) {
    return undefined;
  }

  // 1. 精确匹配
  if (validValues.includes(str as T)) {
    return str as T;
  }

  // 2. 检查预定义的映射规则
  if (enumKey) {
    const mapping = ENUM_MAPPINGS[enumKey];
    if (mapping && mapping[str]) {
      const mapped = mapping[str];
      if (validValues.includes(mapped as T)) {
        return mapped as T;
      }
    }
  }

  // 3. 模糊匹配（相似度阈值60%）
  const fuzzyResult = fuzzyMatch(str, validValues, 0.6);
  if (fuzzyResult) {
    console.log(
      `[智能纠错] "${str}" → "${fuzzyResult.value}" (相似度: ${(fuzzyResult.score * 100).toFixed(1)}%)`,
    );
    return fuzzyResult.value;
  }

  // 4. 都失败了，返回 undefined
  console.warn(`[可选枚举解析警告] 无法匹配 "${str}"，返回 undefined`);
  return undefined;
}

/**
 * 解析布尔值 - 支持多种格式，包括字符串"False"/"True"
 */
function parseBoolean(
  value: unknown,
  fieldName: string,
  warnings: string[],
): boolean {
  if (typeof value === "boolean") return value;
  const raw = String(value || "").trim();

  // 严格规范：首字母大写 True/False
  if (raw === "True") return true;
  if (raw === "False") return false;

  const normalized = raw.toLowerCase();
  const truthy = ["true", "1", "yes", "y", "是"];
  const falsy = ["false", "0", "no", "n", "否"];

  if (truthy.includes(normalized)) {
    warnings.push(`${fieldName}: 非标准布尔值 "${raw}" 已按 True 处理`);
    return true;
  }
  if (falsy.includes(normalized)) {
    warnings.push(`${fieldName}: 非标准布尔值 "${raw}" 已按 False 处理`);
    return false;
  }

  warnings.push(`${fieldName}: 无效布尔值 "${raw}"，已默认 False`);
  return false;
}

/**
 * 解析 CSV 文件 - 优化版
 * @param file CSV 文件对象
 * @param onProgress 进度回调函数
 * @returns 解析结果
 */
export async function parseCSVFile(
  file: File,
  onProgress?: ProgressCallback,
): Promise<CSVParseResult> {
  console.log(
    `[CSV Parser] 开始解析文件: ${file.name}, 大小: ${file.size} bytes`,
  );
  const startTime = performance.now();
  let processedRows = 0;

  const { file: sourceFile, encoding } = await normalizeFileEncoding(file);
  const encodingLabel = encoding !== "utf-8" ? `${encoding}→utf-8` : "utf-8";

  if (encoding !== "utf-8") {
    console.info(
      `[CSV Parser] 已自动将 ${file.name} 从 ${encoding} 转换为 UTF-8 编码`,
    );
  } else {
    console.info(`[CSV Parser] 使用 UTF-8 编码解析 ${file.name}`);
  }

  return new Promise((resolve, reject) => {
    const rows: Record<string, unknown>[] = [];
    const transformErrors: Array<{ row: number; errors: string[] }> = [];
    let headersChecked = false;

    // 必需字段列表（26个）- 按实际CSV文件字段顺序排列
    const REQUIRED_FIELDS = [
      "snapshot_date",
      "policy_start_year",
      "business_type_category",
      "chengdu_branch",
      "third_level_organization",
      "customer_category_3",
      "insurance_type",
      "is_new_energy_vehicle",
      "coverage_type",
      "is_transferred_vehicle",
      "renewal_status",
      "vehicle_insurance_grade",
      "highway_risk_grade",
      "large_truck_score",
      "small_truck_score",
      "terminal_source",
      "signed_premium_yuan",
      "matured_premium_yuan",
      "policy_count",
      "claim_case_count",
      "reported_claim_payment_yuan",
      "expense_amount_yuan",
      "commercial_premium_before_discount_yuan",
      "premium_plan_yuan",
      "marginal_contribution_amount_yuan",
      "week_number",
    ];

    // 更新进度的辅助函数
    const updateProgress = (
      phase: "parsing" | "validating" | "transforming",
      percentage: number,
    ) => {
      if (onProgress) {
        const elapsed = performance.now() - startTime;
        const estimatedTotal = elapsed / (percentage / 100);
        const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);

        // 估算总行数（基于文件大小和已处理行数）
        const estimatedTotalRows =
          processedRows > 0 && percentage > 0
            ? Math.round(processedRows / (percentage / 100))
            : undefined;

        // 计算当前错误数量
        const currentErrorCount = transformErrors.length;

        onProgress({
          percentage: Math.min(percentage, 99),
          processedRows,
          currentPhase: phase,
          estimatedTimeRemaining:
            estimatedTimeRemaining > 1000 ? estimatedTimeRemaining : undefined,
          totalRows: estimatedTotalRows,
          errorCount: currentErrorCount,
        });
      }
    };

    console.log(`[CSV Parser] 开始 Papa Parse 解析 - 优化大文件处理`);
    Papa.parse<Record<string, string>>(sourceFile, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      worker: true,
      // 优化大文件处理：增大块大小以提高性能
      chunkSize: sourceFile.size > 50 * 1024 * 1024 ? 1024 * 256 : 1024 * 64, // 大文件使用更大的块
      chunk: (results, parser) => {
        try {
          console.log(
            `[CSV Parser] 处理批次数据，行数: ${results.data?.length || 0}`,
          );

          // 检查表头字段（仅检查一次）
          if (!headersChecked) {
            headersChecked = true;
            const fields = results.meta?.fields;

            let present: string[] | undefined = fields ?? undefined;
            if (!present || present.length === 0) {
              const firstRow = results.data?.[0] || {};
              present = Object.keys(firstRow || {});
            }

            console.log(
              `[CSV Parser] 检测到表头字段 (${present?.length || 0}个):`,
              present,
            );
            console.log(
              `[CSV Parser] 必需字段 (${REQUIRED_FIELDS.length}个):`,
              REQUIRED_FIELDS,
            );

            const missing = REQUIRED_FIELDS.filter(
              (f) => !(present || []).includes(f),
            );
            if (missing.length > 0) {
              console.error(
                `[CSV Parser] 缺失必需字段 (${missing.length}个):`,
                missing,
              );
              parser.abort();
              reject(
                new Error(
                  `CSV 表头缺失必需字段 (${missing.length}个): ${missing.join(", ")}\n\n请确保CSV文件包含所有必需字段。\n参考文档: CSV导入规范.md`,
                ),
              );
              return;
            }

            // 检查是否有额外字段
            const extra = (present || []).filter(
              (f) => !REQUIRED_FIELDS.includes(f),
            );
            if (extra.length > 0) {
              console.warn(
                `[CSV Parser] 发现额外字段 (${extra.length}个):`,
                extra,
              );
            }

            console.log(`[CSV Parser] 表头验证通过 ✓`);
          }

          // 检查数据是否存在且为数组
          if (!results.data || !Array.isArray(results.data)) {
            console.warn(
              "[CSV Parser] CSV 解析批次数据为空或格式错误:",
              results,
            );
            return;
          }

          const batchData = results.data;
          console.log(`[CSV Parser] 开始处理 ${batchData.length} 行数据`);

          // 优化大数据量处理：批量处理数据行
          const BATCH_SIZE = 1000; // 每批处理1000行
          for (let i = 0; i < batchData.length; i += BATCH_SIZE) {
            const batch = batchData.slice(i, i + BATCH_SIZE);

            batch.forEach((row) => {
              if (
                row &&
                typeof row === "object" &&
                Object.keys(row).length > 0
              ) {
                const globalIndex = rows.length;
                const { data, errors } = transformCSVRow(row, globalIndex);

                rows.push(data as Record<string, unknown>);
                processedRows++;

                if (errors.length > 0) {
                  transformErrors.push({
                    row: globalIndex + 1,
                    errors,
                  });

                  // 记录前几个错误的详细信息
                  if (transformErrors.length <= 5) {
                    console.warn(
                      `[CSV Parser] 第 ${globalIndex + 1} 行数据转换错误:`,
                      errors,
                    );
                    console.warn(`[CSV Parser] 原始数据:`, row);
                  }
                }
              }
            });

            // 每处理一批数据后更新进度
            const progress = Math.min(
              (processedRows / (sourceFile.size / 1000)) * 50,
              50,
            );
            updateProgress("parsing", progress);

            // 给浏览器一个喘息的机会，避免阻塞UI
            if (i % (BATCH_SIZE * 10) === 0) {
              setTimeout(() => {}, 0);
            }
          }

          if (typeof results.meta?.cursor === "number") {
            const progress = (results.meta.cursor / sourceFile.size) * 80;
            updateProgress("parsing", progress);
          }

          console.log(
            `[CSV Parser] 批次处理完成，累计处理 ${processedRows} 行`,
          );
        } catch (error) {
          console.error("[CSV Parser] CSV 解析批次处理错误:", error);
          parser.abort();
          reject(
            new Error(
              `CSV 解析失败: ${error instanceof Error ? error.message : "未知错误"}`,
            ),
          );
        }
      },
      complete: async () => {
        try {
          console.log(`[CSV Parser] Papa Parse 完成，总行数: ${rows.length}`);

          if (!rows || rows.length === 0) {
            console.error("[CSV Parser] CSV 文件为空或没有有效数据");
            reject(new Error("CSV 文件为空或没有有效数据"));
            return;
          }

          updateProgress("validating", 85);
          console.log(`[CSV Parser] 开始 Zod 验证`);
          const validationResult = validateRecords(rows);
          console.log(
            `[CSV Parser] Zod 验证完成，有效记录: ${validationResult.validRecords}, 无效记录: ${validationResult.invalidRecords.length}`,
          );

          updateProgress("transforming", 95);
          updateProgress("transforming", 100);

          const parseTime = performance.now() - startTime;
          const processingSpeed = Math.round(
            (processedRows / parseTime) * 1000,
          );

          const allErrors = [
            ...transformErrors.map((err) => ({
              row: err.row,
              message: err.errors.join("; "),
              severity: "warning" as const,
            })),
            ...validationResult.invalidRecords.map((invalid) => ({
              row: invalid.index + 1,
              message: invalid.errors.join("; "),
              severity: "error" as const,
            })),
          ];

          console.log(
            `[CSV Parser] 解析完成，成功: ${validationResult.validRecords > 0}, 总错误: ${allErrors.length}`,
          );

          resolve({
            success: validationResult.validRecords > 0,
            data: validationResult.validData as InsuranceRecord[],
            errors: allErrors,
            stats: {
              totalRows: processedRows,
              validRows: validationResult.validRecords,
              invalidRows:
                validationResult.invalidRecords.length + transformErrors.length,
              parseTime: Math.round(parseTime),
              fileSize: sourceFile.size,
              processingSpeed,
              encoding: encodingLabel,
            },
          });
        } catch (error) {
          console.error("[CSV Parser] 数据验证失败:", error);
          reject(
            new Error(
              `数据验证失败: ${error instanceof Error ? error.message : "未知错误"}`,
            ),
          );
        }
      },
      error: (error) => {
        console.error("[CSV Parser] Papa Parse 错误:", error);
        reject(new Error(`CSV 解析失败: ${error.message || "未知错误"}`));
      },
    });
  });
}

/**
 * 验证 CSV 文件格式
 */
export function validateCSVFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // 检查文件类型
  if (!file.name.endsWith(".csv")) {
    return {
      valid: false,
      error: "文件格式错误，请上传 CSV 文件",
    };
  }

  // 检查文件大小（限制 50MB）
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件过大，最大支持 ${maxSize / 1024 / 1024}MB`,
    };
  }

  // 检查文件名格式（可选）
  const weeklyPattern = /^\d{4}保单第\d{1,3}周变动成本明细表\.csv$/;
  const summaryPattern = /^\d{2}年保单\d{1,3}-\d{1,3}周变动成本汇总表\.csv$/;

  if (!weeklyPattern.test(file.name) && !summaryPattern.test(file.name)) {
    console.warn("文件名格式不标准，但继续处理:", file.name);
  }

  return { valid: true };
}

/**
 * 导出数据为 CSV
 */
export function exportToCSV(
  data: InsuranceRecord[],
  filename: string = "导出数据.csv",
): void {
  const csv = Papa.unparse(data, {
    header: true,
  });

  // 添加 UTF-8 BOM（为了 Excel 正确识别编码）
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });

  // 创建下载链接
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
