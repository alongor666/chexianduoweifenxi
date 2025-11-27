/**
 * @owner 飞友
 * @status 完成
 * @doc See [FEAT-P1-04: 图表导出为PNG图片](./../../../开发文档/01_features/FEAT-P1-04_chart-export.md)
 *
 * 图表导出工具
 * 支持将图表导出为PNG图片
 */

import html2canvas from 'html2canvas'
import { logger } from '@/lib/logger'

const log = logger.create('ChartExporter')

export interface ChartExportOptions {
  /**
   * 导出文件名（不含扩展名）
   */
  filename?: string

  /**
   * 图片质量 (0-1)，仅对JPEG有效
   */
  quality?: number

  /**
   * 背景颜色（默认白色）
   */
  backgroundColor?: string

  /**
   * 缩放比例（默认2，生成高清图片）
   */
  scale?: number

  /**
   * 是否在导出前等待一段时间（毫秒），确保图表完全渲染
   */
  waitBeforeCapture?: number

  /**
   * 图片格式
   */
  format?: 'png' | 'jpeg'
}

/**
 * 将DOM元素导出为图片
 * @param element 要导出的DOM元素或选择器
 * @param options 导出选项
 */
export async function exportChartAsImage(
  element: HTMLElement | string,
  options: ChartExportOptions = {}
): Promise<void> {
  const {
    filename = `chart-${new Date().toISOString().split('T')[0]}`,
    quality = 0.95,
    backgroundColor = '#ffffff',
    scale = 2,
    waitBeforeCapture = 100,
    format = 'png',
  } = options

  try {
    // 获取DOM元素
    const targetElement =
      typeof element === 'string'
        ? document.querySelector<HTMLElement>(element)
        : element

    if (!targetElement) {
      throw new Error('找不到要导出的图表元素')
    }

    // 等待图表完全渲染
    if (waitBeforeCapture > 0) {
      await new Promise(resolve => setTimeout(resolve, waitBeforeCapture))
    }

    // 使用html2canvas捕获元素
    const canvas = await html2canvas(targetElement, {
      backgroundColor,
      scale,
      useCORS: true, // 允许跨域图片
      logging: false, // 禁用日志
      allowTaint: false,
      removeContainer: true,
      imageTimeout: 15000,
      // 优化SVG渲染（对Recharts图表重要）
      foreignObjectRendering: true,
    })

    // 转换为Blob并下载
    canvas.toBlob(
      blob => {
        if (!blob) {
          throw new Error('图片生成失败')
        }

        // 创建下载链接
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // 释放URL对象
        URL.revokeObjectURL(url)
      },
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality
    )
  } catch (error) {
    log.error('图表导出失败', error)
    throw error
  }
}

/**
 * 导出多个图表为单个图片
 * @param elements 要导出的元素数组
 * @param options 导出选项
 */
export async function exportMultipleChartsAsImage(
  elements: (HTMLElement | string)[],
  options: ChartExportOptions = {}
): Promise<void> {
  const {
    filename = `charts-${new Date().toISOString().split('T')[0]}`,
    quality = 0.95,
    backgroundColor = '#ffffff',
    scale = 2,
    waitBeforeCapture = 100,
    format = 'png',
  } = options

  try {
    // 等待渲染
    if (waitBeforeCapture > 0) {
      await new Promise(resolve => setTimeout(resolve, waitBeforeCapture))
    }

    // 创建一个临时容器来合并所有图表
    const container = document.createElement('div')
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      background: ${backgroundColor};
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    `

    // 克隆所有元素到容器中
    for (const element of elements) {
      const targetElement =
        typeof element === 'string'
          ? document.querySelector<HTMLElement>(element)
          : element

      if (targetElement) {
        const clone = targetElement.cloneNode(true) as HTMLElement
        container.appendChild(clone)
      }
    }

    document.body.appendChild(container)

    // 捕获合并后的图表
    const canvas = await html2canvas(container, {
      backgroundColor,
      scale,
      useCORS: true,
      logging: false,
      allowTaint: false,
      removeContainer: true,
      foreignObjectRendering: true,
    })

    // 移除临时容器
    document.body.removeChild(container)

    // 下载图片
    canvas.toBlob(
      blob => {
        if (!blob) {
          throw new Error('图片生成失败')
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      },
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality
    )
  } catch (error) {
    log.error('多图表导出失败', error)
    throw error
  }
}

/**
 * 将canvas转换为图片URL
 * @param element 要转换的DOM元素
 * @param options 转换选项
 * @returns 图片的Data URL
 */
export async function getChartAsDataURL(
  element: HTMLElement | string,
  options: Omit<ChartExportOptions, 'filename'> = {}
): Promise<string> {
  const {
    backgroundColor = '#ffffff',
    scale = 2,
    waitBeforeCapture = 100,
    format = 'png',
    quality = 0.95,
  } = options

  const targetElement =
    typeof element === 'string'
      ? document.querySelector<HTMLElement>(element)
      : element

  if (!targetElement) {
    throw new Error('找不到要转换的图表元素')
  }

  if (waitBeforeCapture > 0) {
    await new Promise(resolve => setTimeout(resolve, waitBeforeCapture))
  }

  const canvas = await html2canvas(targetElement, {
    backgroundColor,
    scale,
    useCORS: true,
    logging: false,
    allowTaint: false,
    removeContainer: true,
    foreignObjectRendering: true,
  })

  return canvas.toDataURL(
    format === 'jpeg' ? 'image/jpeg' : 'image/png',
    quality
  )
}
