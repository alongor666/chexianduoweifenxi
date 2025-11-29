/**
 * @name local-data-loader.ts
 * @description 服务器端本地数据加载器
 *
 * 负责在应用程序启动时，从本地文件系统加载所有周度的CSV数据文件，
 * 对其进行解析、验证和合并，为前端提供完整的初始数据集。
 */

import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { DataService } from "@/services/DataService";
import { validateRecords } from "@/lib/validations/insurance-schema";
import type { InsuranceRecord } from "@/types/insurance";

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
      .filter((file) => file.endsWith(".csv"));

    if (fileNames.length === 0) {
      console.warn('[LocalLoader] 在 "多周数据" 目录中未找到任何 .csv 文件。');
      return [];
    }

    console.log(
      `[LocalLoader] 发现 ${fileNames.length} 个CSV文件:`,
      fileNames.join(", "),
    );

    const allRecords: Record<string, any>[] = [];

    for (const fileName of fileNames) {
      const filePath = path.join(dataDir, fileName);
      const fileContent = fs.readFileSync(filePath, "utf-8");

      const parseResult = Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true, // 自动转换类型
        skipEmptyLines: true,
      });

      if (parseResult.data) {
        // 在此处添加 week_number 字段的修正
        const weekNumberFromFile = parseInt(
          fileName.match(/第(\d+)周/)?.[1] || "0",
          10,
        );
        const dataWithWeekNumber = parseResult.data.map((record: any) => {
          if (
            record.week_number === null ||
            record.week_number === undefined ||
            record.week_number === 0
          ) {
            record.week_number = weekNumberFromFile;
          }
          return record;
        });
        allRecords.push(...(dataWithWeekNumber as Record<string, any>[]));
      }
    }

    console.log(
      `[LocalLoader] 所有文件解析完成，总共 ${allRecords.length} 条原始记录。`,
    );
    console.log(`[LocalLoader] 开始数据验证...`);

    const { validData, invalidRecords } = validateRecords(allRecords);

    console.log(
      `[LocalLoader] 验证完成。有效记录: ${validData.length}, 无效记录: ${invalidRecords.length}`,
    );
    if (invalidRecords.length > 0) {
      console.warn(
        `[LocalLoader] 前5条无效记录详情:`,
        invalidRecords.slice(0, 5),
      );
    }

    console.log(`[LocalLoader] 开始数据去重...`);
    // DataService.merge 内部会调用 deduplicate
    const finalData = DataService.merge(validData as InsuranceRecord[]);
    console.log(
      `[LocalLoader] 去重完成，最终剩余 ${finalData.length} 条记录。`,
    );

    return finalData;
  } catch (error) {
    console.error("[LocalLoader] 加载本地数据时发生严重错误:", error);
    return []; // 发生错误时返回空数组，避免应用崩溃
  }
}
