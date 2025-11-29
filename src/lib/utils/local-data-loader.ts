/**
 * @name local-data-loader.ts
 * @description 服务器端本地数据加载器
 *
 * 负责在应用程序启动时，从本地文件系统加载所有周度的CSV数据文件，
 * 对其进行解析、验证和合并，为前端提供完整的初始数据集。
 */

import fs from "fs";
import path from "path";
import { DataService } from "@/services/DataService";
import type { InsuranceRecord } from "@/types/insurance";

/**
 * 转换CSV行数据中的布尔字段
 * Papa.parse 的 dynamicTyping 不会将 "True"/"False" 转换为布尔值
 */
function convertBooleanFields(record: any): any {
  return {
    ...record,
    is_new_energy_vehicle:
      typeof record.is_new_energy_vehicle === "string"
        ? record.is_new_energy_vehicle === "True"
        : record.is_new_energy_vehicle,
    is_transferred_vehicle:
      typeof record.is_transferred_vehicle === "string"
        ? record.is_transferred_vehicle === "True"
        : record.is_transferred_vehicle,
  };
}

/**
 * 加载并合并所有本地的周度CSV数据。
 *
 * @returns {Promise<InsuranceRecord[]>} 返回一个包含所有已验证和去重记录的数组。
 */
export async function loadAllLocalData(): Promise<InsuranceRecord[]> {
  const dataDir = path.join(process.cwd(), "多周数据");
  console.log(`[LocalLoader] 开始从 ${dataDir} 加载数据...`);

  try {
    const fileNames = fs
      .readdirSync(dataDir)
      .filter((file) => file.endsWith(".csv"))
      .sort(); // 排序确保顺序一致

    if (fileNames.length === 0) {
      console.warn('[LocalLoader] 在 "多周数据" 目录中未找到任何 .csv 文件。');
      return [];
    }

    console.log(
      `[LocalLoader] 发现 ${fileNames.length} 个CSV文件:`,
      fileNames.join(", "),
    );

    const allRecords: InsuranceRecord[] = [];
    let totalParsed = 0;
    let totalValid = 0;
    let totalInvalid = 0;

    // 检查是否在服务端环境
  const isServerSide = typeof window === 'undefined';

  if (isServerSide) {
    // 服务端使用原始解析器
    const { parseCSVContent } = await import("@/lib/parsers/csv-parser");

    for (const fileName of fileNames) {
      const filePath = path.join(dataDir, fileName);
      console.log(`[LocalLoader] 正在处理: ${fileName} (服务端)`);

      const fileContent = fs.readFileSync(filePath, "utf-8");
      const parseResult = await parseCSVContent(fileContent);

      totalParsed += parseResult.stats.totalRows;
      totalValid += parseResult.stats.validRows;
      totalInvalid += parseResult.stats.invalidRows;

      if (parseResult.success && parseResult.data.length > 0) {
        // 从文件名提取周次作为备用
        const weekNumberFromFile = parseInt(
          fileName.match(/第(\d+)周/)?.[1] || "0",
          10,
        );

        const dataWithWeekNumber = parseResult.data.map((record) => {
          if (
            !record.week_number ||
            record.week_number === 0
          ) {
            return { ...record, week_number: weekNumberFromFile };
          }
          return record;
        });

        allRecords.push(...dataWithWeekNumber);
        console.log(
          `[LocalLoader]   ✓ ${fileName}: ${parseResult.stats.validRows}/${parseResult.stats.totalRows} 条有效记录`,
        );
      } else {
        console.warn(`[LocalLoader]   ✗ ${fileName}: 解析失败或无有效数据`);
        if (parseResult.errors.length > 0) {
          console.warn(
            `[LocalLoader]     前3个错误:`,
            parseResult.errors.slice(0, 3),
          );
        }
      }
    }
  } else {
    // 客户端使用 Web Worker 版本
    const { parseCSVContent } = await import("@/lib/parsers/csv-parser-v2");

    for (const fileName of fileNames) {
      const filePath = path.join(dataDir, fileName);
      console.log(`[LocalLoader] 正在处理: ${fileName} (客户端 Web Worker)`);

      const fileContent = fs.readFileSync(filePath, "utf-8");

      // 使用优化的 CSV parser with Web Worker
      const parseResult = await parseCSVContent(fileContent, fileName, {
        onProgress: (progress) => {
          console.log(
            `[LocalLoader]   ${fileName}: ${progress.percentage.toFixed(1)}%`
          );
        },
      });

      totalParsed += parseResult.stats.totalRows;
      totalValid += parseResult.stats.validRows;
      totalInvalid += parseResult.stats.invalidRows;

      if (parseResult.success && parseResult.data.length > 0) {
        allRecords.push(...parseResult.data);
        console.log(
          `[LocalLoader]   ✓ ${fileName}: ${parseResult.stats.validRows}/${parseResult.stats.totalRows} 条有效记录`,
        );
      } else {
        console.warn(`[LocalLoader]   ✗ ${fileName}: 解析失败或无有效数据`);
        if (parseResult.errors.length > 0) {
          console.warn(
            `[LocalLoader]     前3个错误:`,
            parseResult.errors.slice(0, 3),
          );
        }
      }
    }
  }

    console.log(
      `[LocalLoader] 所有文件解析完成。总计: ${totalParsed} 条, 有效: ${totalValid} 条, 无效: ${totalInvalid} 条`,
    );
    console.log(`[LocalLoader] 开始数据去重...`);

    // DataService.merge 内部会调用 deduplicate
    const finalData = DataService.merge(allRecords);
    console.log(
      `[LocalLoader] 去重完成，最终剩余 ${finalData.length} 条记录。`,
    );

    return finalData;
  } catch (error) {
    console.error("[LocalLoader] 加载本地数据时发生严重错误:", error);
    return []; // 发生错误时返回空数组，避免应用崩溃
  }
}
