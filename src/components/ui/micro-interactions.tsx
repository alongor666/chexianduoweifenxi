/**
 * 微交互动画组件库
 * 提供各种增强用户体验的小动画效果
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Check, Copy, X, Sparkles, ChevronRight, ArrowUp } from 'lucide-react';

/**
 * 点击波纹效果
 */
interface RippleProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  duration?: number;
  onClick?: () => void;
}

export function Ripple({ children, className, color = 'rgba(59, 130, 246, 0.3)', duration = 600, onClick }: RippleProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height);
    const id = Date.now();

    setRipples(prev => [...prev, { id, x, y, size }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, duration);

    onClick?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none animate-ping"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            borderRadius: '50%',
            transform: 'scale(0)',
            animation: `ripple ${duration}ms ease-out`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * 复制成功提示
 */
interface CopyToastProps {
  show: boolean;
  message?: string;
  duration?: number;
}

export function CopyToast({ show, message = "已复制到剪贴板", duration = 2000 }: CopyToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
        <Check className="h-4 w-4" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

/**
 * 悬浮卡片效果
 */
interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  liftDistance?: number;
  shadowColor?: string;
}

export function HoverCard({
  children,
  className,
  hoverScale = 1.02,
  liftDistance = 4,
  shadowColor = 'rgba(0, 0, 0, 0.1)',
}: HoverCardProps) {
  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out cursor-pointer",
        "hover:scale-[var(--hover-scale)] hover:-translate-y-[var(--lift-distance)]",
        "hover:shadow-[var(--shadow-color)] hover:shadow-2xl",
        className
      )}
      style={{
        '--hover-scale': hoverScale,
        '--lift-distance': `${liftDistance}px`,
        '--shadow-color': shadowColor,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * 数字滚动动画
 */
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(0);

  useEffect(() => {
    setIsAnimating(true);
    const startValue = previousValue.current;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // 使用easeOutQuart缓动
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (value - startValue) * easeOutQuart;

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        previousValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={cn(
      "tabular-nums",
      isAnimating && "text-blue-600",
      className
    )}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/**
 * 加载骨架屏动画
 */
interface ShimmerProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  borderRadius?: string;
}

export function Shimmer({ className, height = '1rem', width = '100%', borderRadius = '0.25rem' }: ShimmerProps) {
  return (
    <div
      className={cn("relative overflow-hidden bg-slate-100", className)}
      style={{ height, width, borderRadius }}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </div>
  );
}

/**
 * 进度条动画
 */
interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: string;
  height?: string;
  showValue?: boolean;
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  color = 'bg-blue-500',
  height = '0.5rem',
  showValue = true,
}: AnimatedProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const percentage = (animatedValue / max) * 100;

  return (
    <div className={cn("w-full", className)}>
      <div
        className="bg-slate-100 rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out relative",
            color
          )}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-pulse" />
        </div>
      </div>
      {showValue && (
        <div className="text-center mt-1 text-xs text-slate-600">
          {animatedValue.toFixed(0)} / {max} ({percentage.toFixed(1)}%)
        </div>
      )}
    </div>
  );
}

/**
 * 成功/错误状态动画
 */
interface StatusIconProps {
  status: 'success' | 'error' | 'loading';
  size?: number;
  className?: string;
}

export function StatusIcon({ status, size = 20, className }: StatusIconProps) {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => setShowCheck(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowCheck(false);
    }
  }, [status]);

  if (status === 'success') {
    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center rounded-full bg-green-100",
          className
        )}
        style={{ width: size, height: size }}
      >
        <Check
          className={cn(
            "text-green-600 transition-all duration-300",
            showCheck ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
          style={{ width: size * 0.6, height: size * 0.6 }}
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center rounded-full bg-red-100 animate-shake",
          className
        )}
        style={{ width: size, height: size }}
      >
        <X className="text-red-600" style={{ width: size * 0.6, height: size * 0.6 }} />
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center",
          className
        )}
        style={{ width: size, height: size }}
      >
        <div
          className="border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  return null;
}

/**
 * 磁性按钮效果
 */
interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function MagneticButton({ children, className, onClick, disabled }: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // 限制移动范围
    const maxDistance = 10;
    const distance = Math.sqrt(x * x + y * y);
    const scale = Math.min(distance / maxDistance, 1);

    setPosition({
      x: x * scale * 0.2,
      y: y * scale * 0.2,
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        "relative transition-transform duration-200 ease-out",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/**
 * 火花特效
 */
interface SparkleEffectProps {
  children: React.ReactNode;
  trigger?: 'hover' | 'click' | 'always';
  className?: string;
}

export function SparkleEffect({ children, trigger = 'hover', className }: SparkleEffectProps) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const createSparkle = (e?: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e ? e.clientX - rect.left : Math.random() * rect.width;
    const y = e ? e.clientY - rect.top : Math.random() * rect.height;
    const id = Date.now() + Math.random();

    const newSparkle = { id, x, y };
    setSparkles(prev => [...prev, newSparkle]);

    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== id));
    }, 1000);
  };

  const handleEvent = (e: React.MouseEvent) => {
    if (trigger === 'click') {
      createSparkle(e);
    }
  };

  useEffect(() => {
    if (trigger === 'always') {
      const interval = setInterval(createSparkle, 500);
      return () => clearInterval(interval);
    }
  }, [trigger]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-visible", className)}
      onMouseEnter={trigger === 'hover' ? () => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => createSparkle(), i * 100);
        }
      } : undefined}
      onClick={handleEvent}
    >
      {children}
      {sparkles.map(sparkle => (
        <Sparkles
          key={sparkle.id}
          className="absolute h-4 w-4 text-yellow-400 animate-ping"
          style={{
            left: sparkle.x - 8,
            top: sparkle.y - 8,
          }}
        />
      ))}
    </div>
  );
}