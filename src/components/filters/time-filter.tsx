"use client";

import { FilterContainer } from "./filter-container";
import { MultiSelectFilter } from "./multi-select-filter";
import { WeekSelector } from "./week-selector";
import { useAppStore } from "@/store/use-app-store";
import { useFilterStore } from "@/store/domains/filterStore";
import { filterRecordsWithExclusions } from "@/store/use-app-store";

export function TimeFilter() {
  const filters = useFilterStore((state) => state.filters);
  const updateFilters = useFilterStore((state) => state.updateFilters);
  const updateAppFilters = useAppStore((state) => state.updateFilters);
  const rawData = useAppStore((state) => state.rawData);

  // 同步更新两个store的筛选器
  const handleUpdateFilters = (newFilters: any) => {
    updateFilters(newFilters);
    updateAppFilters(newFilters);
  };

  // 联动：根据其他筛选条件，分别计算年度与周的可选项
  const recordsForYears = filterRecordsWithExclusions(rawData, filters, [
    "years",
  ]);
  const recordsForWeeks = filterRecordsWithExclusions(rawData, filters, [
    "weeks",
  ]);

  const availableYears = Array.from(
    new Set(recordsForYears.map((record) => record.policy_start_year)),
  )
    .sort((a, b) => b - a)
    .map((year) => ({ label: `${year}年`, value: String(year) }));

  const availableWeeks = Array.from(
    new Set(recordsForWeeks.map((record) => record.week_number)),
  )
    .sort((a, b) => a - b)
    .map((week) => ({ label: `W${week}`, value: String(week), week }));

  const handleYearChange = (years: string[]) => {
    handleUpdateFilters({ years: years.map(Number) });
  };

  const handleReset = () => {
    handleUpdateFilters({
      years: [],
      weeks: [],
      singleModeWeek: null,
      trendModeWeeks: [],
    });
  };

  const hasFilters =
    filters.years.length > 0 ||
    (filters.viewMode === "single"
      ? filters.singleModeWeek != null
      : filters.trendModeWeeks.length > 0);

  return (
    <FilterContainer
      title="时间维度"
      onReset={hasFilters ? handleReset : undefined}
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs text-slate-600">
            保单年度
          </label>
          <MultiSelectFilter
            options={availableYears}
            selectedValues={filters.years.map(String)}
            onChange={handleYearChange}
            placeholder="选择年度"
            searchPlaceholder="搜索年度..."
            emptyText="未找到年度"
          />
        </div>
        <div>
          <WeekSelector availableWeeks={availableWeeks} />
        </div>
      </div>
    </FilterContainer>
  );
}
