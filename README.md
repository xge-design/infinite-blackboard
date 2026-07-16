<<<<<<< HEAD
# 无限黑板

> 一件数字公共艺术作品。
>
> 在我死去之前，我想______。

## 这是什么？

无限黑板是一块互联网时代的公共黑板。

每个人都可以匿名留下一句话——一个愿望、一个遗憾、一个承诺、一个勇气。

它不是社交媒体。不是论坛。不是留言板。

它是一件会持续成长的数字公共艺术作品。

## 版本

**V0.3** — 交互升级版

- 新增：可交互添加内容（＋按钮 → 输入愿望 → 自动加入画布）
- 修复：点击交互（修复 PixiJS 事件绑定与状态同步）
- 优化：字体放大约三倍（世界空间 38–54px，首次进入即可阅读）
- 优化：自然排版（随机偏移、微旋转、呼吸感留白）
- 优化：文字完整显示（中景缩略保留句式，不再截断为省略号）
- 优化：标题改为「在我死去之前，我想……」，纪念碑感
- 优化：输入体验（填写空白，系统自动拼接完整句子）

**V0.2** — 架构升级版

- 渲染引擎：Canvas2D → PixiJS 7（WebGL GPU 加速）
- 语言：英文 → 简体中文
- 句式：统一为「在我死去之前，我想______。」
- 字体：霞鹜文楷（开源中文手写字体）
- 扩展性：支持 100,000+ 消息节点

## 当前状态

- ✅ 纯前端数字艺术作品
- ✅ 500 条中文示例数据（本地生成）
- ✅ PixiJS WebGL 渲染（GPU 加速）
- ✅ 无限缩放 / 拖拽 / 惯性滚动
- ✅ 三级细节（点阵 → 摘要 → 全文）
- ✅ 点击查看详情
- ✅ 可交互添加内容（无持久化）
- ❌ 无数据库
- ❌ 无 AI
- ❌ 无用户注册
- ❌ 无社交功能

## 项目结构

```
infinite-blackboard/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # 根布局（字体、元数据）
│   │   ├── page.tsx                # 主页面（画布 + 弹窗 + 输入）
│   │   └── globals.css             # 全局样式（黑板纹理）
│   │
│   ├── components/
│   │   ├── PixiCanvas.tsx          # PixiJS 无限画布
│   │   ├── DetailModal.tsx         # 消息详情弹窗
│   │   └── InputModal.tsx          # 新增内容输入弹窗
│   │
│   ├── hooks/
│   │   └── usePixiViewport.ts      # 视口交互（缩放、拖拽、惯性）
│   │
│   ├── lib/
│   │   ├── ai.ts                   # AI 服务（桩：嵌入、聚类、情感）
│   │   ├── canvasUtils.ts          # 坐标变换工具
│   │   ├── colors.ts               # 粉笔色盘
│   │   ├── constants.ts            # 可调参数
│   │   ├── data.ts                 # 500 条中文示例数据
│   │   ├── MessageRenderer.ts      # PixiJS 消息渲染器（三级细节）
│   │   ├── spatialIndex.ts         # 空间哈希索引
│   │   ├── supabase.ts             # Supabase 客户端（桩）
│   │   └── timeline.ts             # 时间轴服务（桩）
│   │
│   └── types/
│       └── index.ts                # TypeScript 类型 + 数据库 Schema
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── README.md
```

## 快速开始

### 环境要求

- Node.js 18+
- npm / yarn / pnpm

### 安装与运行

```bash
cd infinite-blackboard
npm install
npm run dev
```

打开 http://localhost:3000

### 生产构建

```bash
npm run build
npm start
```

## 交互方式

| 操作 | 桌面端 | 移动端 |
|------|--------|--------|
| 平移 | 鼠标拖拽 | 单指拖拽 |
| 缩放 | 滚轮 | 双指捏合 |
| 选中 | 点击消息 | 点击消息 |
| 新增 | 右下角 ＋ 按钮 | 右下角 ＋ 按钮 |
| 关闭弹窗 | 点击空白 / Esc | 点击空白 |

## 缩放层级

画布在三个细节层级渲染：

1. **远景**（< 25% 缩放）：密集点阵——黑板如同星图
2. **中景**（25%–60%）：缩略文本——思想的低语
3. **近景**（> 60%）：完整文字——可以阅读的句子

## 部署

### Vercel（推荐）

1. 推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目
3. Vercel 自动识别 Next.js，无需额外配置

```bash
npx vercel
```

### Cloudflare Pages

静态导出：

```js
// next.config.js
const nextConfig = { output: 'export' };
```

```bash
npm run build
# 上传 out/ 目录到 Cloudflare Pages
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

## 未来路线图

### 第一阶段：数据持久化

- [ ] 接入 Supabase（PostgreSQL）
- [ ] 用户可提交消息
- [ ] 实时同步

### 第二阶段：AI 能力

- [ ] OpenAI 嵌入（text-embedding-3-small）
- [ ] pgvector 语义搜索
- [ ] 主题聚类
- [ ] 情感分析

### 第三阶段：时间与空间

- [ ] 时间轴播放（观看黑板成长）
- [ ] 星座视图（思想的星图）
- [ ] Neo4j 图数据库迁移

### 第四阶段：体验升级

- [ ] 更多语言支持
- [ ] 无障碍访问
- [ ] 移动端原生应用
- [ ] 社区内容审核

## 设计哲学

### 这是什么

- 一件**数字公共艺术作品**——不是社交平台
- 一块**共享黑板**——不是内容推送
- 一个**安静空间**——不是流量引擎
- 一座**成长中的纪念碑**——不是热门话题

### 这不是什么

- 没有点赞、投票、或反应
- 没有粉丝数或社交图谱
- 没有算法推荐或信息流
- 没有广告、追踪、或数据采集
- 阅读不需要登录
- 没有字数限制（但画布有自然约束）

### 美学

黑板美学是有意为之的：

- **粉笔字迹**——有温度的、人文的、不完美的
- **无限画布**——世界比你的屏幕更大
- **无界面**——艺术本身就是交互
- **呼吸动画**——黑板是活的，但安静的
- **句子之间的留白**——思考的空间
- **微旋转与偏移**——每个人写的字都有自己的姿态

## 技术栈

- **框架**：Next.js 14（App Router）
- **渲染**：PixiJS 7（WebGL GPU 加速）
- **样式**：Tailwind CSS
- **动画**：Framer Motion
- **语言**：TypeScript
- **字体**：霞鹜文楷（LXGW WenKai）

## 许可

MIT

---

*互联网需要更多安静的角落。*
=======
# infinite-blackboard
>>>>>>> a85786433396b89e4f5497cf4b470f3c40989e8d
