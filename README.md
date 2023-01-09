# wxapkg-unpacker

[![https://img.shields.io/npm/v/wxapkg-unpacker.svg](https://img.shields.io/npm/v/wxapkg-unpacker.svg)](https://www.npmjs.com/package/wxapkg-unpacker)
[![wxapkg-unpacker](https://img.shields.io/npm/dt/wxapkg-unpacker.svg)](https://www.npmjs.com/package/wxapkg-unpacker)
[![languages](https://img.shields.io/github/languages/top/r3x5ur/wxapkg-unpacker)](https://github.com/r3x5ur/wxapkg-unpacker)
[![visitor badge](https://visitor-badge.glitch.me/badge?page_id=https://github.com/r3x5ur/wxapkg-unpacker)](https://github.com/r3x5ur/wxapkg-unpacker)
```
┬ ┬─┐ ┬┌─┐┌─┐┬┌─┌─┐   ┬ ┬┌┐┌┌─┐┌─┐┌─┐┬┌─┌─┐┬─┐
│││┌┴┬┘├─┤├─┘├┴┐│ ┬───│ ││││├─┘├─┤│  ├┴┐├┤ ├┬┘
└┴┘┴ └─┴ ┴┴  ┴ ┴└─┘   └─┘┘└┘┴  ┴ ┴└─┘┴ ┴└─┘┴└─
```
## wxapkg-unpacker 是什么？

> 自动化反编译微信小程序/小游戏，小程序安全利器
> 基于 [wxappUnpacker](https://github.com/qwerty472123/wxappUnpacker) 二次开发
## 特性
### 1. 针对微信小游戏的优化
- 微信小游戏一键解包整个项目
- 重新格式化代码
- 将所有子包合并到一个目录中
- 删除多余的无效代码
- 直接生成配置文件
- 可直接导入微信开发工具运行
### 2. 针对微信小程序的优化
- 重新格式化代码
- 删除多余的无效代码
### 3. 加入脚手架
- 支持单独使用所有子模块
### 4. 加入解密模块
- 可一键解密Window平台下的小程序包

## 安装和使用
### 1. 安装
```bash
# you can use npm install
npm i wxapkg-unpacker -g
# or yarn add
yarn global add wxapkg-unpacker # Recommend
# or clone this repository
git clone https://github.com/r3x5ur/wxapkg-unpacker.git
cd wxapkg-unpacker
yarn install
```
### 2. 使用
```bash
# you can use npx
npx wxunpacker -h
# or alias
npx wxupk  -h
# If you installed globally
wxunpacker -h
wxupk  -h
```
