/**
 * Dashboard Models Tab Component
 * 预测模型标签页
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardModelsTabProps {
  data: any[];
}

export function DashboardModelsTab({ data }: DashboardModelsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>预测模型</CardTitle>
          <CardDescription>
            基于历史数据的业务预测模型（开发中）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">保费预测模型</CardTitle>
                <Badge variant="secondary">计划中</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  基于时间序列分析的保费收入预测
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">客户流失预测</CardTitle>
                <Badge variant="secondary">计划中</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  识别可能流失的高风险客户
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">理赔预测模型</CardTitle>
                <Badge variant="secondary">计划中</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  预测理赔概率和预期金额
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">产品推荐模型</CardTitle>
                <Badge variant="secondary">计划中</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  为客户推荐最合适的保险产品
                </p>
              </CardContent>
            </Card>
          </div>

          {data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                请先上传数据以启用预测模型功能
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                预测模型功能即将上线，敬请期待
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                当前数据量: {data.length} 条记录
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}