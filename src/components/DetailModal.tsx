/**
 * 无限黑板 — 详情弹窗
 *
 * 点击消息后展示完整内容。
 * Framer Motion 动画。
 * 无社交功能。
 * 只有文字，和沉默。
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BlackboardMessage } from '@/types';
import { hexToRgba } from '@/lib/colors';
import { PROMPT_PREFIX, PROMPT_SUFFIX } from '@/lib/constants';

interface DetailModalProps {
  message: BlackboardMessage | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y} 年 ${m} 月 ${day} 日`;
}

export default function DetailModal({ message, onClose }: DetailModalProps) {
  return (
    <AnimatePresence>
      {message && (
        <>
          {/* 遮罩 */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)',
              backdropFilter: 'blur(3px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* 弹窗 */}
          <motion.div
            className="fixed z-50 flex items-center justify-center inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative max-w-lg w-full mx-6 pointer-events-auto"
              style={{
                background: 'rgba(42, 42, 42, 0.96)',
                border: `1px solid ${hexToRgba(message.color, 0.15)}`,
                borderRadius: '12px',
                boxShadow: `0 0 80px ${hexToRgba(message.color, 0.08)}, 0 30px 60px rgba(0,0,0,0.5)`,
              }}
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 md:p-10">
                {/* 消息文本 */}
                <p
                  className="font-chalk text-3xl md:text-4xl leading-relaxed mb-8"
                  style={{ color: message.color }}
                >
                  {message.content}
                </p>

                {/* 分隔线 */}
                <div
                  className="h-px mb-6"
                  style={{
                    background: `linear-gradient(to right, transparent, ${hexToRgba(message.color, 0.15)}, transparent)`,
                  }}
                />

                {/* 元数据 */}
                <div
                  className="flex items-center gap-3 text-xs tracking-wider"
                  style={{ color: hexToRgba(message.color, 0.3) }}
                >
                  <span>{formatDate(message.createdAt)}</span>
                </div>

                {/* 未来：情感标签 */}
                {message.emotions && Object.keys(message.emotions).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(message.emotions).map(([emotion, score]) => (
                      <span
                        key={emotion}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: hexToRgba(message.color, 0.08),
                          color: hexToRgba(message.color, 0.4),
                        }}
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                )}

                {/* 未来：相关内容 */}
                {message.nearestNeighbors.length > 0 && (
                  <div className="mt-6">
                    <p
                      className="text-xs tracking-wider mb-3"
                      style={{ color: hexToRgba(message.color, 0.2) }}
                    >
                      相似的愿望
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
