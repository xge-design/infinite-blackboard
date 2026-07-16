/**
 * 无限黑板 — PixiJS 视口交互钩子
 *
 * 管理无限画布的交互状态：
 *   - 缩放（滚轮、双指捏合）
 *   - 平移（鼠标拖拽、触控）
 *   - 惯性滚动
 *   - 坐标变换（屏幕 ↔ 世界）
 */

import { useRef, useCallback, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { INTERACTION } from '@/lib/constants';
import { screenToWorld } from '@/lib/canvasUtils';

interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export function usePixiViewport(
  app: PIXI.Application | null,
  onViewportChange?: (cx: number, cy: number) => void
) {
  const viewportRef = useRef<ViewportState>({ x: 0, y: 0, zoom: 0.5 });

  // 拖拽状态
  const isDragging = useRef(false);
  const dragStartScreen = useRef({ x: 0, y: 0 });
  const dragStartViewport = useRef({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const clickTime = useRef(0);
  const clickPos = useRef({ x: 0, y: 0 });
  const momentumRaf = useRef(0);
  const pinchDist = useRef(0);

  // 回调 refs
  const clickCallbackRef = useRef<((wx: number, wy: number) => void) | null>(null);
  const viewportChangeRef = useRef(onViewportChange);
  viewportChangeRef.current = onViewportChange;

  const setClickCallback = useCallback((cb: (wx: number, wy: number) => void) => {
    clickCallbackRef.current = cb;
  }, []);

  /** 通知视口变化 */
  const notifyViewportChange = useCallback(() => {
    if (!viewportChangeRef.current || !app) return;
    const vp = viewportRef.current;
    const cx = vp.x + (app.screen.width / 2) / vp.zoom;
    const cy = vp.y + (app.screen.height / 2) / vp.zoom;
    viewportChangeRef.current(cx, cy);
  }, [app]);

  /** 以屏幕某点为中心缩放 */
  const zoomTo = useCallback((sx: number, sy: number, newZoom: number) => {
    const vp = viewportRef.current;
    const clamped = Math.max(INTERACTION.MIN_ZOOM, Math.min(INTERACTION.MAX_ZOOM, newZoom));
    const worldBefore = screenToWorld(sx, sy, { ...vp, width: 0, height: 0 });
    vp.x = worldBefore.x - sx / clamped;
    vp.y = worldBefore.y - sy / clamped;
    vp.zoom = clamped;
    notifyViewportChange();
  }, [notifyViewportChange]);

  useEffect(() => {
    if (!app) return;
    const canvas = app.view as HTMLCanvasElement;

    /* ── 滚轮缩放 ── */
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(momentumRaf.current);
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const delta = -e.deltaY * INTERACTION.ZOOM_SPEED;
      zoomTo(sx, sy, viewportRef.current.zoom * (1 + delta));
    };

    /* ── 鼠标按下 ── */
    const onPointerDown = (e: PointerEvent) => {
      cancelAnimationFrame(momentumRaf.current);
      isDragging.current = true;
      dragStartScreen.current = { x: e.clientX, y: e.clientY };
      dragStartViewport.current = { x: viewportRef.current.x, y: viewportRef.current.y };
      clickPos.current = { x: e.clientX, y: e.clientY };
      clickTime.current = Date.now();
      velocity.current = { x: 0, y: 0 };
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };

    /* ── 鼠标移动 ── */
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      velocity.current = {
        x: velocity.current.x * 0.5 + dx * 0.5,
        y: velocity.current.y * 0.5 + dy * 0.5,
      };
      const vp = viewportRef.current;
      vp.x = dragStartViewport.current.x - (e.clientX - dragStartScreen.current.x) / vp.zoom;
      vp.y = dragStartViewport.current.y - (e.clientY - dragStartScreen.current.y) / vp.zoom;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      notifyViewportChange();
    };

    /* ── 鼠标释放 ── */
    const onPointerUp = (e: PointerEvent) => {
      isDragging.current = false;

      const dx = Math.abs(e.clientX - clickPos.current.x);
      const dy = Math.abs(e.clientY - clickPos.current.y);
      const dt = Date.now() - clickTime.current;

      if (dx < 5 && dy < 5 && dt < 300 && clickCallbackRef.current) {
        const rect = canvas.getBoundingClientRect();
        const vp = viewportRef.current;
        const wx = vp.x + (e.clientX - rect.left) / vp.zoom;
        const wy = vp.y + (e.clientY - rect.top) / vp.zoom;
        clickCallbackRef.current(wx, wy);
      }

      const speed = Math.hypot(velocity.current.x, velocity.current.y);
      if (speed > INTERACTION.MOMENTUM_THRESHOLD) {
        const tick = () => {
          velocity.current.x *= INTERACTION.MOMENTUM_FRICTION;
          velocity.current.y *= INTERACTION.MOMENTUM_FRICTION;
          if (Math.abs(velocity.current.x) < 0.1 && Math.abs(velocity.current.y) < 0.1) return;
          const vp = viewportRef.current;
          vp.x -= velocity.current.x / vp.zoom;
          vp.y -= velocity.current.y / vp.zoom;
          notifyViewportChange();
          momentumRaf.current = requestAnimationFrame(tick);
        };
        momentumRaf.current = requestAnimationFrame(tick);
      }
    };

    /* ── 触控 ── */
    const onTouchStart = (e: TouchEvent) => {
      cancelAnimationFrame(momentumRaf.current);
      if (e.touches.length === 1) {
        isDragging.current = true;
        const t = e.touches[0];
        dragStartScreen.current = { x: t.clientX, y: t.clientY };
        dragStartViewport.current = { x: viewportRef.current.x, y: viewportRef.current.y };
        clickPos.current = { x: t.clientX, y: t.clientY };
        clickTime.current = Date.now();
        velocity.current = { x: 0, y: 0 };
        lastPointer.current = { x: t.clientX, y: t.clientY };
      } else if (e.touches.length === 2) {
        isDragging.current = false;
        pinchDist.current = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging.current) {
        const t = e.touches[0];
        const dx = t.clientX - lastPointer.current.x;
        const dy = t.clientY - lastPointer.current.y;
        velocity.current = {
          x: velocity.current.x * 0.5 + dx * 0.5,
          y: velocity.current.y * 0.5 + dy * 0.5,
        };
        const vp = viewportRef.current;
        vp.x = dragStartViewport.current.x - (t.clientX - dragStartScreen.current.x) / vp.zoom;
        vp.y = dragStartViewport.current.y - (t.clientY - dragStartScreen.current.y) / vp.zoom;
        lastPointer.current = { x: t.clientX, y: t.clientY };
        notifyViewportChange();
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
        if (pinchDist.current > 0) {
          const rect = canvas.getBoundingClientRect();
          const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          zoomTo(cx, cy, viewportRef.current.zoom * (dist / pinchDist.current));
        }
        pinchDist.current = dist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        if (e.changedTouches[0]) {
          const t = e.changedTouches[0];
          const dx = Math.abs(t.clientX - clickPos.current.x);
          const dy = Math.abs(t.clientY - clickPos.current.y);
          const dt = Date.now() - clickTime.current;
          if (dx < 10 && dy < 10 && dt < 300 && clickCallbackRef.current) {
            const rect = canvas.getBoundingClientRect();
            const vp = viewportRef.current;
            const wx = vp.x + (t.clientX - rect.left) / vp.zoom;
            const wy = vp.y + (t.clientY - rect.top) / vp.zoom;
            clickCallbackRef.current(wx, wy);
          }
        }
        const speed = Math.hypot(velocity.current.x, velocity.current.y);
        if (speed > INTERACTION.MOMENTUM_THRESHOLD) {
          const tick = () => {
            velocity.current.x *= INTERACTION.MOMENTUM_FRICTION;
            velocity.current.y *= INTERACTION.MOMENTUM_FRICTION;
            if (Math.abs(velocity.current.x) < 0.1 && Math.abs(velocity.current.y) < 0.1) return;
            viewportRef.current.x -= velocity.current.x / viewportRef.current.zoom;
            viewportRef.current.y -= velocity.current.y / viewportRef.current.zoom;
            notifyViewportChange();
            momentumRaf.current = requestAnimationFrame(tick);
          };
          momentumRaf.current = requestAnimationFrame(tick);
        }
        isDragging.current = false;
      }
      if (e.touches.length < 2) pinchDist.current = 0;
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    // 初始视口通知
    notifyViewportChange();

    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(momentumRaf.current);
    };
  }, [app, zoomTo, notifyViewportChange]);

  return { viewportRef, setClickCallback };
}
