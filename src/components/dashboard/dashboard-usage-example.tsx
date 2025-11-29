/**
 * UI/UX 精细化打磨使用示例
 * 展示如何集成所有新增的增强组件
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnhancedKPICard, EnhancedKPIDashboard } from '@/components/features/enhanced-kpi-card';
import { InteractiveTrendChart } from '@/components/features/interactive-trend-chart';
import { LoadingProgress, SmartLoadingMessages } from '@/components/ui/loading-progress';
import {
  Ripple,
  HoverCard,
  AnimatedNumber,
  SparkleEffect,
  MagneticButton,
  StatusIcon
} from '@/components/ui/micro-interactions';
import { ChartInteractionProvider } from '@/contexts/chart-interaction-context';

// 示例数据
const sampleData = [
  { week: '第1周', premium: 120, loss: 80, expense: 20, ratio: 83.3 },
  { week: '第2周', premium: 135, loss: 75, expense: 22, ratio: 71.9 },
  { week: '第3周', premium: 148, loss: 90, expense: 25, ratio: 77.0 },
  { week: '第4周', premium: 160, loss: 85, expense: 23, ratio: 67.5 },
  { week: '第5周', premium: 175, loss: 95, expense: 26, ratio: 69.1 },
];

const sampleKPIData = {
  earnedPremiumTotal: 838,
  totalIncurred: 425,
  lossRatio: 65.5,
  expenseRatio: 18.2,
  combinedRatio: 83.7,
  contributionMargin: 16.3,
};

export function DashboardUsageExample() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ loaded: 0, total: 100, percentage: 0 });
  const [animatedValue, setAnimatedValue] = useState(0);

  // 模拟加载过程
  const startLoading = () => {
    setLoading(true);
    setProgress({ loaded: 0, total: 100, percentage: 0 });

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
      setProgress({
        loaded: Math.floor(current),
        total: 100,
        percentage: current,
      });
    }, 300);
  };

  // 模拟数字变化
  const updateValue = () => {
    const newValue = Math.floor(Math.random() * 1000) + 500;
    setAnimatedValue(newValue);
  };

  return (
    <ChartInteractionProvider>
      <div className="space-y-8 p-6">
        {/* 标题部分 */}
        <div>
          <h1 className="text-3xl font-bold mb-2">UI/UX 精细化打磨示例</h1>
          <p className="text-slate-600">展示所有新增的增强组件和交互效果</p>
        </div>

        {/* 加载进度条示例 */}
        <Card>
          <CardHeader>
            <CardTitle>1. 优雅的加载进度条</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Ripple>
              <Button onClick={startLoading} disabled={loading}>
                {loading ? '加载中...' : '开始加载'}
              </Button>
            </Ripple>

            {loading && (
              <LoadingProgress
                progress={progress}
                loading={loading}
                stage="正在处理第 3 周数据..."
                showDetails={true}
              />
            )}

            <SmartLoadingMessages
              progress={progress}
              loading={loading}
              dataType="csv"
              sourceName="车险数据2024.csv"
              weekNumber={3}
              verbose={true}
            />
          </CardContent>
        </Card>

        {/* 增强KPI卡片示例 */}
        <Card>
          <CardHeader>
            <CardTitle>2. 增强版KPI卡片</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SparkleEffect trigger="hover">
                <EnhancedKPICard
                  title="已赚保费"
                  value={838.5}
                  unit="万元"
                  compareValue={12.5}
                  status="excellent"
                  kpiKey="earnedPremiumTotal"
                  trendData={[750, 780, 810, 820, 838.5]}
                  onClick={() => console.log('点击了保费卡片')}
                />
              </SparkleEffect>

              <HoverCard liftDistance={6}>
                <EnhancedKPICard
                  title="赔付率"
                  value={65.5}
                  unit="%"
                  compareValue={-2.3}
                  status="good"
                  kpiKey="lossRatio"
                  numeratorValue={425}
                  denominatorValue={650}
                />
              </HoverCard>

              <EnhancedKPICard
                title="满期边际贡献率"
                value={16.3}
                unit="%"
                compareValue={3.2}
                status="excellent"
                kpiKey="contributionMargin"
                showPulse={true}
                valueColor="text-green-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* 交互式趋势图示例 */}
        <Card>
          <CardHeader>
            <CardTitle>3. 交互式趋势图（支持联动）</CardTitle>
          </CardHeader>
          <CardContent>
            <InteractiveTrendChart
              chartId="trend-example"
              title="保费趋势分析"
              data={sampleData}
              xAxisKey="week"
              yAxisKeys={[
                { key: 'premium', name: '保费', color: '#3b82f6' },
                { key: 'loss', name: '损失', color: '#ef4444' },
                { key: 'ratio', name: '综合成本率', color: '#10b981' },
              ]}
              referenceLines={[
                { y: 100, label: '盈亏平衡线', color: '#ef4444', strokeDasharray: '5 5' },
              ]}
              showZoomControls={true}
              showBrush={true}
              height={300}
            />
          </CardContent>
        </Card>

        {/* 微交互动画示例 */}
        <Card>
          <CardHeader>
            <CardTitle>4. 微交互动画效果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 数字动画 */}
            <div className="flex items-center gap-4">
              <span>数字滚动动画：</span>
              <AnimatedNumber value={animatedValue} prefix="¥" suffix="万元" decimals={2} />
              <Button size="sm" onClick={updateValue}>更新数值</Button>
            </div>

            {/* 状态图标 */}
            <div className="flex items-center gap-4">
              <span>状态动画：</span>
              <StatusIcon status="success" />
              <StatusIcon status="error" />
              <StatusIcon status="loading" />
            </div>

            {/* 磁性按钮 */}
            <div className="flex items-center gap-4">
              <span>磁性按钮效果：</span>
              <MagneticButton className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                悬停试试
              </MagneticButton>
            </div>

            {/* 波纹效果 */}
            <div className="flex items-center gap-4">
              <span>点击波纹效果：</span>
              <Ripple className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg cursor-pointer">
                点击我
              </Ripple>
            </div>
          </CardContent>
        </Card>

        {/* 完整KPI仪表板示例 */}
        <Card>
          <CardHeader>
            <CardTitle>5. 完整的增强KPI仪表板</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedKPIDashboard
              kpiData={sampleKPIData}
              isLoading={false}
              compareData={{
                ...sampleKPIData,
                lossRatio: 68.5,
                combinedRatio: 86.7,
                contributionMargin: 13.3,
              }}
              onKPIClick={(kpiKey, value) => {
                console.log('KPI点击:', kpiKey, value);
              }}
              trendData={{
                earnedPremiumTotal: [750, 780, 810, 820, 838.5],
                lossRatio: [68, 67, 66, 66, 65.5],
                combinedRatio: [87, 86, 85, 84, 83.7],
                contributionMargin: [13, 14, 15, 15.5, 16.3],
              }}
            />
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">📚 使用指南</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-2">
            <p>• <strong>LoadingProgress</strong>：优雅的进度条，支持阶段提示和详细信息</p>
            <p>• <strong>EnhancedKPICard</strong>：增强版KPI卡片，支持状态标签、趋势线、数字动画</p>
            <p>• <strong>InteractiveTrendChart</strong>：交互式趋势图，支持缩放、筛选、联动</p>
            <p>• <strong>ChartInteractionManager</strong>：图表交互管理器，实现图表间联动</p>
            <p>• <strong>MicroInteractions</strong>：丰富的微交互动画，提升用户体验</p>
            <p>• <strong>SmartLoadingMessages</strong>：智能加载文案，根据进度动态生成</p>
          </CardContent>
        </Card>
      </div>
    </ChartInteractionProvider>
  );
}