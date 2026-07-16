/**
 * 无限黑板 — 粉笔色盘
 *
 * 柔和、自然的粉笔色调。
 * 每条消息在生成时随机分配一种颜色。
 */

/** 主要粉白色调——默认文字颜色 */
export const CHALK_WHITES = [
  '#e8e4d9', // 暖米白
  '#d4d0c5', // 柔象牙
  '#f0ece1', // 亮粉笔
  '#cdc9bc', // 灰白
  '#e2ded3', // 柔羊皮纸
] as const;

/** 点缀色——微妙的色彩变化 */
export const CHALK_ACCENTS = [
  '#c9b99a', // 暖赭
  '#a8c4b8', // 鼠尾草
  '#b8c4d4', // 淡蓝
  '#d4b8b8', // 灰玫瑰
  '#c4c9a8', // 柔黄绿
  '#b8a8c4', // 薰衣草
  '#c4b8a8', // 灰褐
  '#a8b8c4', // 钢蓝
] as const;

/** 所有可用粉笔色 */
export const ALL_CHALK_COLORS = [
  ...CHALK_WHITES,
  ...CHALK_ACCENTS,
] as const;

/**
 * 随机选取一种粉笔色。
 * 权重：白色系 70%，彩色系 30%。
 */
export function randomChalkColor(): string {
  const isWhite = Math.random() < 0.7;
  const palette = isWhite ? CHALK_WHITES : CHALK_ACCENTS;
  return palette[Math.floor(Math.random() * palette.length)];
}

/**
 * 将十六进制颜色转换为 PixiJS 数字格式。
 */
export function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * 将十六进制颜色转换为 rgba 字符串。
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
