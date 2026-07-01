# 筑梦决斗 / 3D 起床战争

这是一个基于 Three.js 的网页 3D 起床战争原型，支持本地试玩、易圈账号登录、Supabase 房间联机、房主接管、断线重连、背包、快捷栏、掉落物资源与动态地图机制。

## 在线部署

本项目适合使用 GitHub Pages 托管。仓库推送到 `main` 分支后，会通过 GitHub Actions 自动发布静态网页。

部署完成后的访问地址通常为：

```text
https://cxyme.github.io/zmjd/
```

## 本地运行

可以直接打开 `index.html`，也可以使用本地静态服务器：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080/
```

## 项目结构

```text
index.html
css/
  style.css
js/
  config.js
  engine.js
  game.js
  network.js
supabase-schema.sql
```

## 联机配置

`js/config.js` 中保存 Supabase 与易圈登录配置。正式公开仓库时，如果你不希望暴露 Supabase anon key，可以后续改成后端代理或环境变量注入方案。

## 操作说明

- `WASD`：移动
- 鼠标：视角
- 左键：攻击
- 右键：放置方块
- `1-8`：选择快捷栏
- 鼠标滚轮：切换快捷栏
- `G`：丢弃当前快捷栏物品
- `Tab`：打开背包
- `B`：打开商店
- `Q`：使用角色技能

## 自动更新

以后修改代码后执行：

```bash
git add .
git commit -m "更新游戏"
git push
```

GitHub Pages 会自动重新部署网页。
