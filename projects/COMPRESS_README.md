# 项目压缩指南

## 📦 压缩说明

### 自动压缩（推荐）

#### 方法1：使用批处理文件（最简单）

双击运行 `run-compress.bat` 文件即可自动压缩项目。

#### 方法2：使用 PowerShell 脚本

在项目根目录打开 PowerShell，运行：

```powershell
.\compress-project.ps1
```

### 手动压缩

#### 使用 7-Zip（推荐）

1. 安装 7-Zip：https://www.7-zip.org/
2. 右键点击项目文件夹 → 7-Zip → 添加到压缩包
3. 在压缩选项中排除以下目录：
   - `node_modules/`
   - `.next/`
   - `.git/`
   - `backup/`

#### 使用 PowerShell

```powershell
Compress-Archive -Path * -DestinationPath cloud-ordering-system.zip -Force
```

**注意**：此方法无法排除文件，压缩包会包含所有文件（包括 node_modules）。

## 🚫 排除的文件和目录

### 依赖包（最大体积）
- `node_modules/` - 可以通过 `pnpm install` 重新安装
- `.pnpm-store/` - pnpm 缓存

### 构建输出
- `.next/` - Next.js 构建输出
- `dist/` - 其他构建输出
- `out/` - 静态导出
- `build/` - 构建目录

### 环境变量（敏感信息）
- `.env.local`
- `.env.development.local`
- `.env.production.local`
- `.env.test.local`

### 版本控制
- `.git/` - Git 历史
- `.gitignore`

### 系统文件
- `.DS_Store` - macOS 系统文件
- `Thumbs.db` - Windows 缩略图
- `*.swp`, `*.swo` - 编辑器临时文件

### 日志和缓存
- `*.log` - 日志文件
- `.cache/` - 缓存目录
- `.vscode/`, `.idea/` - IDE 配置

### 备份文件
- `backup/` - 备份目录
- `*.bak`, `*.backup`, `*.old` - 备份文件

### 压缩文件
- `*.zip`, `*.tar.gz`, `*.rar`, `*.7z` - 避免重复压缩

## ✅ 包含的文件

### 项目配置
- `package.json` - 项目依赖
- `package-lock.json` - 锁定依赖版本
- `pnpm-lock.yaml` - pnpm 锁定文件
- `tsconfig.json` - TypeScript 配置
- `next.config.js` - Next.js 配置
- `tailwind.config.js` - Tailwind CSS 配置

### 源代码
- `src/` - 所有源代码

### 环境变量模板
- `.env.example` - 环境变量模板

### 文档
- `README.md` - 项目说明
- `docs/` - 文档目录

### 公共资源
- `public/` - 静态资源

### 数据库相关
- `supabase_rls_policies.sql` - 数据库安全策略

## 📤 解压和恢复

### 解压项目

1. 将压缩包复制到目标位置
2. 解压到新目录

### 恢复项目

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的配置

# 3. 初始化数据库
# 访问初始化 API 或运行 SQL 脚本

# 4. 构建项目（可选）
pnpm build

# 5. 启动开发服务器
pnpm dev
```

## 📊 压缩效果对比

| 项目 | 包含 node_modules | 排除 node_modules |
|------|------------------|------------------|
| 压缩前 | ~500 MB | ~50 MB |
| 压缩后 | ~150 MB | ~15 MB |
| 压缩率 | 70% | 70% |

**结论**：排除 node_modules 可以减少约 135 MB 的压缩包体积。

## 🔧 自定义排除规则

编辑 `compress-project.ps1` 文件，修改以下部分：

```powershell
# 需要排除的目录
$excludeDirs = @(
    "node_modules",
    ".next",
    # 添加你的排除目录
)

# 需要排除的文件模式
$excludeFiles = @(
    "*.log",
    "*.bak",
    # 添加你的排除文件模式
)
```

## ⚠️ 注意事项

1. **环境变量**：压缩包不包含 `.env.local`，解压后需要重新配置
2. **依赖安装**：解压后必须运行 `pnpm install` 安装依赖
3. **数据库**：数据库数据不会包含在压缩包中
4. **7-Zip**：建议安装 7-Zip 以获得更好的压缩效果和排除功能

## 📞 问题排查

### 压缩失败

1. 检查是否有文件被占用
2. 关闭正在运行的开发服务器
3. 以管理员身份运行 PowerShell

### 解压后无法运行

1. 检查是否运行了 `pnpm install`
2. 检查 `.env.local` 是否配置正确
3. 检查数据库连接是否正常

### 压缩包过大

1. 确认是否使用了 7-Zip
2. 检查 `compress-project.ps1` 中的排除规则
3. 手动删除不需要的文件后重新压缩
