/**
 * 无限黑板 — 核心类型定义
 *
 * 数据结构兼容：
 *   - 当前：PixiJS 浏览器渲染
 *   - 未来：Supabase (PostgreSQL + pgvector)
 *   - 未来：Neo4j 图数据库
 *   - 未来：AI 向量嵌入与语义搜索
 */

/* ═══════════════════════════════════════════════════
   画布与视口
   ═══════════════════════════════════════════════════ */

/** 世界空间中的二维坐标 */
export interface Point {
  x: number;
  y: number;
}

/** 视口：当前可见的世界坐标区域 */
export interface Viewport {
  /** 世界空间左上角 X */
  x: number;
  /** 世界空间左上角 Y */
  y: number;
  /** 画布像素宽度 */
  width: number;
  /** 画布像素高度 */
  height: number;
  /** 缩放等级：1.0 = 100%，0.5 = 缩小，2.0 = 放大 */
  zoom: number;
}

/* ═══════════════════════════════════════════════════
   消息（黑板的原子单元）
   ═══════════════════════════════════════════════════ */

/**
 * 黑板上的一条消息。
 *
 * 唯一句式：「在我死去之前，我想______。」
 *
 * Neo4j 映射：
 *   节点标签: Message
 *   属性: id, content, language, color, createdAt
 *   空间索引: x, y（用于画布布局）
 *
 * pgvector 映射：
 *   列: embedding VECTOR(1536)
 *   索引: ivfflat 或 hnsw
 */
export interface BlackboardMessage {
  /** 唯一标识符（UUID v4） */
  id: string;

  /** 消息内容——作品的核心 */
  content: string;

  /** 无限画布上的世界坐标 */
  position: Point;

  /* ── 显示 ─────────────────────────────────── */

  /** 粉笔色调（十六进制） */
  color: string;
  /** 基础透明度（0.0–1.0） */
  opacity: number;
  /** 缩放为 1.0 时的字号（世界像素） */
  fontSize: number;
  /** 旋转角度（度，自然手写感） */
  rotation: number;

  /* ── 元数据 ────────────────────────────────── */

  /** ISO 639-1 语言代码 */
  language: string;
  /** ISO 8601 时间戳 */
  createdAt: string;

  /* ── 未来：AI 与图 ──────────────────────── */

  /**
   * OpenAI / 本地嵌入向量（text-embedding-3-small 为 1536 维）。
   * 用于 Supabase pgvector；在 Neo4j 中作为节点属性或外部查询。
   * 在嵌入管道运行前为 null。
   */
  embedding?: number[] | null;

  /**
   * 预计算的最近邻，用于星座视图。
   * 每个条目为 (messageId, 余弦相似度) 对。
   *
   * 在 Neo4j 中变为 SIMILAR_TO 边：
   *   (a)-[:SIMILAR_TO {weight: 0.87}]->(b)
   *
   * 在相似度图构建前为空。
   */
  nearestNeighbors: Array<{
    messageId: string;
    similarity: number;
  }>;

  /**
   * 情感分析分数（未来）。
   * 映射情感标签到置信度。
   * 在情感管道运行前为 null。
   */
  emotions?: Record<string, number> | null;

  /**
   * 主题聚类分配（未来）。
   * 映射到 Neo4j 中的 Topic 节点。
   * 在聚类运行前为 null。
   */
  topicCluster?: string | null;
}

/* ═══════════════════════════════════════════════════
   空间索引（画布优化）
   ═══════════════════════════════════════════════════ */

/**
 * 视口裁剪和命中检测的最小空间哈希。
 *
 * 未来迁移：替换为 PostGIS（Supabase）或 Neo4j 空间索引。
 */
export interface SpatialIndex {
  insert(message: BlackboardMessage): void;
  queryRect(x: number, y: number, w: number, h: number): BlackboardMessage[];
  hitTest(wx: number, wy: number): BlackboardMessage | null;
  clear(): void;
}

/* ═══════════════════════════════════════════════════
   Supabase / 数据库 Schema（参考）
   ═══════════════════════════════════════════════════ */

/*
  -- 未来 Supabase schema：

  CREATE TABLE messages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content      TEXT NOT NULL,
    language     TEXT NOT NULL DEFAULT 'zh',
    color        TEXT NOT NULL DEFAULT '#e8e4d9',
    position_x   DOUBLE PRECISION NOT NULL,
    position_y   DOUBLE PRECISION NOT NULL,
    embedding    VECTOR(1536),          -- pgvector
    emotions     JSONB,
    topic_cluster TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_messages_embedding
    ON messages USING hnsw (embedding vector_cosine_ops);
  CREATE INDEX idx_messages_created ON messages (created_at);
*/

/* ═══════════════════════════════════════════════════
   Neo4j 图 Schema（参考）
   ═══════════════════════════════════════════════════ */

/*
  -- 未来 Neo4j schema：

  (:Message {
    id: string,
    content: string,
    language: string,
    color: string,
    posX: float,
    posY: float,
    createdAt: datetime
  })

  (:Topic { id: string, name: string })

  (:Message)-[:BELONGS_TO]->(:Topic)
  (:Message)-[:SIMILAR_TO {weight: float}]->(:Message)
*/
