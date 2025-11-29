import { describe, expect, it } from "vitest";
import { parseGoalCsv } from "../csvParser";
import { GoalCsvParseError } from "@/types/goal";
import { KNOWN_BUSINESS_TYPES } from "@/store/goalStore";

// 使用 KNOWN_BUSINESS_TYPES 中实际存在的业务类型
const validCsv = `业务类型,年度目标（万）\n网约车,100\n摩托车,200\n`;

describe("parseGoalCsv", () => {
  it("parses valid csv data", () => {
    const result = parseGoalCsv(validCsv, {
      knownBusinessTypes: KNOWN_BUSINESS_TYPES,
    });
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({ bizType: "网约车", annualTarget: 100 });
    expect(result.data[1]).toEqual({ bizType: "摩托车", annualTarget: 200 });
  });

  it("throws when required columns missing", () => {
    const csv = `业务类型\n网约车`;
    expect(() =>
      parseGoalCsv(csv, {
        knownBusinessTypes: KNOWN_BUSINESS_TYPES,
      }),
    ).toThrow(GoalCsvParseError);
  });

  it("throws when encountering non numeric value", () => {
    const csv = `业务类型,年度目标（万）\n网约车,abc`;
    expect(() =>
      parseGoalCsv(csv, {
        knownBusinessTypes: KNOWN_BUSINESS_TYPES,
      }),
    ).toThrow(GoalCsvParseError);
  });

  it("throws when duplicate business types found", () => {
    const csv = `业务类型,年度目标（万）\n网约车,100\n网约车,120`;
    expect(() =>
      parseGoalCsv(csv, {
        knownBusinessTypes: KNOWN_BUSINESS_TYPES,
      }),
    ).toThrow(GoalCsvParseError);
  });

  it("throws on unknown business type by default", () => {
    const csv = `业务类型,年度目标（万）\n未知业务,100`;
    expect(() =>
      parseGoalCsv(csv, {
        knownBusinessTypes: KNOWN_BUSINESS_TYPES,
      }),
    ).toThrow(GoalCsvParseError);
  });

  it("ignores unknown business type when configured", () => {
    const csv = `业务类型,年度目标（万）\n未知业务,100`;
    const result = parseGoalCsv(csv, {
      knownBusinessTypes: KNOWN_BUSINESS_TYPES,
      unknownBusinessStrategy: "ignore",
    });
    expect(result.rows).toHaveLength(0);
    expect(result.ignoredUnknownCount).toBe(1);
  });
});
