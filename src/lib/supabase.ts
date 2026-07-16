/**
 * 无限黑板 — Supabase 客户端（桩模块）
 *
 * 未来：初始化 Supabase 客户端用于数据库和认证。
 *
 * 设置步骤：
 *   1. 在 https://supabase.com 创建项目
 *   2. 复制项目 URL 和 anon key
 *   3. 添加到 .env.local：
 *        NEXT_PUBLIC_SUPABASE_URL=你的项目URL
 *        NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
 *   4. 在 SQL 编辑器中运行 src/types/index.ts 中的 SQL schema
 *   5. 取消注释下面的代码
 *
 * @module supabase
 */

// import { createClient } from '@supabase/supabase-js';
//
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
//
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** 占位导出——配置 Supabase 后替换为真实客户端 */
export const supabase = null;

/**
 * 未来：数据库操作
 * 将替换 data.ts 中的本地数据生成。
 */

/** 获取所有消息（分页） */
export async function fetchMessagesFromDB() {
  throw new Error('Supabase 未配置，使用本地示例数据。');
}

/** 插入新消息 */
export async function insertMessage(_message: {
  content: string;
  language: string;
  position_x: number;
  position_y: number;
  color: string;
}) {
  throw new Error('Supabase 未配置。');
}

/** 按嵌入向量相似度搜索消息（pgvector） */
export async function searchByEmbedding(_embedding: number[], _limit: number = 10) {
  throw new Error('pgvector 未配置。');
}
