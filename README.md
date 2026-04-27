# 地图组件库

## 目录结构

```
gud-integration-map
│
├── apps                            # 文档、示例、本地调试项目文件夹
│   │
│   └── docs                        # 文档库
│       ├── .storybook              # 文档库配置文件夹
│       ├── stories                 # 文档存放目录
│       ├── public                  # 静态资源
│       ├── src                     # 代码文件夹
│       │   └── main.ts             # 入口
│       ├── index.html              # html模板
│       └── package.json            # 项目配置
│
├── build                           # 打包库
│   ├── src                         # 代码文件夹
│   │   ├── generateConfig          # 打包packages库vite配置
│   │   ├── utils                   # 打包工具
│   │   └── index.ts                # 打包方法导出入口
│   ├── build.config.ts             # vite通用打包方法
│   └── package.json                # 项目配置
│
├── packages                        # 存放npm包文件夹
│   │
│   ├── cesium                      # 定制cesium源码库
│   │   ├── src                     # 存放代码文件夹
│   │   │   └── index.ts            # 入口
│   │   ├── vite.config.ts          # 打包配置
│   │   └── package.json            # 项目配置
│   │
│   ├── core                        # 地图sdk库
│   │   ├── src                     # 存放代码文件夹
│   │   │   └── index.ts            # 入口
│   │   ├── vite.config.ts          # 打包配置
│   │   └── package.json            # 项目配置
│   │
│   └── map                         # 地图vue组件库
│       ├── src                     # 存放代码文件夹
│       │   ├── Assets              # 资源文件夹
│       │   ├── Components          # 组件文件夹
│       │   ├── Constants           # 常量文件夹
│       │   ├── Hooks               # hooks文件夹
│       │   ├── Types               # 公用类型文件夹
│       │   ├── Utils               # 工具方法文件夹
│       │   └── index.ts            # 入口
│       ├── vite.config.ts          # 打包配置
│       └── package.json            # 项目配置
│
├── pnpm-workspace.yaml             # 工作空间配置目录
├── CHANGELOG.md                    # 更新日志
├── package.json                    # 项目配置文件
├── README.md                       # 项目说明文件
└── turbo.json                      # turborepo脚本配置文件
```

## 基本使用方法

### 1.下载源码

```bash
git clone git@gitlab.xxx.git
```

或

```bash
git clone xxx
```

### 2.切换分支

```bash
git checkout develop
```

### 3.安装

使用`pnpm`安装地图组件库,`node`版本使用`v18.16.1`版本：

```bash
pnpm install
```

### 4.运行

- 运行示例程序
  ```bash
  pnpm run start:docs
  ```
- 运行storybooks项目
  ```bash
  pnpm run start:storybook
  ```

### 5.代码提交

该项目集成级自动生成版本日志，所以对提交代码的`commit`信息有所要求，为了防止自动生成版本信息失败，这里务必采用以下方式提交代码

1. 将需要提交的文件添加到`git`版本中,这里以添加所有文件为例
   ```bash
   git add .
   ```
2. 运行脚本，按照提示信息填写此次提交说明
   ```bash
   pnpm run commit
   ```
3. 提交代码（这一步可以借助工具提交，也可以运行`git`命令）
   ```bash
   git push origin develop
   ```

## 详细文档

有关更多详细信息，请查阅 [文档](./CHANGELOG.md) 。

## 更新日志

请查看 [CHANGELOG.md](./CHANGELOG.md) 以获取更新记录和版本变更信息。
