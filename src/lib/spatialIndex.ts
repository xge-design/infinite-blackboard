/**
 * 无限黑板 — 空间哈希索引
 *
 * 轻量 O(1) 平均空间索引，用于视口裁剪和命中检测。
 * 将世界空间划分为固定大小的单元格。
 *
 * 未来迁移：
 *   - Supabase：PostGIS ST_Intersects 或包围盒 GiST 索引
 *   - Neo4j：原生空间索引（point 类型 + 空间过程）
 */

import { BlackboardMessage, SpatialIndex } from '@/types';
import { CANVAS } from './constants';

const CELL_SIZE = 256;

export function createSpatialIndex(): SpatialIndex {
  const grid = new Map<string, BlackboardMessage[]>();

  function cellKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  function toCell(wx: number, wy: number): [number, number] {
    return [Math.floor(wx / CELL_SIZE), Math.floor(wy / CELL_SIZE)];
  }

  function* cellsInRect(
    x: number, y: number, w: number, h: number
  ): Generator<[number, number]> {
    const [cx0, cy0] = toCell(x, y);
    const [cx1, cy1] = toCell(x + w, y + h);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        yield [cx, cy];
      }
    }
  }

  function insert(message: BlackboardMessage): void {
    const halfW = CANVAS.CARD_WIDTH / 2;
    const halfH = CANVAS.CARD_HEIGHT / 2;
    const [cx0, cy0] = toCell(message.position.x - halfW, message.position.y - halfH);
    const [cx1, cy1] = toCell(message.position.x + halfW, message.position.y + halfH);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const key = cellKey(cx, cy);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key)!.push(message);
      }
    }
  }

  function queryRect(
    x: number, y: number, w: number, h: number
  ): BlackboardMessage[] {
    const seen = new Set<string>();
    const results: BlackboardMessage[] = [];
    for (const [cx, cy] of cellsInRect(x, y, w, h)) {
      const cell = grid.get(cellKey(cx, cy));
      if (!cell) continue;
      for (const msg of cell) {
        if (seen.has(msg.id)) continue;
        seen.add(msg.id);
        const halfW = CANVAS.CARD_WIDTH / 2;
        const halfH = CANVAS.CARD_HEIGHT / 2;
        if (
          msg.position.x + halfW >= x &&
          msg.position.x - halfW <= x + w &&
          msg.position.y + halfH >= y &&
          msg.position.y - halfH <= y + h
        ) {
          results.push(msg);
        }
      }
    }
    return results;
  }

  function hitTest(wx: number, wy: number): BlackboardMessage | null {
    const [cx, cy] = toCell(wx, wy);
    const cell = grid.get(cellKey(cx, cy));
    if (!cell) return null;

    let closest: BlackboardMessage | null = null;
    let closestDist = Infinity;

    for (const msg of cell) {
      const halfW = CANVAS.CARD_WIDTH / 2;
      const halfH = CANVAS.CARD_HEIGHT / 2;
      const dx = Math.abs(wx - msg.position.x);
      const dy = Math.abs(wy - msg.position.y);
      if (dx <= halfW && dy <= halfH) {
        const dist = dx * dx + dy * dy;
        if (dist < closestDist) {
          closestDist = dist;
          closest = msg;
        }
      }
    }
    return closest;
  }

  function clear(): void {
    grid.clear();
  }

  return { insert, queryRect, hitTest, clear };
}

/**
 * 从消息列表构建空间索引。
 */
export function buildSpatialIndex(messages: BlackboardMessage[]): SpatialIndex {
  const index = createSpatialIndex();
  for (const msg of messages) index.insert(msg);
  return index;
}
