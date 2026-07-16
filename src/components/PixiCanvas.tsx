/**
 * 无限黑板 — PixiJS 画布组件
 *
 * 使用 PixiJS 7 WebGL 渲染器替代 Canvas2D。
 * GPU 加速，支持 100,000+ 消息节点。
 *
 * @module PixiCanvas
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import { BlackboardMessage, SpatialIndex } from '@/types';
import { CANVAS } from '@/lib/constants';
import { getWorldBounds } from '@/lib/canvasUtils';
import { MessageRenderer } from '@/lib/MessageRenderer';
import { usePixiViewport } from '@/hooks/usePixiViewport';

interface PixiCanvasProps {
  messages: BlackboardMessage[];
  spatialIndex: SpatialIndex;
  onMessageClick: (msg: BlackboardMessage) => void;
  onViewportChange?: (cx: number, cy: number) => void;
}

export default function PixiCanvas({ messages, spatialIndex, onMessageClick, onViewportChange }: PixiCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [app, setApp] = useState<PIXI.Application | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  // 视口交互——app 是 state 值，变化时重新注册事件
  const { viewportRef, setClickCallback } = usePixiViewport(app, onViewportChange);

  // 点击命中检测
  const handleClick = useCallback(
    (wx: number, wy: number) => {
      const hit = spatialIndex.hitTest(wx, wy);
      if (hit) onMessageClick(hit);
    },
    [spatialIndex, onMessageClick]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const parent = containerRef.current;

    // ── 初始化 PixiJS ──
    const pixiApp = new PIXI.Application({
      resizeTo: parent,
      backgroundColor: CANVAS.BG_COLOR_HEX,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });
    appRef.current = pixiApp;
    parent.appendChild(pixiApp.view as HTMLCanvasElement);

    // ── 世界容器 ──
    const world = new PIXI.Container();
    pixiApp.stage.addChild(world);

    // ── 背景网格（原点十字标记）──
    const originMark = new PIXI.Graphics();
    originMark.lineStyle(1, 0xffffff, 0.08);
    originMark.moveTo(-30, 0);
    originMark.lineTo(30, 0);
    originMark.moveTo(0, -30);
    originMark.lineTo(0, 30);
    world.addChild(originMark);

    // ── 消息渲染器 ──
    const renderer = new MessageRenderer(pixiApp, spatialIndex);

    // ── 渲染循环 ──
    const onTick = () => {
      const vp = viewportRef.current;
      const w = pixiApp.screen.width;
      const h = pixiApp.screen.height;

      // 应用视口变换到世界容器
      world.scale.set(vp.zoom);
      world.x = -vp.x * vp.zoom;
      world.y = -vp.y * vp.zoom;

      // 计算世界空间视口边界
      const bounds = getWorldBounds({ x: vp.x, y: vp.y, width: w, height: h, zoom: vp.zoom });

      // 渲染消息
      renderer.render(world, bounds.x, bounds.y, bounds.w, bounds.h, vp.zoom, pixiApp.ticker.lastTime);
    };
    pixiApp.ticker.add(onTick);

    // ── 缩放指示器（HUD）──
    const hud = new PIXI.Text('', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 12,
      fill: 0xffffff,
    });
    hud.alpha = 0.2;
    hud.anchor.set(1, 1);
    pixiApp.stage.addChild(hud);

    const onHudTick = () => {
      const vp = viewportRef.current;
      hud.text = `${Math.round(vp.zoom * 100)}%`;
      hud.x = pixiApp.screen.width - 16;
      hud.y = pixiApp.screen.height - 16;
    };
    pixiApp.ticker.add(onHudTick);

    // ── 设置 app state（触发 usePixiViewport 注册事件）──
    setApp(pixiApp);

    // ── 清理 ──
    return () => {
      pixiApp.ticker.remove(onTick);
      pixiApp.ticker.remove(onHudTick);
      renderer.destroy(world);
      pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
      appRef.current = null;
      setApp(null);
    };
  }, []); // 只运行一次

  // 注册点击回调
  useEffect(() => {
    setClickCallback(handleClick);
  }, [handleClick, setClickCallback]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ touchAction: 'none' }}
    />
  );
}
