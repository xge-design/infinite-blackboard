/**
 * 无限黑板 — 主页面
 *
 * 入口。没有导航、没有广告、没有干扰。
 * 只有黑板。
 */

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlackboardMessage } from '@/types';
import { generateSampleMessages } from '@/lib/data';
import { buildSpatialIndex, createSpatialIndex } from '@/lib/spatialIndex';
import { randomChalkColor } from '@/lib/colors';
import PixiCanvas from '@/components/PixiCanvas';
import DetailModal from '@/components/DetailModal';
import InputModal from '@/components/InputModal';

export default function HomePage() {
  // 数据——可变，支持无限添加
  const [messages, setMessages] = useState<BlackboardMessage[]>(() => generateSampleMessages(500));
  const [spatialIndex] = useState(() => {
    const idx = createSpatialIndex();
    for (const msg of generateSampleMessages(500)) idx.insert(msg);
    return idx;
  });

  const [selected, setSelected] = useState<BlackboardMessage | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputOpen, setInputOpen] = useState(false);
  const viewportCenter = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(t);
  }, []);

  const handleClick = useCallback((msg: BlackboardMessage) => {
    setSelected(msg);
  }, []);

  const handleClose = useCallback(() => {
    setSelected(null);
  }, []);

  const handleViewportChange = useCallback((cx: number, cy: number) => {
    viewportCenter.current = { x: cx, y: cy };
  }, []);

  // 在视口附近寻找空白区域
  const findEmptyPosition = useCallback((content: string): { x: number; y: number } => {
    const searchRadius = 1500;
    for (let attempt = 0; attempt < 100; attempt++) {
      const angle = attempt * 2.399; // 黄金角
      const dist = 200 + Math.sqrt(attempt) * searchRadius * 0.15;
      const x = viewportCenter.current.x + Math.cos(angle) * dist;
      const y = viewportCenter.current.y + Math.sin(angle) * dist;
      const hit = spatialIndex.hitTest(x, y);
      if (!hit) return { x, y };
    }
    // 兜底：更远的位置
    const fallbackDist = searchRadius + Math.random() * 500;
    const fallbackAngle = Math.random() * Math.PI * 2;
    return {
      x: viewportCenter.current.x + Math.cos(fallbackAngle) * fallbackDist,
      y: viewportCenter.current.y + Math.sin(fallbackAngle) * fallbackDist,
    };
  }, [spatialIndex]);

  const handleAddMessage = useCallback((content: string) => {
    const position = findEmptyPosition(content);
    const id = crypto.randomUUID?.() || `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newMsg: BlackboardMessage = {
      id,
      content,
      position,
      color: randomChalkColor(),
      opacity: 0.8 + Math.random() * 0.2,
      fontSize: 42 + Math.random() * 16,
      rotation: (Math.random() - 0.5) * 6,
      language: 'zh',
      createdAt: new Date().toISOString(),
      embedding: null,
      nearestNeighbors: [],
      emotions: null,
      topicCluster: null,
    };
    spatialIndex.insert(newMsg);
    setMessages((prev) => [...prev, newMsg]);
  }, [findEmptyPosition, spatialIndex]);

  // 键盘
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inputOpen) setInputOpen(false);
        else setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputOpen]);

  return (
    <main className="chalkboard-bg w-full h-screen overflow-hidden relative">
      {/* 画布 */}
      <AnimatePresence>
        {isLoaded && (
          <motion.div
            className="absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
          >
            <PixiCanvas
              messages={messages}
              spatialIndex={spatialIndex}
              onMessageClick={handleClick}
              onViewportChange={handleViewportChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 加载态 */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: '#2a2a2a' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <p className="font-chalk text-4xl text-chalk-white/20 loading-breathe">
              ∞
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 标题——唯一的标题，纪念碑感 */}
      <AnimatePresence>
        {isLoaded && (
          <motion.div
            className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          >
            <div className="text-center pt-8 md:pt-12">
              <h1
                className="font-chalk"
                style={{
                  fontSize: 'clamp(2rem, 5vw, 4.5rem)',
                  color: 'rgba(232, 228, 217, 0.2)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                }}
              >
                在我死去之前，我想……
              </h1>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 新增按钮——克制、右下角 */}
      <AnimatePresence>
        {isLoaded && (
          <motion.button
            className="fixed z-30 font-chalk"
            style={{
              bottom: '2rem',
              right: '2rem',
              fontSize: '2rem',
              color: 'rgba(232, 228, 217, 0.2)',
              width: '3rem',
              height: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'rgba(232, 228, 217, 0.04)',
              border: '1px solid rgba(232, 228, 217, 0.06)',
              lineHeight: 1,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 2 }}
            whileHover={{ scale: 1.1, background: 'rgba(232, 228, 217, 0.08)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setInputOpen(true)}
          >
            +
          </motion.button>
        )}
      </AnimatePresence>

      {/* 详情弹窗 */}
      <DetailModal message={selected} onClose={handleClose} />

      {/* 输入弹窗 */}
      <InputModal
        isOpen={inputOpen}
        onSubmit={handleAddMessage}
        onClose={() => setInputOpen(false)}
      />
    </main>
  );
}
