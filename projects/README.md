# 云点餐系统

基于Next.js 16和智谱AI向量嵌入的智能云点餐推荐系统

## 📋 项目简介

本项目是一个现代化的智能云点餐系统，采用Next.js 16、React 19、TypeScript等前沿技术栈开发，集成智谱AI embedding-2模型实现语义搜索推荐功能，为用户提供智能、便捷的点餐体验，同时为商家提供高效的运营管理工具。

## 🛠 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | Next.js | 16 | 服务端渲染、路由管理、API集成 |
| 前端库 | React | 19 | 组件化开发、状态管理 |
| 类型系统 | TypeScript | 5.6 | 类型安全、代码质量 |
| UI组件 | shadcn/ui | - | 现代化UI组件库 |
| 样式方案 | Tailwind CSS | 4.0 | 响应式设计、快速开发 |
| 图标库 | Lucide React | - | 轻量美观的图标 |
| 通知系统 | Sonner | - | 优雅的Toast通知 |
| 后端 | Next.js API Routes | - | 服务端API实现 |
| 数据库 | Supabase | - | PostgreSQL托管服务 |
| AI | 智谱AI Embedding API | embedding-2 | 语义搜索推荐 |
| 工具 | pnpm | 8.0+ | 包管理 |

## ✨ 实现功能

### 用户端功能
- 🔍 **智能搜索**：基于语义的菜品搜索推荐
- 📱 **响应式界面**：完美适配PC端和移动端
- 👤 **用户系统**：注册、登录、个人中心
- 🛒 **购物车管理**：添加、删除、修改数量
- 📋 **订单管理**：查看历史订单、订单详情
- ⭐ **菜品评价**：对菜品进行评分和评论
- � **猜你喜欢**：基于用户行为的智能推荐

### 商家端功能
- 🏪 **菜品管理**：添加、编辑、删除菜品
- 📊 **订单处理**：接收、确认、完成订单
- 📈 **销售统计**：销售额、热门菜品分析
- 🎨 **分类管理**：菜品分类维护
- 👥 **用户管理**：查看用户信息
- 📉 **数据分析**：销售趋势、用户偏好分析

### 系统特色
- 🌐 **语义搜索**：理解用户意图，推荐相关菜品
- 🎨 **现代化UI**：美观大方的界面设计
- ⚡ **高性能**：服务端渲染，快速响应
- 🔒 **安全可靠**：JWT认证，数据加密
- 📱 **移动友好**：触摸优化，流畅体验

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── cart/          # 购物车相关API
│   │   ├── categories/    # 分类相关API
│   │   ├── dishes/        # 菜品相关API
│   │   ├── init/          # 初始化API
│   │   ├── merchant/      # 商家相关API
│   │   ├── orders/        # 订单相关API
│   │   ├── recommend/     # 推荐相关API
│   │   ├── reviews/       # 评价相关API
│   │   ├── upload/        # 上传相关API
│   │   └── user/          # 用户相关API
│   ├── favicon.ico        # 网站图标
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 应用布局
│   ├── page.tsx           # 首页
│   └── robots.ts          # 搜索引擎配置
├── components/            # 组件
│   └── ui/               # shadcn/ui组件
├── hooks/                 # 自定义钩子
│   └── use-mobile.ts      # 移动端检测钩子
├── lib/                   # 工具库
│   ├── auth/             # 认证相关
│   ├── recommend/        # 推荐算法
│   └── utils.ts          # 通用工具
├── storage/               # 存储
│   └── database/         # 数据库配置
│       ├── shared/       # 共享配置
│       └── supabase-client.ts  # Supabase客户端
└── types/                 # 类型定义
    └── index.ts          # 全局类型
```

## 🚀 项目搭建

### 环境要求
- Node.js 20.0.0+
- pnpm 8.0.0+
- Supabase账号
- 智谱AI API密钥

### 搭建步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd projects
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   创建 `.env.local` 文件：
   ```
   # Supabase配置
   COZE_SUPABASE_URL=<your-supabase-url>
   COZE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   
   # 智谱AI配置
   ZHIPU_API_KEY=<your-zhipu-api-key>
   ```

4. **初始化数据库**
   运行初始化API：
   ```bash
   # 启动开发服务器
   pnpm dev
   
   # 访问初始化接口
   curl http://localhost:3000/api/init
   ```

5. **启动开发服务器**
   ```bash
   pnpm dev
   ```

6. **访问项目**
   打开浏览器访问：`http://localhost:3000`

## 🎯 核心实现

### 1. 智能推荐系统

**实现原理**：
- 使用智谱AI embedding-2模型生成菜品向量
- 计算用户搜索词与菜品向量的余弦相似度
- 返回相似度最高的菜品作为推荐结果

**关键代码**：
```typescript
// src/lib/recommend/embedding.ts
async function generateEmbedding(text: string) {
  const response = await fetch('https://open.bigmodel.cn/api/mock/embedding-2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`
    },
    body: JSON.stringify({
      input: text,
      model: 'embedding-2'
    })
  });
  // 处理响应...
}
```

### 2. 响应式设计

**实现原理**：
- 使用Tailwind CSS的响应式类
- 结合自定义use-mobile钩子
- 根据屏幕尺寸调整布局和组件

**关键代码**：
```typescript
// src/hooks/use-mobile.ts
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}
```

### 3. 数据管理

**实现原理**：
- 使用Supabase作为数据库
- 通过Next.js API Routes实现后端逻辑
- 前端使用fetch API调用后端接口

**关键代码**：
```typescript
// src/storage/database/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  return createClient(
    process.env.COZE_SUPABASE_URL!,
    process.env.COZE_SUPABASE_ANON_KEY!
  );
}
```

### 4. 错误处理与性能优化

**实现原理**：
- 使用AbortController处理组件卸载时的API请求
- 优化前端渲染性能
- 确保分类图标正确显示

**关键代码**：
```typescript
// src/app/page.tsx - 错误处理示例
const checkAuth = async (signal?: AbortSignal) => {
  try {
    // 检查信号是否已经被中止
    if (signal?.aborted) {
      return;
    }
    
    // API请求...
  } catch (error) {
    // 未登录或请求被取消
  }
};

// 优化分类图标显示
const fetchDishes = async (signal?: AbortSignal) => {
  // ...
  if (data.success) {
    // 定义分类图标映射
    const categoryIcons: Record<number, string> = {
      1: '🔥', // 热菜
      2: '🥗', // 凉菜
      3: '🍲', // 汤品
      4: '🍚', // 主食
      5: '🍢', // 小吃
      6: '🥤', // 饮料
      7: '🍎'  // 水果
    };
    
    // 为每个菜品添加正确的分类图标
    const dishesWithCorrectIcons = (data.data || []).map((dish: any) => {
      if (dish.categories) {
        return {
          ...dish,
          categories: {
            ...dish.categories,
            icon: categoryIcons[dish.categories.id] || dish.categories.icon || '🍽️'
          }
        };
      }
      return dish;
    });
    
    setDishes(dishesWithCorrectIcons);
  }
  // ...
};
```

## ⚠️ 注意事项

1. **Supabase数据库**
   - 免费版7天无活动会被暂停
   - 建议配置定时任务保持数据库活跃
   - 生产环境建议使用付费版以获得更好的性能

2. **智谱AI API**
   - 确保API密钥有效且有足够余额
   - 注意API调用频率限制
   - 考虑添加缓存机制减少API调用

3. **环境变量**
   - 生产部署前确保所有环境变量已正确配置
   - 不要将敏感信息硬编码到代码中
   - 使用.env.local文件管理本地环境变量

4. **性能优化**
   - 图片资源建议使用CDN
   - 考虑实现服务器端缓存
   - 大型页面使用代码分割

5. **安全性**
   - 实现适当的认证和授权
   - 对用户输入进行验证
   - 保护敏感API端点

## 🚧 项目搭建遇到的问题及解决方案

### 1. Supabase连接问题

**问题**：无法连接到Supabase数据库
**解决方案**：
- 检查环境变量是否正确配置
- 确保网络连接正常
- 验证Supabase项目状态是否正常
- 检查API密钥是否有效

### 2. 智谱AI API调用失败

**问题**：API调用返回错误
**解决方案**：
- 检查API密钥是否正确
- 确保账户有足够余额
- 检查网络连接
- 查看API文档了解错误代码含义

### 3. 依赖安装失败

**问题**：pnpm install失败
**解决方案**：
- 确保Node.js版本符合要求
- 清理缓存：`pnpm cache clean`
- 检查网络连接
- 尝试使用npm替代pnpm

### 4. 开发服务器启动失败

**问题**：pnpm dev启动失败
**解决方案**：
- 检查端口是否被占用
- 检查环境变量配置
- 查看控制台错误信息
- 尝试删除node_modules重新安装

## ❓ 可能遇到的问题及解决方案

### 1. 页面加载缓慢

**原因**：图片资源过大或未优化
**解决方案**：
- 压缩图片资源
- 使用WebP格式
- 实现图片懒加载
- 配置CDN加速

### 2. 移动端显示异常

**原因**：响应式设计问题
**解决方案**：
- 检查Tailwind响应式类
- 使用use-mobile钩子检测设备
- 测试不同屏幕尺寸
- 优化触摸交互

### 3. 推荐系统不准确

**原因**：向量模型训练不足
**解决方案**：
- 增加菜品描述的丰富度
- 优化向量生成参数
- 考虑结合协同过滤算法
- 收集用户反馈持续优化

### 4. 数据库查询性能问题

**原因**：查询未优化或缺少索引
**解决方案**：
- 为常用查询字段添加索引
- 优化复杂查询
- 实现数据缓存
- 考虑使用数据库视图

### 5. 部署后访问失败

**原因**：环境配置或网络问题
**解决方案**：
- 检查环境变量配置
- 验证数据库连接
- 查看服务器日志
- 确保防火墙规则正确

## 📦 部署指南

### Vercel部署

1. **连接GitHub仓库**
   - 登录Vercel账号
   - 点击"New Project"
   - 选择项目仓库

2. **配置环境变量**
   - 在Vercel项目设置中添加环境变量
   - 包括Supabase和智谱AI的配置

3. **部署项目**
   - 点击"Deploy"
   - 等待构建完成
   - 访问部署地址

### 其他部署方式

- **Docker**：使用Dockerfile构建容器
- **AWS**：部署到EC2或Lambda
- **GCP**：部署到App Engine
- **Azure**：部署到App Service

## 📊 数据结构

### 主要数据表

1. **dishes** - 菜品表
   - id: 菜品ID
   - name: 菜品名称
   - description: 菜品描述
   - price: 价格
   - stock: 库存
   - category_id: 分类ID
   - image: 图片URL
   - is_active: 是否上架

2. **categories** - 分类表
   - id: 分类ID
   - name: 分类名称
   - icon: 分类图标
   - sort_order: 排序顺序

3. **orders** - 订单表
   - id: 订单ID
   - order_no: 订单编号
   - user_id: 用户ID
   - merchant_id: 商家ID
   - total_price: 总价格
   - status: 订单状态
   - order_type: 订单类型（dine_in, takeaway, delivery）
   - payment_method: 支付方式
   - created_at: 创建时间

4. **order_items** - 订单详情表
   - id: 详情ID
   - order_id: 订单ID
   - dish_id: 菜品ID
   - dish_name: 菜品名称
   - price: 单价
   - quantity: 数量
   - subtotal: 小计

5. **users** - 用户表
   - id: 用户ID
   - username: 用户名
   - password: 密码
   - email: 邮箱
   - phone: 电话
   - avatar: 头像
   - real_name: 真实姓名
   - address: 地址
   - is_active: 是否激活

6. **merchants** - 商家表
   - id: 商家ID
   - username: 用户名
   - password: 密码
   - shop_name: 店铺名称
   - email: 邮箱
   - phone: 电话
   - address: 地址
   - logo: 店铺logo
   - description: 店铺描述
   - rating: 评分
   - total_sales: 总销售额
   - is_active: 是否激活

## 🎯 技术亮点

1. **现代前端技术栈**：Next.js 16、React 19、TypeScript
2. **AI智能推荐**：基于智谱AI向量嵌入的语义搜索
3. **响应式设计**：完美适配各种设备
4. **完整的前后端架构**：一体化开发模式
5. **性能优化**：服务端渲染、代码分割、缓存策略
6. **安全性**：JWT认证、数据加密、输入验证
7. **错误处理**：AbortController机制处理组件卸载时的API请求
8. **UI优化**：确保分类图标正确显示，提升用户体验
9. **数据管理**：完善的数据库结构和数据初始化流程
10. **可维护性**：清晰的代码结构和详细的文档

## 📈 未来规划

- [ ] 多语言支持
- [ ] 深色模式
- [ ] 支付集成
- [ ] 会员系统
- [ ] 数据分析仪表板
- [ ] 第三方配送集成
- [ ] 菜品评论系统
- [ ] 促销活动管理



感谢使用云点餐系统