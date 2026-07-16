/**
 * 无限黑板 — 视口工具函数
 *
 * 坐标变换与视口计算。
 * 供 PixiJS 渲染器和交互钩子使用。
 */

import { Viewport } from '@/types';

/**
 * 获取视口在世界空间中的可见边界。
 */
export function getWorldBounds(viewport: Viewport): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  return {
    x: viewport.x,
    y: viewport.y,
    w: viewport.width / viewport.zoom,
    h: viewport.height / viewport.zoom,
  };
}

/**
 * 屏幕坐标 → 世界坐标。
 */
export function screenToWorld(
  sx: number,
  sy: number,
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: viewport.x + sx / viewport.zoom,
    y: viewport.y + sy / viewport.zoom,
  };
}

/**
 * 世界坐标 → 屏幕坐标。
 */
export function worldToScreen(
  wx: number,
  wy: number,
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: (wx - viewport.x) * viewport.zoom,
    y: (wy - viewport.y) * viewport.zoom,
  };
}
