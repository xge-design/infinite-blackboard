/**
 * 无限黑板 — 时间轴服务（桩模块）
 *
 * 未来：支持按时间段浏览消息。
 * 实现「观看黑板成长」功能。
 *
 * @module timeline
 */

import { BlackboardMessage } from '@/types';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface TimelineState {
  currentRange: TimeRange;
  isPlaying: boolean;
  /** 播放倍速：1x、2x、5x、10x */
  playbackSpeed: number;
}

/**
 * 按时间范围过滤消息。
 */
export function filterByTimeRange(
  messages: BlackboardMessage[],
  range: TimeRange
): BlackboardMessage[] {
  return messages.filter((msg) => {
    const date = new Date(msg.createdAt);
    return date >= range.start && date <= range.end;
  });
}

/**
 * 获取消息数据中所有可用的年份。
 */
export function getAvailableYears(messages: BlackboardMessage[]): number[] {
  const years = new Set(messages.map((m) => new Date(m.createdAt).getFullYear()));
  return Array.from(years).sort();
}

/**
 * 未来：按时间轴动画播放，展示消息按时间顺序出现。
 *
 * @param messages  全部消息（按 createdAt 排序）
 * @param onFrame   每帧回调，返回当前可见消息集
 * @param speed     播放倍速
 */
export async function playTimeline(
  _messages: BlackboardMessage[],
  _onFrame: (visible: BlackboardMessage[], currentDate: Date) => void,
  _speed: number = 1
): Promise<() => void> {
  return () => {}; // 返回停止函数
}
