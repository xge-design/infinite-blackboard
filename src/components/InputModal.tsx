/**
 * 无限黑板 — 输入弹窗
 *
 * 用户填写愿望的空白部分。
 * 系统自动拼接完整句子。
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROMPT_PREFIX, PROMPT_SUFFIX } from '@/lib/constants';

interface InputModalProps {
  isOpen: boolean;
  onSubmit: (content: string) => void;
  onClose: () => void;
}

export default function InputModal({ isOpen, onSubmit, onClose }: InputModalProps) {
  const [wish, setWish] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setWish('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = wish.trim();
    if (!trimmed) return;
    const full = `${PROMPT_PREFIX}${trimmed}${PROMPT_SUFFIX}`;
    onSubmit(full);
    setWish('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  const preview = wish.trim()
    ? `${PROMPT_PREFIX}${wish.trim()}${PROMPT_SUFFIX}`
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)',
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
                border: '1px solid rgba(232, 228, 217, 0.1)',
                borderRadius: '12px',
                boxShadow: '0 0 80px rgba(232, 228, 217, 0.04), 0 30px 60px rgba(0,0,0,0.5)',
              }}
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 md:p-10">
                {/* 句式提示 */}
                <p
                  className="font-chalk text-sm mb-6"
                  style={{ color: 'rgba(232, 228, 217, 0.3)' }}
                >
                  {PROMPT_PREFIX}……{PROMPT_SUFFIX}
                </p>

                {/* 输入框 */}
                <div className="mb-6">
                  <input
                    ref={inputRef}
                    type="text"
                    value={wish}
                    onChange={(e) => setWish(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="去西藏旅行 / 看看鲸鱼 / 拥有自己的花园"
                    className="w-full bg-transparent border-0 border-b font-chalk text-xl md:text-2xl outline-none pb-3"
                    style={{
                      color: '#e8e4d9',
                      caretColor: '#e8e4d9',
                      borderColor: 'rgba(232, 228, 217, 0.15)',
                    }}
                    maxLength={50}
                  />
                </div>

                {/* 预览 */}
                {preview && (
                  <motion.p
                    className="font-chalk text-sm mb-8"
                    style={{ color: 'rgba(232, 228, 217, 0.25)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {preview}
                  </motion.p>
                )}

                {/* 按钮 */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={onClose}
                    className="font-chalk text-sm px-4 py-2 transition-colors"
                    style={{ color: 'rgba(232, 228, 217, 0.3)' }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!wish.trim()}
                    className="font-chalk text-sm px-6 py-2 rounded transition-all"
                    style={{
                      color: wish.trim() ? '#e8e4d9' : 'rgba(232, 228, 217, 0.15)',
                      background: wish.trim() ? 'rgba(232, 228, 217, 0.08)' : 'transparent',
                      border: `1px solid ${wish.trim() ? 'rgba(232, 228, 217, 0.15)' : 'rgba(232, 228, 217, 0.05)'}`,
                    }}
                  >
                    写下
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
