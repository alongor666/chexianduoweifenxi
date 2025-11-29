/**
 * CSV 数据转换器
 * 负责将原始CSV数据转换为InsuranceRecord格式
 */

import type { InsuranceRecord } from '@/types/insurance';

/**
 * 转换布尔字段
 */
export function convertBooleanFields(record: Record<string, any>): Record<string, any> {
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

/**
 * 转换数字字段
 */
export function parseNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 转换单个记录为InsuranceRecord
 */
export function transformRecord(
  record: Record<string, any>,
  weekNumberFromFile: number = 0
): InsuranceRecord {
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
    week_number: parseNumber(converted.week_number) || weekNumberFromFile,
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

/**
 * 从文件名提取周次
 */
export function extractWeekNumber(fileName: string): number {
  const match = fileName.match(/第(\d+)周/);
  return match ? parseInt(match[1], 10) : 0;
}