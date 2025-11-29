/**
 * 评级筛选器可见性逻辑单元测试
 */

import { describe, it, expect } from "vitest";
import {
  shouldShowPassengerRatings,
  shouldShowSmallTruckRating,
  shouldShowLargeTruckRating,
  getRatingVisibility,
  PASSENGER_CUSTOMER_CATEGORIES,
  PASSENGER_BUSINESS_TYPES,
  SMALL_TRUCK_BUSINESS_TYPES,
  LARGE_TRUCK_BUSINESS_TYPES,
} from "../rating-visibility";

describe("评级筛选器可见性逻辑", () => {
  describe("shouldShowPassengerRatings - 客车评级显示逻辑", () => {
    it("未选择任何筛选条件时应显示客车评级", () => {
      const filters = {
        customerCategories: [],
        businessTypes: [],
      };
      expect(shouldShowPassengerRatings(filters)).toBe(true);
    });

    it("选择了客车相关客户类别时应显示客车评级", () => {
      const filters = {
        customerCategories: ["非营业个人客车"],
        businessTypes: [],
      };
      expect(shouldShowPassengerRatings(filters)).toBe(true);
    });

    it("选择了客车相关业务类型时应显示客车评级", () => {
      const filters = {
        customerCategories: [],
        businessTypes: ["出租车"],
      };
      expect(shouldShowPassengerRatings(filters)).toBe(true);
    });

    it("同时选择了客车客户类别和业务类型时应显示客车评级", () => {
      const filters = {
        customerCategories: ["非营业企业客车"],
        businessTypes: ["网约车"],
      };
      expect(shouldShowPassengerRatings(filters)).toBe(true);
    });

    it("只选择了货车类别时不应显示客车评级", () => {
      const filters = {
        customerCategories: ["营业货车"],
        businessTypes: [],
      };
      expect(shouldShowPassengerRatings(filters)).toBe(false);
    });

    it("只选择了货车业务类型时不应显示客车评级", () => {
      const filters = {
        customerCategories: [],
        businessTypes: ["10吨以上-普货"],
      };
      expect(shouldShowPassengerRatings(filters)).toBe(false);
    });

    it("混合选择客车和货车时应显示客车评级", () => {
      const filters = {
        customerCategories: ["非营业个人客车", "营业货车"],
        businessTypes: [],
      };
      expect(shouldShowPassengerRatings(filters)).toBe(true);
    });

    it("所有客车客户类别都应触发显示", () => {
      PASSENGER_CUSTOMER_CATEGORIES.forEach((category) => {
        const filters = {
          customerCategories: [category],
          businessTypes: [],
        };
        expect(shouldShowPassengerRatings(filters)).toBe(true);
      });
    });

    it("所有客车业务类型都应触发显示", () => {
      PASSENGER_BUSINESS_TYPES.forEach((businessType) => {
        const filters = {
          customerCategories: [],
          businessTypes: [businessType],
        };
        expect(shouldShowPassengerRatings(filters)).toBe(true);
      });
    });
  });

  describe("shouldShowSmallTruckRating - 小货车评级显示逻辑", () => {
    it("未选择业务类型时应显示小货车评级", () => {
      const filters = {
        businessTypes: [],
      };
      expect(shouldShowSmallTruckRating(filters)).toBe(true);
    });

    it("选择了小货车业务类型时应显示小货车评级", () => {
      const filters = {
        businessTypes: ["2-9吨营业货车"],
      };
      expect(shouldShowSmallTruckRating(filters)).toBe(true);
    });

    it("选择了大货车业务类型时不应显示小货车评级", () => {
      const filters = {
        businessTypes: ["10吨以上-普货"],
      };
      expect(shouldShowSmallTruckRating(filters)).toBe(false);
    });

    it("混合选择小货车和大货车业务类型时应显示小货车评级", () => {
      const filters = {
        businessTypes: ["2吨以下营业货车", "10吨以上-牵引"],
      };
      expect(shouldShowSmallTruckRating(filters)).toBe(true);
    });

    it("选择客车业务类型时不应显示小货车评级", () => {
      const filters = {
        businessTypes: ["出租车"],
      };
      expect(shouldShowSmallTruckRating(filters)).toBe(false);
    });

    it("所有小货车业务类型都应触发显示", () => {
      SMALL_TRUCK_BUSINESS_TYPES.forEach((businessType) => {
        const filters = {
          businessTypes: [businessType],
        };
        expect(shouldShowSmallTruckRating(filters)).toBe(true);
      });
    });
  });

  describe("shouldShowLargeTruckRating - 大货车评级显示逻辑", () => {
    it("未选择业务类型时应显示大货车评级", () => {
      const filters = {
        businessTypes: [],
      };
      expect(shouldShowLargeTruckRating(filters)).toBe(true);
    });

    it("选择了大货车业务类型时应显示大货车评级", () => {
      const filters = {
        businessTypes: ["10吨以上-普货"],
      };
      expect(shouldShowLargeTruckRating(filters)).toBe(true);
    });

    it("选择了小货车业务类型时不应显示大货车评级", () => {
      const filters = {
        businessTypes: ["2-9吨营业货车"],
      };
      expect(shouldShowLargeTruckRating(filters)).toBe(false);
    });

    it("混合选择小货车和大货车业务类型时应显示大货车评级", () => {
      const filters = {
        businessTypes: ["2吨以下营业货车", "自卸"],
      };
      expect(shouldShowLargeTruckRating(filters)).toBe(true);
    });

    it("选择客车业务类型时不应显示大货车评级", () => {
      const filters = {
        businessTypes: ["网约车"],
      };
      expect(shouldShowLargeTruckRating(filters)).toBe(false);
    });

    it("所有大货车业务类型都应触发显示", () => {
      LARGE_TRUCK_BUSINESS_TYPES.forEach((businessType) => {
        const filters = {
          businessTypes: [businessType],
        };
        expect(shouldShowLargeTruckRating(filters)).toBe(true);
      });
    });
  });

  describe("getRatingVisibility - 综合可见性配置", () => {
    it("未选择任何条件时所有评级都应显示", () => {
      const filters = {
        customerCategories: [],
        businessTypes: [],
      };
      const visibility = getRatingVisibility(filters);
      expect(visibility).toEqual({
        showVehicleGrade: true,
        showHighwayRisk: true,
        showSmallTruck: true,
        showLargeTruck: true,
      });
    });

    it("仅选择客车时只显示客车相关评级", () => {
      const filters = {
        customerCategories: ["非营业个人客车"],
        businessTypes: ["出租车"],
      };
      const visibility = getRatingVisibility(filters);
      expect(visibility).toEqual({
        showVehicleGrade: true,
        showHighwayRisk: true,
        showSmallTruck: false,
        showLargeTruck: false,
      });
    });

    it("仅选择小货车时只显示小货车评级", () => {
      const filters = {
        customerCategories: [],
        businessTypes: ["2-9吨营业货车"],
      };
      const visibility = getRatingVisibility(filters);
      expect(visibility).toEqual({
        showVehicleGrade: false,
        showHighwayRisk: false,
        showSmallTruck: true,
        showLargeTruck: false,
      });
    });

    it("仅选择大货车时只显示大货车评级", () => {
      const filters = {
        customerCategories: [],
        businessTypes: ["10吨以上-普货"],
      };
      const visibility = getRatingVisibility(filters);
      expect(visibility).toEqual({
        showVehicleGrade: false,
        showHighwayRisk: false,
        showSmallTruck: false,
        showLargeTruck: true,
      });
    });

    it("混合选择客车和小货车时显示对应的评级", () => {
      const filters = {
        customerCategories: ["非营业个人客车"],
        businessTypes: ["出租车", "2-9吨营业货车"],
      };
      const visibility = getRatingVisibility(filters);
      expect(visibility).toEqual({
        showVehicleGrade: true,
        showHighwayRisk: true,
        showSmallTruck: true,
        showLargeTruck: false,
      });
    });

    it("混合选择小货车和大货车时显示对应的评级", () => {
      const filters = {
        customerCategories: [],
        businessTypes: ["2吨以下营业货车", "10吨以上-牵引"],
      };
      const visibility = getRatingVisibility(filters);
      expect(visibility).toEqual({
        showVehicleGrade: false,
        showHighwayRisk: false,
        showSmallTruck: true,
        showLargeTruck: true,
      });
    });

    it("选择所有类型车辆时所有评级都应显示", () => {
      const filters = {
        customerCategories: ["非营业个人客车"],
        businessTypes: ["出租车", "2-9吨营业货车", "10吨以上-普货"],
      };
      const visibility = getRatingVisibility(filters);
      expect(visibility).toEqual({
        showVehicleGrade: true,
        showHighwayRisk: true,
        showSmallTruck: true,
        showLargeTruck: true,
      });
    });
  });

  describe("边界情况测试", () => {
    it("空字符串不应触发显示", () => {
      const filters = {
        customerCategories: [""],
        businessTypes: [""],
      };
      const visibility = getRatingVisibility(filters);
      // 空字符串不匹配任何预定义类别，因此应该不显示
      expect(visibility.showVehicleGrade).toBe(false);
      expect(visibility.showSmallTruck).toBe(false);
      expect(visibility.showLargeTruck).toBe(false);
    });

    it("未知类别不应触发显示", () => {
      const filters = {
        customerCategories: ["未知类别"],
        businessTypes: ["未知类型"],
      };
      const visibility = getRatingVisibility(filters);
      expect(visibility.showVehicleGrade).toBe(false);
      expect(visibility.showSmallTruck).toBe(false);
      expect(visibility.showLargeTruck).toBe(false);
    });

    it("精确匹配测试 - 未知类别应返回false", () => {
      const filters = {
        customerCategories: ["非营业个人客车"], // 正确的类别
        businessTypes: [],
      };
      expect(shouldShowPassengerRatings(filters)).toBe(true);

      // 测试：选择了非客车类别时应该返回 false
      const truckFilters = {
        customerCategories: ["营业货车"],
        businessTypes: [],
      };
      expect(shouldShowPassengerRatings(truckFilters)).toBe(false);
    });
  });
});
