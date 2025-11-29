/**
 * CSV数据转换器测试
 */

import { describe, it, expect } from 'vitest';
import {
  convertBooleanFields,
  parseNumber,
  transformRecord,
  extractWeekNumber,
} from '../csv-data-transformer';
import type { InsuranceRecord } from '@/types/insurance';

describe('CSV Data Transformer', () => {
  describe('convertBooleanFields', () => {
    it('should convert string "True" to boolean true', () => {
      const record = { is_new_energy_vehicle: 'True' };
      const result = convertBooleanFields(record);
      expect(result.is_new_energy_vehicle).toBe(true);
    });

    it('should convert string "False" to boolean false', () => {
      const record = { is_transferred_vehicle: 'False' };
      const result = convertBooleanFields(record);
      expect(result.is_transferred_vehicle).toBe(false);
    });

    it('should preserve boolean values', () => {
      const record = { is_new_energy_vehicle: true, is_transferred_vehicle: false };
      const result = convertBooleanFields(record);
      expect(result.is_new_energy_vehicle).toBe(true);
      expect(result.is_transferred_vehicle).toBe(false);
    });

    it('should convert undefined to false', () => {
      const record = { is_new_energy_vehicle: undefined };
      const result = convertBooleanFields(record);
      expect(result.is_new_energy_vehicle).toBe(false);
    });
  });

  describe('parseNumber', () => {
    it('should parse valid number string', () => {
      expect(parseNumber('123')).toBe(123);
      expect(parseNumber('456.78')).toBe(456.78);
    });

    it('should return default value for invalid input', () => {
      expect(parseNumber(null)).toBe(0);
      expect(parseNumber(undefined)).toBe(0);
      expect(parseNumber('')).toBe(0);
      expect(parseNumber('abc')).toBe(0);
    });

    it('should use custom default value', () => {
      expect(parseNumber(null, 100)).toBe(100);
      expect(parseNumber('abc', 100)).toBe(100);
    });
  });

  describe('transformRecord', () => {
    it('should transform a valid record', () => {
      const input = {
        snapshot_date: '2024-01-01',
        policy_number: 'POL001',
        is_new_energy_vehicle: 'True',
        total_premium: '1000.50',
        week_number: '5',
      };

      const result = transformRecord(input);

      expect(result).toMatchObject<Partial<InsuranceRecord>>({
        snapshot_date: '2024-01-01',
        policy_number: 'POL001',
        is_new_energy_vehicle: true,
        total_premium: 1000.50,
        week_number: 5,
      });
    });

    it('should use default values for missing fields', () => {
      const input = {};
      const result = transformRecord(input);

      expect(result.snapshot_date).toBe('');
      expect(result.policy_number).toBe('');
      expect(result.is_new_energy_vehicle).toBe(false);
      expect(result.total_premium).toBe(0);
    });

    it('should use week number from file name when missing', () => {
      const input = { policy_number: 'POL001' };
      const result = transformRecord(input, 10);

      expect(result.week_number).toBe(10);
    });
  });

  describe('extractWeekNumber', () => {
    it('should extract week number from valid file name', () => {
      expect(extractWeekNumber('第5周数据.csv')).toBe(5);
      expect(extractWeekNumber('第42周保险数据.csv')).toBe(42);
    });

    it('should return 0 for invalid file name', () => {
      expect(extractWeekNumber('data.csv')).toBe(0);
      expect(extractWeekNumber('第五周数据.csv')).toBe(0);
      expect(extractWeekNumber('week5.csv')).toBe(0);
    });
  });
});