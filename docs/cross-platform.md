# 跨平台说明（0.2.2）

> **仅 macOS（Apple Silicon）经过实际使用测试。Windows x64 / ARM64 与 Linux 均未正式测试，构建成功不等于实机可用。**

## 结构

- `desktop/main.cjs`：Electron 窗口、托盘、受限 IPC、后台服务生命周期。
- `desktop/preload.cjs`：仅暴露状态订阅和固定的管理操作；渲染进程不接触本地 API Key。
- `desktop/renderer.js`、`index.html`、`style.css`：Mac 和 Windows 共用的控制面板。
- `src/`：保留模型目录、能力声明、工具兼容性检测、图片转发、推理档位及 WorkBuddy 导入逻辑。
- `src/platform.js`：数据目录和 OpenCode 包名选择。
- `src/system-proxy.js`：macOS scutil 和 Windows 当前用户 Internet Settings 的手动 HTTP/HTTPS 代理。

后台使用 Electron 内置 Node 启动，不要求最终用户另装 Node。窗口启用 sandbox 和 contextIsolation、关闭 nodeIntegration，禁止导航和打开新窗口；管理请求仅在主进程发送。后台服务仍只监听本机，并要求随机 Key。

## 数据目录

| 系统 | 应用数据 | 国内版 WorkBuddy | 海外版 WorkBuddy AI |
|---|---|---|---|
| macOS | `~/Library/Application Support/Buddy Bridge` | `~/.workbuddy/models.json` | `~/.workbuddy-ai/models.json` |
| Windows | `%APPDATA%\Buddy Bridge` | `%USERPROFILE%\.workbuddy\models.json` | `%USERPROFILE%\.workbuddy-ai\models.json` |
| Linux（实验性） | `$XDG_CONFIG_HOME/Buddy Bridge` 或 `~/.config/Buddy Bridge` | `~/.workbuddy/models.json` | `~/.workbuddy-ai/models.json` |

两个版本共用同一个 `models.json` 格式（数组或 `{ models, availableModels }`），差别只在目录：海外版在自己的 `cli/product.json` 里声明了 `config.customUserDataDir = .workbuddy-ai`，客户端据此拼出路径。两者的 `CustomModelsJSON`、`CustomModelIdPrefix` 均为 `true`，所以本应用写入的条目在两边都可直接使用。`buddyBridgeOwner` 是本应用自己的标记，两个客户端读取和回写时都会原样保留整个模型对象。

每个导入按钮只写自己那一份文件，互不影响。启动自动导入只写国内版，因此未配置过的海外版不会被自动创建 `models.json`，点它自己的按钮时才创建。`src/targets.js` 是唯一记录「按钮 → 版本 → 目录」关系的地方，界面、托盘和服务都从它取。

OW Bridge 沿用旧版数据目录和内部应用标识，因此代理开关、运行时和本地 Key 可继续使用。自定义路径仍可通过 `BUDDY_DATA_DIR`、`BUDDY_MODELS_FILE` 指定。`BUDDY_MODELS_FILE` 仍会把所有版本指向同一个文件（测试与容器依赖这一点）；只覆盖海外版可用 `BUDDY_AI_MODELS_FILE`。设置里记住的位置按版本分开存放。Windows 两条路径与真实客户端读取行为仍需 Windows 实机确认。

## 运行时安装与退出

OpenCode 优先复用应用目录内已有的可用版本，或复制发现的本机版本；需要下载时从 npm 官方对应平台包的 `latest` 获取，不固定版本，也不在每次启动时强制升级。下载后校验 SHA-512，只提取指定二进制文件；Windows 使用 opencode.exe。解压采用 Node tar，不依赖系统 curl/tar。

正常退出通过 IPC 请求后台清理**所有版本**中本应用导入的 WorkBuddy 模型，再结束 OpenCode。只清理最后导入的那一个会让另一版本残留指向已停止代理的死模型。启动时同样先清理所有版本，用于兜底强杀或断电。测试锁定这一行为。

Windows 支持手动系统代理，包括统一端口和按协议指定端口；不支持仅 PAC/SOCKS。Linux 构建脚本预留，但系统代理读取和 WorkBuddy 实机集成尚未支持/验证。

## 构建

```sh
npm ci
npm test
npm run desktop
npm run build:mac
npm run build:win
```

额外目标：`npm run build:win:arm64`；Linux 实验目标：`npm run build:linux`。产物输出到 `release/`。GitHub Actions 工作流提供 macOS 和 Windows 原生 runner 构建及测试，需在仓库实际运行后才能证明通过。

`macos/App.swift` 与 `scripts/build-mac.sh` 是迁移前的原生界面参考，不再作为 0.2.0 发布入口。

## 验证边界

- 本机核心与平台单元/生命周期测试通过。
- 本机完成 OpenCode 自动下载、校验、解压和版本验证。
- macOS 应用及 Windows x64 NSIS 安装包已在当前 Mac 构建成功。
- Mac 已实际验证自动扫描/检测/导入、手动导入反馈、模型详情及点击外部收起、正常退出后受管理模型为 0 且后台/OpenCode 子进程消失。
- 已核对 npm Windows x64 包含 bin/opencode.exe，与安装器路径一致。
- Windows 安装包构建成功不等于 Windows 上已安装或已验证 WorkBuddy 联调。本机无 Windows 实机/虚拟机，仍需完成下列实机验收。
- macOS 未做 Apple 公证；Windows 未配置发布者签名。

Windows 验收：安装并双击启动 → 自动准备 OpenCode → 扫描和检测 → 导入后在 WorkBuddy 检查名称/能力 → 启用系统代理 → 关闭窗口后托盘可操作 → 退出后受管理模型删除、后台进程退出 → 中文用户名路径下重试以上流程。

## v0.2.2 发布检查（2026-09-28）

macOS 本机 86 项自动化测试通过，Mac 发布包内代码与当前源码核对一致。README 展示本机实际运行截图。

Windows CI 首次运行曾遇到状态文件原子替换的 `EPERM` 文件占用错误，导致生命周期测试超时。该偶发问题尚未修复，实机验收需重点检查状态刷新、导入和退出清理；重跑成功也不等于问题已经消失。所有非 macOS 版本仍标为未正式测试。
