/**
 * CSV Parsing Web Worker
 * 在后台线程中处理大型CSV文件解析，避免阻塞UI线程
 */

import Papa from 'papaparse';
import { z } from 'zod';
import type { InsuranceRecord } from '@/types/insurance';

// 定义消息类型
interface WorkerMessage {
  type: 'parse';
  data: {
    content: string;
    fileName: string;
    options?: {
      preview?: boolean;
      previewRows?: number;
    };
  };
}

interface WorkerResponse {
  type: 'success' | 'error' | 'progress';
  data?: {
    records?: InsuranceRecord[];
    stats?: {
      totalRows: number;
      validRows: number;
      invalidRows: number;
    };
    errors?: Array<{
      row: number;
      field: string;
      message: string;
      value: any;
    }>;
    progress?: number;
  };
  error?: string;
}

// 验证模式
const insuranceSchema = z.object({
  snapshot_date: z.string(),
  policy_start_year: z.number(),
  policy_end_year: z.number(),
  policy_number: z.string(),
  quote_number: z.string(),
  policyholder: z.string(),
  id_number: z.string(),
  contact_number: z.string(),
  address: z.string(),
  postal_code: z.string(),
  vehicle_type: z.string(),
  vehicle_make: z.string(),
  vehicle_model: z.string(),
  vehicle_model_code: z.string(),
  engine_number: z.string(),
  vin_number: z.string(),
  license_plate: z.string(),
  registration_date: z.string(),
  transfer_date: z.string().optional(),
  new_vehicle_purchase_date: z.string(),
  is_new_energy_vehicle: z.boolean(),
  is_transferred_vehicle: z.boolean(),
  vehicle_use_purpose: z.string(),
  seat_count: z.number(),
  tonnage: z.number(),
  displacement: z.number(),
  year_of_manufacture: z.number(),
  insurance_type: z.enum(['商业险', '交强险']),
  coverage_list: z.string(),
  total_premium: z.number(),
  total_premium_excl_tax: z.number(),
  commercial_insurance_premium: z.number(),
  compulsory_insurance_premium: z.number(),
  vehicle_tax: z.number(),
  insurance_start_date: z.string(),
  insurance_end_date: z.string(),
  insurance_company: z.string(),
  sales_channel: z.string(),
  sales_person: z.string(),
  chain_level: z.number(),
  business_type: z.string(),
  three_level_branch: z.string(),
  two_level_branch: z.string(),
  one_level_branch: z.string(),
  week_number: z.number(),
  renewal_type: z.string(),
  ncd_ratio: z.number(),
  claim_frequency: z.number(),
  claim_amount: z.number(),
  vehicle_price: z.number(),
  actual_value: z.number(),
  sum_insured: z.number(),
  vehicle_age: z.number(),
});

// 类型转换函数
function convertBooleanFields(record: Record<string, any>): Record<string, any> {
  return {
    ...record,
    is_new_energy_vehicle:
      typeof record.is_new_energy_vehicle === 'string'
        ? record.is_new_energy_vehicle === 'True'
        : Boolean(record.is_new_energy_vehicle),
    is_transferred_vehicle:
      typeof record.is_transferred_vehicle === 'string'
        ? record.is_transferred_vehicle === 'True'
        : Boolean(record.is_transferred_vehicle),
  };
}

function parseNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

function transformRecord(record: Record<string, any>): InsuranceRecord {
  const converted = convertBooleanFields(record);

  return {
    snapshot_date: converted.snapshot_date || '',
    policy_start_year: parseNumber(converted.policy_start_year, new Date().getFullYear()),
    policy_end_year: parseNumber(converted.policy_end_year, new Date().getFullYear()),
    policy_number: converted.policy_number || '',
    quote_number: converted.quote_number || '',
    policyholder: converted.policyholder || '',
    id_number: converted.id_number || '',
    contact_number: converted.contact_number || '',
    address: converted.address || '',
    postal_code: converted.postal_code || '',
    vehicle_type: converted.vehicle_type || '',
    vehicle_make: converted.vehicle_make || '',
    vehicle_model: converted.vehicle_model || '',
    vehicle_model_code: converted.vehicle_model_code || '',
    engine_number: converted.engine_number || '',
    vin_number: converted.vin_number || '',
    license_plate: converted.license_plate || '',
    registration_date: converted.registration_date || '',
    transfer_date: converted.transfer_date || undefined,
    new_vehicle_purchase_date: converted.new_vehicle_purchase_date || '',
    is_new_energy_vehicle: Boolean(converted.is_new_energy_vehicle),
    is_transferred_vehicle: Boolean(converted.is_transferred_vehicle),
    vehicle_use_purpose: converted.vehicle_use_purpose || '',
    seat_count: parseNumber(converted.seat_count, 0),
    tonnage: parseNumber(converted.tonnage, 0),
    displacement: parseNumber(converted.displacement, 0),
    year_of_manufacture: parseNumber(converted.year_of_manufacture, 0),
    insurance_type: converted.insurance_type || '商业险',
    coverage_list: converted.coverage_list || '',
    total_premium: parseNumber(converted.total_premium, 0),
    total_premium_excl_tax: parseNumber(converted.total_premium_excl_tax, 0),
    commercial_insurance_premium: parseNumber(converted.commercial_insurance_premium, 0),
    compulsory_insurance_premium: parseNumber(converted.compulsory_insurance_premium, 0),
    vehicle_tax: parseNumber(converted.vehicle_tax, 0),
    insurance_start_date: converted.insurance_start_date || '',
    insurance_end_date: converted.insurance_end_date || '',
    insurance_company: converted.insurance_company || '',
    sales_channel: converted.sales_channel || '',
    sales_person: converted.sales_person || '',
    chain_level: parseNumber(converted.chain_level, 0),
    business_type: converted.business_type || '',
    three_level_branch: converted.three_level_branch || '',
    two_level_branch: converted.two_level_branch || '',
    one_level_branch: converted.one_level_branch || '',
    week_number: parseNumber(converted.week_number, 0),
    renewal_type: converted.renewal_type || '',
    ncd_ratio: parseNumber(converted.ncd_ratio, 0),
    claim_frequency: parseNumber(converted.claim_frequency, 0),
    claim_amount: parseNumber(converted.claim_amount, 0),
    vehicle_price: parseNumber(converted.vehicle_price, 0),
    actual_value: parseNumber(converted.actual_value, 0),
    sum_insured: parseNumber(converted.sum_insured, 0),
    vehicle_age: parseNumber(converted.vehicle_age, 0),
  };
}

// 主处理函数
self.onmessage = function(event: MessageEvent<WorkerMessage>) {
  const { type, data } = event.data;

  if (type === 'parse') {
    const { content, fileName, options } = data;

    // 从文件名提取周次
    const weekNumberFromFile = parseInt(fileName.match(/第(\d+)周/)?.[1] || '0', 10);

    const config = {
      header: true,
      dynamicTyping: false, // 手动处理类型转换
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      chunk: options?.preview ? undefined : (results: any, parser: any) => {
        // 发送进度更新
        const progress = Math.round((parser.streamer.chunkSize / content.length) * 100);
        self.postMessage({
          type: 'progress',
          data: { progress: Math.min(progress, 99) }
        });
      },
      complete: (results: Papa.ParseResult<Record<string, any>>) => {
        try {
          const stats = {
            totalRows: results.data.length,
            validRows: 0,
            invalidRows: 0,
          };

          const validRecords: InsuranceRecord[] = [];
          const errors: any[] = [];

          // 限制预览行数
          const dataToProcess = options?.preview
            ? results.data.slice(0, options.previewRows || 100)
            : results.data;

          dataToProcess.forEach((record, index) => {
            try {
              // 转换数据类型
              const transformedRecord = transformRecord(record);

              // 补充周次信息
              if (!transformedRecord.week_number || transformedRecord.week_number === 0) {
                transformedRecord.week_number = weekNumberFromFile;
              }

              // 验证数据
              const validation = insuranceSchema.safeParse(transformedRecord);

              if (validation.success) {
                validRecords.push(validation.data);
                stats.validRows++;
              } else {
                stats.invalidRows++;
                errors.push({
                  row: index + 2, // +2 because of header and 0-based index
                  field: validation.error.errors[0]?.path.join('.') || 'unknown',
                  message: validation.error.errors[0]?.message || 'Validation failed',
                  value: validation.error.errors[0]?.received,
                });
              }
            } catch (error) {
              stats.invalidRows++;
              errors.push({
                row: index + 2,
                field: 'general',
                message: error instanceof Error ? error.message : 'Unknown error',
                value: record,
              });
            }
          });

          // 发送成功结果
          self.postMessage({
            type: 'success',
            data: {
              records: validRecords,
              stats,
              errors: errors.slice(0, 10), // 只返回前10个错误
            },
          });
        } catch (error) {
          self.postMessage({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        }
      },
      error: (error: any) => {
        self.postMessage({
          type: 'error',
          error: error.message || 'Failed to parse CSV',
        });
      },
    };

    // 开始解析
    Papa.parse(content, config);
  }
};