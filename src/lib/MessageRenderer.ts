/**
 * 无限黑板 — PixiJS 消息渲染器
 *
 * 三级细节渲染：
 *   - 远景（< 0.25×）：单个 Graphics 对象批量绘制彩色点阵
 *   - 中景（0.25–0.6×）：Text 对象池显示缩略文本
 *   - 近景（> 0.6×）：完整文本渲染
 *
 * 性能设计：
 *   - 远景使用单个 Graphics 批量绘制，而非每点一个对象
 *   - 中/近景使用 Text 对象池，按需创建和回收
 *   - 空间索引实现视口裁剪，仅渲染可见消息
 *   - 呼吸动画通过 ticker 常量驱动，无外部状态
 */

import * as PIXI from 'pixi.js';
import { BlackboardMessage, SpatialIndex } from '@/types';
import { ZOOM_LEVELS, CANVAS } from '@/lib/constants';
import { hexToNum } from '@/lib/colors';

/** 中文字体族 */
const FONT_FAMILY = '"LXGW WenKai", "Noto Serif SC", "Source Han Serif SC", serif';

/** 对象池上限，防止极端缩放时内存膨胀 */
const MAX_POOL_SIZE = 300;

export class MessageRenderer {
  private dotGraphics: PIXI.Graphics;
  private textPool: Map<string, PIXI.Text> = new Map();
  private app: PIXI.Application;
  private spatialIndex: SpatialIndex;

  constructor(app: PIXI.Application, spatialIndex: SpatialIndex) {
    this.app = app;
    this.spatialIndex = spatialIndex;

    // 远景：单个 Graphics 批量绘制所有点
    this.dotGraphics = new PIXI.Graphics();
  }

  /**
   * 根据缩放等级渲染消息。
   *
   * @param world   世界容器（应用了视口变换）
   * @param vpX     视口左上角世界 X
   * @param vpY     视口左上角世界 Y
   * @param vpW     视口世界宽度
   * @param vpH     视口世界高度
   * @param zoom    当前缩放
   * @param time    ticker 时间（毫秒），用于呼吸动画
   */
  render(
    world: PIXI.Container,
    vpX: number,
    vpY: number,
    vpW: number,
    vpH: number,
    zoom: number,
    time: number
  ): void {
    // 额外边距防止边缘闪烁
    const pad = 300 / zoom;
    const visible = this.spatialIndex.queryRect(
      vpX - pad,
      vpY - pad,
      vpW + pad * 2,
      vpH + pad * 2
    );

    if (zoom < ZOOM_LEVELS.DOT_MAX) {
      this.renderDots(world, visible, zoom, time);
    } else {
      this.renderText(world, visible, zoom, time);
    }
  }

  /* ═══════════════════════════════════════════
     远景：批量点阵
     ═══════════════════════════════════════════ */

  private renderDots(
    world: PIXI.Container,
    messages: BlackboardMessage[],
    zoom: number,
    time: number
  ): void {
    // 移除文字层
    this.recycleAllText(world);

    const g = this.dotGraphics;
    g.clear();

    // 取屏幕上的点半径
    const screenRadius = Math.max(
      CANVAS.MIN_SCREEN_DOT,
      Math.min(CANVAS.MAX_SCREEN_DOT, CANVAS.DOT_RADIUS * zoom)
    );

    for (const msg of messages) {
      const breathe = 0.85 + 0.15 * Math.sin(time * 0.001 + msg.position.x * 0.01);
      const alpha = msg.opacity * breathe;
      g.beginFill(hexToNum(msg.color), alpha);
      g.drawCircle(msg.position.x, msg.position.y, screenRadius / zoom);
      g.endFill();
    }

    if (!g.parent) world.addChild(g);
  }

  /* ═══════════════════════════════════════════
     中/近景：文本对象池
     ═══════════════════════════════════════════ */

  private renderText(
    world: PIXI.Container,
    messages: BlackboardMessage[],
    zoom: number,
    time: number
  ): void {
    if (this.dotGraphics.parent) {
      this.dotGraphics.parent.removeChild(this.dotGraphics);
    }

    const visibleIds = new Set(messages.map((m) => m.id));
    const isFullText = zoom >= ZOOM_LEVELS.FULL_TEXT_MIN;

    for (const [id, text] of this.textPool) {
      if (!visibleIds.has(id)) {
        if (text.parent) text.parent.removeChild(text);
        text.destroy();
        this.textPool.delete(id);
      }
    }

    for (const msg of messages) {
      let text = this.textPool.get(msg.id);

      if (!text) {
        if (this.textPool.size >= MAX_POOL_SIZE) continue;
        text = new PIXI.Text('', this.getTextStyle(msg, isFullText));
        text.anchor.set(0.5, 0.5);
        this.textPool.set(msg.id, text);
        world.addChild(text);
      }

      text.x = msg.position.x;
      text.y = msg.position.y;
      text.rotation = (msg.rotation || 0) * Math.PI / 180;

      // 完整显示或缩略——永不截断
      const displayText = isFullText
        ? msg.content
        : this.condense(msg.content);
      if (text.text !== displayText) {
        text.text = displayText;
        text.style = this.getTextStyle(msg, isFullText);
      }

      const breathe = 0.85 + 0.15 * Math.sin(time * 0.001 + msg.position.x * 0.01);
      text.alpha = msg.opacity * breathe;
    }
  }

  /* ═══════════════════════════════════════════
     辅助方法
     ═══════════════════════════════════════════ */

  private getTextStyle(msg: BlackboardMessage, full: boolean): PIXI.TextStyle {
    return new PIXI.TextStyle({
      fontFamily: FONT_FAMILY,
      fontSize: full ? 54 : 42,
      fill: msg.color,
      wordWrap: true,
      wordWrapWidth: full ? 500 : 400,
      align: 'center',
      lineHeight: full ? 72 : 56,
      letterSpacing: 2,
    });
  }

  /** 中景缩略：保留句式，只缩短愿望部分 */
  private condense(text: string): string {
    const prefix = '在我死去之前，我想';
    if (text.startsWith(prefix)) {
      const wish = text.slice(prefix.length).replace(/[。\.]$/, '');
      if (wish.length > 6) {
        return prefix + wish.slice(0, 6) + '……';
      }
    }
    return text.length > 16 ? text.slice(0, 16) + '……' : text;
  }

  private recycleAllText(world: PIXI.Container): void {
    for (const [id, text] of this.textPool) {
      if (text.parent) text.parent.removeChild(text);
      text.destroy();
    }
    this.textPool.clear();
  }

  /**
   * 清理所有渲染资源。
   */
  destroy(world: PIXI.Container): void {
    this.recycleAllText(world);
    if (this.dotGraphics.parent) {
      this.dotGraphics.parent.removeChild(this.dotGraphics);
    }
    this.dotGraphics.destroy();
  }
}
