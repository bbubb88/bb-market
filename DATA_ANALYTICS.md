# BB Market 数据分析与运营体系

## 一、关键指标定义

### 1.1 用户指标

| 指标名称 | 定义 | 计算方式 | 目标参考 |
|---------|------|---------|---------|
| 注册用户数 | 累计完成注册的用户总数 | COUNT(DISTINCT user_id) | 日增 50+ |
| 新增用户数 | 特定时间段内新注册用户 | COUNT(*) WHERE created_at BETWEEN start AND end | 日增 50+ |
| DAU | 日活跃用户数（当天访问的用户） | COUNT(DISTINCT user_id) WHERE date = today | - |
| WAU | 周活跃用户数 | COUNT(DISTINCT user_id) WHERE week = current_week | - |
| MAU | 月活跃用户数 | COUNT(DISTINCT user_id) WHERE month = current_month | - |
| 次日留存率 | 次日回访的用户比例 | (DAU_n / DAU_0) × 100% | ≥ 40% |
| 7日留存率 | 7天后回访的用户比例 | (DAU_7 / DAU_0) × 100% | ≥ 20% |
| 30日留存率 | 30天后回访的用户比例 | (DAU_30 / DAU_0) × 100% | ≥ 10% |
| 用户等级分布 | 各等级用户占比 | COUNT(*) GROUP BY level | - |

### 1.2 交易指标

| 指标名称 | 定义 | 计算方式 | 目标参考 |
|---------|------|---------|---------|
| GMV | 商品交易总额 | SUM(price * quantity) WHERE status = 'completed' | 日均 ¥10,000+ |
| 订单数 | 成功完成的订单总数 | COUNT(*) WHERE status = 'completed' | 日均 50+ |
| 客单价 | 每笔订单平均金额 | GMV / order_count | ≥ ¥200 |
| 支付转化率 | 完成支付的用户比例 | (paid_users / checkout_users) × 100% | ≥ 60% |
| 平均订单处理时长 | 下单到完成的时间 | AVG(completed_at - created_at) | < 24h |
| 退款率 | 退款订单占比 | (refunded_orders / total_orders) × 100% | < 5% |

### 1.3 商品指标

| 指标名称 | 定义 | 计算方式 | 目标参考 |
|---------|------|---------|---------|
| 上架商品数 | 当前在线的商品总数 | COUNT(*) WHERE status = 'active' | 持续增长 |
| 新增商品数 | 特定时间段内新增商品 | COUNT(*) WHERE created_at BETWEEN start AND end | 日增 100+ |
| 售罄率 | 卖出的商品比例 | (sold_count / total_listing_count) × 100% | ≥ 30% |
| 平均上架时长 | 商品上架到售出的时间 | AVG(sold_at - created_at) | < 7天 |
| 商品类目分布 | 各游戏/类型商品占比 | COUNT(*) GROUP BY game/type | - |
| 价格区间分布 | 各价格区间商品数量 | COUNT(*) GROUP BY price_range | - |

### 1.4 渠道指标

| 指标名称 | 定义 | 计算方式 | 目标参考 |
|---------|------|---------|---------|
| 流量来源 | 用户访问来源分布 | COUNT(*) GROUP BY referrer/source | - |
| 访问量 (PV) | 页面总访问次数 | SUM(page_views) | 日均 1000+ |
| 独立访客数 (UV) | 独立用户访问数 | COUNT(DISTINCT session_id) | 日均 200+ |
| 跳出率 | 只访问一个页面的用户比例 | (single_page_sessions / total_sessions) × 100% | < 50% |
| 转化率 | 访客下单比例 | (order_count / unique_visitors) × 100% | ≥ 5% |
| 渠道转化效率 | 各来源的转化率对比 | (orders / visitors) BY source | - |

---

## 二、数据追踪方案

### 2.1 推荐的免费分析工具

#### 方案 A：PostHog（推荐）

- **官网**: https://posthog.com
- **免费额度**: 100万事件/月，团队免费
- **优点**:
  - 开源自托管可选
  - 内置事件分析、漏斗、留存、用户路径
  - 支持 Senty 错误追踪
  - 提供 Analytics Dashboard
- **集成方式**: Next.js SDK

#### 方案 B：Plausible Analytics

- **官网**: https://plausible.io
- **免费额度**: 30天数据保留，1万UV/月
- **优点**:
  - 轻量级，无需 Cookie（符合 GDPR）
  - 实时仪表盘
  - 简单易用
- **缺点**: 事件追踪能力有限

#### 方案 C：Umami

- **官网**: https://umami.is
- **免费额度**: 开源自托管
- **优点**:
  - 完全免费
  - 数据自己掌控
  - 支持多网站
- **缺点**: 需要自行部署（Vercel/Railway）

#### 推荐组合

| 用途 | 工具 | 理由 |
|-----|------|------|
| 流量分析 | Plausible / Umami | 轻量、免费、无需 Consent |
| 行为分析 | PostHog | 事件追踪、漏斗、留存 |
| 错误监控 | Sentry (免费版) | 错误追踪 |

### 2.2 需要添加的追踪代码

#### 步骤 1：安装 PostHog

```bash
npm install posthog-js
```

#### 步骤 2：创建追踪配置文件

创建 `src/lib/analytics.ts`:

```typescript
import posthog from 'posthog-js';

export const initPostHog = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
    });
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, properties);
  }
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, traits);
  }
};
```

#### 步骤 3：在应用中集成

修改 `src/app/layout.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { initPostHog } from '@/lib/analytics';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

#### 步骤 4：添加事件追踪

在关键业务节点添加追踪：

```typescript
import { trackEvent, identifyUser } from '@/lib/analytics';

// 用户注册
trackEvent('user_registered', {
  user_id: user.id,
  registration_method: 'email', // 或 discord/telegram
});

// 用户登录
trackEvent('user_login', {
  user_id: user.id,
});

// 浏览商品
trackEvent('view_listing', {
  listing_id: listing.id,
  listing_type: listing.type,
  price: listing.price,
  game: listing.game,
});

// 加入购物车
trackEvent('add_to_cart', {
  listing_id: listing.id,
  price: listing.price,
});

// 开始结账
trackEvent('begin_checkout', {
  cart_total: cart.total,
  item_count: cart.items.length,
});

// 订单完成
trackEvent('order_completed', {
  order_id: order.id,
  order_value: order.total,
  payment_method: order.payment_method,
});

// 商品上架
trackEvent('listing_created', {
  listing_id: listing.id,
  listing_type: listing.type,
  price: listing.price,
  game: listing.game,
});

// 搜索
trackEvent('search', {
  query: searchQuery,
  results_count: results.length,
});
```

#### 步骤 5：环境变量

在 `.env.local` 中添加：

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 2.3 自定义事件清单

| 事件名称 | 触发时机 | 关键属性 |
|---------|---------|---------|
| page_view | 页面加载 | page_name, referrer |
| user_registered | 注册成功 | method, source |
| user_login | 登录成功 | method |
| view_listing | 查看商品详情 | listing_id, price, game |
| add_to_favorite | 收藏商品 | listing_id |
| add_to_cart | 加入购物车 | listing_id, price |
| remove_from_cart | 移出购物车 | listing_id |
| begin_checkout | 开始结账 | cart_total, item_count |
| add_payment_info | 添加支付信息 | payment_method |
| purchase | 完成购买 | order_id, value |
| listing_created | 商品上架 | listing_type, price, game |
| listing_sold | 商品售出 | listing_id, price |
| search | 搜索 | query, results_count |
| error | 错误发生 | error_type, error_message |

---

## 三、数据看板设计

### 3.1 核心数据指标列表

#### Dashboard 1：核心概览

```
┌─────────────────────────────────────────────────────────────┐
│                    📊 BB Market 核心数据                    │
├─────────────────────────────────────────────────────────────┤
│  今日数据 (2024-XX-XX)                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  GMV     │ │  订单数  │ │ 新增用户 │ │ 活跃用户 │       │
│  │ ¥12,580 │ │    58    │ │    45    │ │   320    │       │
│  │  ↑12%   │ │   ↑8%    │ │   ↑15%   │ │   ↑5%    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  关键转化率                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 访问→商品 │ │ 商品→购物 │ │ 购物→订单 │ │  客单价  │       │
│  │   35%    │ │   18%    │ │   72%    │ │  ¥217    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

#### Dashboard 2：用户分析

| 指标 | 今日 | 昨日 | 7日平均 | 30日平均 |
|-----|------|------|--------|---------|
| 新增注册 | 45 | 52 | 48 | 42 |
| DAU | 320 | 305 | 290 | 265 |
| WAU | 1,850 | 1,780 | 1,720 | 1,580 |
| MAU | 8,200 | 8,050 | 7,800 | 7,200 |
| 次日留存 | 42% | 40% | 41% | 40% |
| 7日留存 | 22% | 21% | 20% | 19% |

#### Dashboard 3：交易分析

| 指标 | 今日 | 昨日 | 7日平均 | 30日平均 |
|-----|------|------|--------|---------|
| GMV | ¥12,580 | ¥11,200 | ¥10,800 | ¥9,500 |
| 订单数 | 58 | 52 | 50 | 45 |
| 客单价 | ¥217 | ¥215 | ¥216 | ¥211 |
| 支付转化率 | 68% | 65% | 64% | 62% |
| 退款率 | 2.1% | 1.8% | 2.0% | 2.3% |
| 平均处理时长 | 4.2h | 5.1h | 4.8h | 5.2h |

#### Dashboard 4：商品分析

| 指标 | 今日 | 昨日 | 7日平均 |
|-----|------|------|--------|
| 上架商品 | 1,258 | 1,210 | 1,180 |
| 新增上架 | 85 | 92 | 78 |
| 售出商品 | 58 | 52 | 50 |
| 售罄率 | 4.6% | 4.3% | 4.2% |
| 平均上架时长 | 5.2天 | 5.5天 | 5.8天 |

#### Dashboard 5：流量分析

| 渠道 | 访问量 | 占比 | 转化率 |
|-----|-------|------|-------|
| 直接访问 | 450 | 35% | 6.2% |
| 搜索引擎 | 380 | 29% | 5.8% |
| 社交媒体 | 280 | 22% | 4.5% |
| Discord | 120 | 9% | 8.5% |
| 其他 | 70 | 5% | 3.2% |

### 3.2 日常关注报表

#### 每日晨间报表（自动发送）

1. **核心指标快照**
   - 昨日 GMV、订单数、用户数
   - 较前日变化百分比
   - 7日/30日移动平均对比

2. **异常预警**
   - GMV 较历史均值偏离 > 20%
   - 转化率异常波动 > 15%
   - 退款率超过阈值

3. **Top 榜单**
   - 热销商品 Top 10
   - 活跃卖家 Top 10
   - 新增商品 Top 10

#### 实时监控（可选）

| 监控项 | 阈值 | 告警方式 |
|-------|------|---------|
| GMV (小时) | < ¥200/h | 邮件/Discord |
| 支付失败率 | > 10% | 邮件/Discord |
| 接口错误率 | > 5% | 邮件/Discord |
| 新注册异常 | 较均值偏离 > 50% | 邮件 |

---

## 四、运营报告模板

### 4.1 周报模板

```
# 📊 BB Market 周报
## 2024年 第X周 (MM/DD - MM/DD)

### 一、本周核心数据

| 指标 | 本周 | 上周 | 环比 |
|-----|------|------|-----|
| GMV | ¥75,600 | ¥68,200 | +10.8% |
| 订单数 | 348 | 312 | +11.5% |
| 新增用户 | 318 | 285 | +11.6% |
| DAU (日均) | 385 | 352 | +9.4% |
| 客单价 | ¥217 | ¥219 | -0.9% |
| 支付转化率 | 68% | 65% | +3% |

### 二、用户分析

**新增用户趋势**
- 每日新增：45/52/38/41/55/48/39

**留存数据**
- 次日留存：42%
- 7日留存：22%
- 30日留存：12%

**用户分布**
- 注册方式：邮箱 65%，Discord 25%，Telegram 10%

### 三、商品分析

**商品概览**
- 当前上架：1,280件
- 本周新增：520件
- 本周售出：348件
- 售罄率：27.2%

**热销类目**
1. 游戏账号 - 45%
2. 游戏道具 - 30%
3. 游戏货币 - 25%

**热门游戏**
1. 原神 - 35%
2. 崩坏星穹铁道 - 25%
3. 英雄联盟 - 20%

### 四、流量分析

| 来源 | 访问量 | 占比 | 转化率 |
|-----|-------|------|-------|
| 直接访问 | 2,850 | 34% | 6.5% |
| 搜索 | 2,420 | 29% | 5.8% |
| 社媒 | 1,680 | 20% | 4.2% |
| Discord | 1,020 | 12% | 8.2% |
| 其他 | 430 | 5% | 3.5% |

### 五、本周亮点 ✨

- [ ] GMV 首次突破 7.5万
- [ ] 新增 Discord 推广渠道
- [ ] 上线新功能：商品收藏

### 六、问题与优化 🚧

1. **问题**：支付转化率周末下降明显
   - **分析**：需验证支付流程
   - **行动**：A/B 测试支付按钮文案

2. **问题**：某些游戏商品稀缺
   - **分析**：热门游戏供给不足
   - **行动**：联系更多卖家

### 七、下周计划 🎯

- [ ] 目标 GMV：¥85,000 (+12%)
- [ ] 上线限时折扣活动
- [ ] 优化商品搜索排序

---
报告生成时间：2024-XX-XX XX:XX
```

### 4.2 月报模板

```
# 📈 BB Market 月度运营报告
## 2024年 X月

### 一、核心数据概览

| 指标 | 本月 | 上月 | 环比 |
|-----|------|------|-----|
| GMV | ¥285,000 | ¥242,000 | +17.8% |
| 订单数 | 1,320 | 1,108 | +19.1% |
| 新增用户 | 1,280 | 1,050 | +21.9% |
| MAU | 8,500 | 7,200 | +18.1% |
| 客单价 | ¥216 | ¥218 | -0.9% |
| 总体转化率 | 5.8% | 5.2% | +11.5% |

### 二、用户增长

**月度趋势**
- 日均新增：42.7
- 最高单日：68 (周六)
- 最低单日：25 (周一)

**用户结构**
- 总注册用户：3,850
- 活跃用户 (MAU)：8,500
- 付费用户：1,320
- 付费率：15.5%

**留存表现**
| 周期 | 当月 | 上月 | 变化 |
|-----|------|------|-----|
| 次日留存 | 42% | 40% | +2% |
| 7日留存 | 21% | 19% | +2% |
| 30日留存 | 11% | 10% | +1% |

### 三、交易分析

**GMV 趋势**
- 第1周：¥62,000
- 第2周：¥68,000
- 第3周：¥72,000
- 第4周：¥83,000 📈

**订单特征**
- 平均客单价：¥216
- 中位数客单价：¥180
- 最高单笔：¥2,500
- 最低单笔：¥10

**支付方式**
- 支付宝：55%
- 微信支付：30%
- USDT：15%

### 四、商品表现

**商品总数**
- 月初：980件
- 月末：1,280件
- 净增长：300件

**售罄率**
- 总体：27.2%
- 游戏账号：32%
- 游戏道具：25%
- 游戏货币：20%

**热销商品 Top 10**
1. 原神 - 满星初始号 - ¥388
2. 星穹铁道 - 50抽初始号 - ¥168
3. 英雄联盟 - 钻石段位号 - ¥588
4. ...

### 五、流量来源

| 渠道 | 访问量 | 占比 | 订单贡献 |
|-----|-------|------|---------|
| 直接访问 | 12,500 | 32% | 22% |
| 搜索 | 10,800 | 28% | 20% |
| 社媒 | 7,200 | 18% | 12% |
| Discord | 5,400 | 14% | 18% |
| 外链 | 2,700 | 7% | 8% |
| 其他 | 500 | 1% | 1% |

### 六、竞品对比

| 指标 | BB Market | 竞品A | 竞品B |
|-----|----------|-------|-------|
| GMV | ¥285K | ¥520K | ¥180K |
| 商品数 | 1,280 | 3,500 | 800 |
| 客单价 | ¥216 | ¥280 | ¥150 |
| 转化率 | 5.8% | 4.2% | 6.5% |

### 七、本月大事记

- 03/05：上线 Discord 登录
- 03/12：推出新用户优惠券
- 03/20：单日 GMV 创新高 ¥12,580
- 03/28：月度活跃用户突破 8,500

### 八、问题与挑战

1. **库存不足**：热门游戏商品经常售罄
2. **支付成功率**：周末略有下降
3. **客服响应**：高峰期响应时间较长

### 九、下月目标

| 指标 | 目标值 | 增长预期 |
|-----|-------|---------|
| GMV | ¥350,000 | +23% |
| 订单数 | 1,600 | +21% |
| 新增用户 | 1,600 | +25% |
| MAU | 10,000 | +18% |
| 客单价 | ¥220 | +2% |

### 十、下月计划

- [ ] 上线限时抢购功能
- [ ] 开展月度促销活动
- [ ] 引入更多游戏品类
- [ ] 优化移动端体验
- [ ] 增加客服人员

---
报告生成时间：2024-XX-XX
数据来源：PostHog + 数据库
```

---

## 五、技术实现建议

### 5.1 数据采集架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端      │────▶│   API       │────▶│  数据库     │
│  (PostHog)  │     │  (日志)     │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
                         │                     │
                         ▼                     ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  日志服务   │     │  报表系统   │
                    │  (可选)     │     │  (Metabase) │
                    └─────────────┘     └─────────────┘
```

### 5.2 推荐技术栈

| 用途 | 工具 | 成本 |
|-----|------|-----|
| 行为分析 | PostHog | 免费 (100万事件/月) |
| 流量统计 | Plausible / Umami | 免费/自托管 |
| 错误监控 | Sentry | 免费 |
| 数据可视化 | Metabase | 免费 (自托管) |
| 邮件报告 | Resend + Cron | 免费 |

### 5.3 快速启动清单

- [ ] 注册 PostHog 账号
- [ ] 安装 posthog-js SDK
- [ ] 配置环境变量
- [ ] 集成基础事件追踪
- [ ] 创建 Dashboard
- [ ] 设置邮件报告 Cron
- [ ] (可选) 部署 Metabase

---

## 附录

### A. 环境变量模板

```env
# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxxx
```

### B. 相关资源

- PostHog Next.js 集成: https://posthog.com/docs/libraries/next-js
- Plausible 脚本: https://plausible.io/docs/script
- Metabase 部署: https://www.metabase.com/docs/latest/operations-guide

---

*文档版本: v1.0*
*更新时间: 2024-XX-XX*
