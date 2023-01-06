# wxapkg-unpacker

## wxapkg-unpacker 是什么？
> 自动化反编译微信小程序/小游戏，小程序安全利器
> 基于 [wxappUnpacker](https://github.com/qwerty472123/wxappUnpacker) 二次开发
> 暂时不支持 wxappUnpacker的参数，（后面再整合）若要使用可直接运行 lib/wuWxapkg.js
## 特性
### 1. 针对微信小游戏的优化
- 微信小游戏一键解包整个项目
- 重新格式化代码，
- 将所有子包合并到一个目录中
- 删除多余的无效代码
- 直接生成配置文件
- 可直接导入微信开发工具运行
### 2. 针对微信小程序的优化
- 开发中...

## 安装和使用
```bash
npm i wxapkg-unpacker
# or
yarn add wxapkg-unpacker
# or
git clone https://github.com/r3x5ur/wxapkg-unpacker.git
cd wxapkg-unpacker
yarn
yarn unpack [单个wxapkg文件或者多个wxapkg文件的目录]
```
