下面是按你「HK80 + CSDI/LandsD Map API basemap」方案，**重写并补充**后的 Demo PRD（偏“可落地开发”的版本）。我把原来“OSM/Google 模拟 CSDI”的部分统一改成 **直接使用 CSDI Portal 的 Topographic Map API（HK80）+ 可选 Label 叠加**，并补齐了坐标系、署名合规、缓存/限流、验收标准等关键点。

---

# Demo PRD — Land Lot Management System（ND Project / High-Fidelity Prototype）

## 0. 背景与目标

### 背景

后端/数据库尚未就绪，需要用纯前端（Vue 3 + Pinia）实现一个可演示的系统原型，包含：

* GIS 地图展示与绘图交互（Polygon Draw/Modify/Delete）
* 分层管理（Land Lot / Work Lot）
* 权限控管（角色切换）
* 任务管理（Task CRUD）
* 管理台表格视图（导出 CSV）

### 目标（Demo 必须传达的 4 个核心价值）

1. 画图（创建地块 / 运营范围）
2. 改图（编辑边界）
3. 分层管理（法律地界 vs 营运范围）
4. 任务指派（Work Lot 关联任务）

### 非目标（本期明确不做）

* 真正的后端接口、真实权限鉴权（只做前端模拟）
* 真实空间叠加计算（可做“伪计算/规则模拟”）
* 多人协作、审计日志（可做“字段预留/展示位”）

---

## 1. 核心技术栈（确认）

### 前端与工程

* 前端框架：Vue 3（Composition API / `<script setup>`）
* 构建工具：Vite
* 路由：Vue Router 4（Web/Admin/Mobile 模式切换）
* 状态管理：Pinia + `pinia-plugin-persistedstate`（localStorage 持久化，模拟数据库）

### UI 框架（推荐）

* Element Plus（中后台组件丰富：Table / Form / Dialog / Drawer 适配本项目）

### 地图引擎

* 原生 OpenLayers OL （底层能力强，便于处理 HK80 / 多边形编辑 / snapping）

---

## 2. 地图底图方案（HK80 + CSDI/LandsD Map API）

### 2.1 Basemap（必须）

使用 LandsD 的 **Topographic Map API（XYZ PNG）**，并设置为 HK80：
URL 格式：`https://mapapi.geodata.gov.hk/gs/api/[version]/xyz/basemap/[sr]/[z]/[x]/[y].png` ([CSDI Portal][1])

* `[version]` 当前为 `v1.0.0`（未来可能变更，旧版本可能随时移除；实现时需集中配置）([CSDI Portal][1])
* `[sr]`：使用 `HK80` ([CSDI Portal][1])
* zoom：10–20 ([CSDI Portal][1])
* 可能返回 `204 No Content`（视瓦片覆盖而定）([CSDI Portal][1])

> Demo 中默认 basemap 开启；若 tile 空白需在 UI 提示“该缩放级别/区域无瓦片（204）”。

### 2.2 地名标注（可选加分）

叠加 LandsD 的 **Map Label API（XYZ PNG）**：
URL 格式：`https://mapapi.geodata.gov.hk/gs/api/[version]/xyz/label/hk/[lang]/[sr]/[z]/[x]/[y].png` ([CSDI Portal][2])

* `[lang]`：`tc/en/sc` ([CSDI Portal][2])
* HK80 的 zoom：8–20 ([CSDI Portal][2])

### 2.3 合规要求（必须）

* 应用需在地图界面显示 **Lands Department logo** 与 **Copyright Notice** 以署名数据来源 ([CSDI Portal][1])
* 不得短时间大量请求（需要做缓存/节流策略，避免疯狂刷新 tile）([CSDI Portal][1])
* TLS 1.2 要求（系统/客户端需符合）([CSDI Portal][1])

---

## 3. 坐标系与数据规范（HK80：EPSG:2326）

### 3.1 统一坐标系原则

* Map View / 绘图交互 / 存储 GeoJSON **统一使用 HK80（EPSG:2326）**
* 所有 LandLot / WorkLot 的 geometry 存入 Pinia 前必须为 EPSG:2326（避免刷新后投影错乱）

### 3.2 为什么必须强调这一点

OpenLayers 默认常用 EPSG:3857（OSM），但现在底图是 HK80；如果不统一投影，会出现：

* 图形与底图不对齐
* snapping 无法正常工作
* 导出/回放数据无法复用

---

## 4. Mock 数据结构（Pinia Store）

> 与你原设计保持一致，补充字段建议与枚举约束。

### 4.1 LandLot（法律地界层 / 参考层）

```ts
interface LandLot {
  id: string;            // "LL-001"
  lotNumber: string;     // "D.D. 99 Lot 123 RP"
  geometry: any;         // GeoJSON Polygon (EPSG:2326)
  status: "Active" | "Inactive";
  updatedBy: string;     // "Admin"
  updatedAt: string;     // ISO time (新增：展示“最近更新”)
}
```

### 4.2 WorkLot（营运操作层）

```ts
type WorkLotStatus = "Pending" | "In-Progress" | "Handover" | "Difficult";

interface WorkLot {
  id: string;                // "WL-2025-005"
  operatorName: string;      // "順意廠房"
  type: "Business" | "Household";
  status: WorkLotStatus;
  geometry: any;             // GeoJSON Polygon (EPSG:2326)
  updatedBy: string;
  updatedAt: string;
}
```

### 4.3 Task（任务）

```ts
interface Task {
  id: string;
  workLotId: string;
  title: string;
  assignee: string;
  description: string;
  dueDate: string;           // YYYY-MM-DD
  status: "Open" | "Done";
  createdAt: string;
}
```

### 4.4 前端“模拟数据库”规则

* Pinia store 启用 persistedstate：刷新页面数据不丢
* 所有写操作（新增/编辑/删除）都走 store action，并自动触发持久化

---

## 5. 角色与权限（前端模拟）

页面右上角：**Switch Role** 下拉菜单（即时切换视角/能力）

| 角色                | 关注点         | 可操作图层       | 权限规则（验收关键）                                              |
| ----------------- | ----------- | ----------- | ------------------------------------------------------- |
| Site Admin（测量/IT） | 维护 Land Lot | LandLot 可编辑 | 可 Draw/Modify/Delete LandLot；WorkLot 只读灰化               |
| Site Officer（前线）  | 维护 Work Lot | WorkLot 可编辑 | 可 Draw/Modify/Delete WorkLot；LandLot 锁定但启用 Snapping（吸附） |
| Field Staff（移动端）  | 执行任务        | 只读          | 不可画/改/删；仅可点选 WorkLot 查看详情 + 模拟 GPS check-in             |

---

## 6. GIS 分层与交互（Map Requirements）

### 6.1 图层（Z-index）

* Layer 1：Basemap（Topographic Map API / HK80）([CSDI Portal][1])
* Layer 2：LandLot（蓝色边线、透明填充、显示 lotNumber label）
* Layer 3：WorkLot（按状态填色、黑色虚线边框、可点选）

### 6.2 绘图工具箱（左上角悬浮）

按钮：

* 🖐 Pan（默认）
* ⬠ Draw Polygon（根据角色决定画 LandLot 或 WorkLot）
* ✏️ Edit Boundary（Modify）
* 🗑 Delete

行为规则：

* 切换工具时互斥（同一时间只允许一个 interaction 生效）
* Draw 完成：弹出快速表单（如 WorkLot 需填 operatorName/type/status；LandLot 需填 lotNumber/status）

### 6.3 Snapping（亮点功能）

* 仅 Site Officer 在画 WorkLot 时启用 snapping
* snapping target：LandLot layer 的边界

### 6.4 点选逻辑与详情 Drawer

* 点选 WorkLot polygon → 读取 feature.id → store 查询详情 → 右侧 Drawer 打开
* Drawer 内容：

  * Header：Operator Name + Status Tag
* Tab1 Info：基础信息（不显示 LandLot 关联）
  * Tab2 Tasks：任务列表 + 新增输入框（Enter 添加）+ 勾选 Done

---

## 7. 搜索与过滤（Map Search）

顶部搜索框：

* 输入关键词（operatorName / id）实时过滤 workLotList
* 选中结果后：地图 Zoom To Extent（飞到该 polygon）

---

## 8. Mobile 模拟（Field Staff 场景）

按钮：📱 Simulate Mobile View

* 页面强制窄屏样式（CSS class）
* 侧边栏隐藏 → 底部 Tab（地图 / 任务）
* 显示 📍 GPS Locate

  * 点击后飞到预设坐标（落在某个 WorkLot 内）
  * 弹出提示：You have entered Work Lot: XXX（模拟地理围栏）

---

## 9. 管理台（Admin Panel）

路由：

* `/admin/land-lots`
* `/admin/work-lots`
* `/admin/users`（概念展示）

功能：

* 列表（el-table）：ID / Name / Status / UpdatedAt / UpdatedBy
* 导出：生成 CSV 下载（满足“Soft copy / Export”需求）
* User Management：展示用户与角色映射（仅前端 mock）

---

## 10. 非功能需求（Demo 也要做到）

### 10.1 性能与稳定性

* Tile 请求节流：避免“短时间大量请求”([CSDI Portal][1])
* localStorage 数据校验：加载时做 schema 兼容（防止版本升级导致崩溃）
* Map 请求异常处理：204/500 有 UI 友好提示 ([CSDI Portal][1])

### 10.2 合规与署名

* 地图角落固定显示 LandsD logo + Copyright Notice ([CSDI Portal][1])

---

## 11. 验收标准（Acceptance Criteria）

1. **切换角色**后，工具栏可用按钮与可编辑图层立即变化
2. Admin 能画/改/删 LandLot；Officer 能画/改/删 WorkLot；Field Staff 全只读
3. Officer 画 WorkLot 时对 LandLot 边界有明显吸附效果（snapping 生效）
4. 点选 WorkLot 能打开 Drawer，能新增/完成 Task，刷新页面数据不丢
5. 搜索 WorkLot 能定位并 zoom
6. Basemap 使用 CSDI/LandsD Topographic Map API（HK80），并显示署名信息 ([CSDI Portal][1])

---

## 12. 开发 Runbook（10 天节奏）

**Day 1–2：工程与框架**

* Vue3 + Vite + Pinia + persistedstate + Element Plus + vue3-openlayers
* Layout（Header/Sidebar/Main）

**Day 3–5：地图核心（重点变更：接 HK80 Basemap）**

* 接入 Topographic Map API（HK80）([CSDI Portal][1])
* 建 EPSG:2326 的 View 与绘图存储规范
* LandLot/WorkLot layer 渲染与交互（Draw/Modify/Delete + snapping）

**Day 6–8：业务 UI**

* Drawer（Info/Tasks）+ 状态变色
* 搜索/过滤/ZoomTo
* Mobile View & GPS 模拟

**Day 9–10：数据与演练**

* 预置 demo polygons（开场数据）
* CSV 导出
* 演示脚本彩排 + 异常兜底（204/500/空数据）

---

如果你希望我把这份 PRD 再“工程化一点”（例如：**路由结构、Pinia store 切分、组件目录、地图 interaction 状态机、HK80 投影注册/TileGrid 参数建议**），我也可以继续在这份 PRD 后追加一个《Technical Spec / Implementation Notes》章节，直接给到开发照着搭就行。

[1]: https://portal.csdi.gov.hk/csdi-webpage/apidoc/TopographicMapAPI "Topographic Map API"
[2]: https://portal.csdi.gov.hk/csdi-webpage/apidoc/MapLabelAPI "Map Label API"

下面给你一份更“工程化 / 可直接开工”的《Demo PRD + Technical Spec》，重点把 **HK80 + CSDI/LandsD Basemap**、目录结构、路由、Store 切分、地图交互状态机、投影/TileGrid、权限守卫都补齐。

---

# A. 项目结构（建议落地到代码仓库）

## A1. 目录结构（Vue3 + Vite）

```
src/
  app/                 # 应用层（路由、全局布局、权限）
    router/
      index.ts
      routes.ts
      guards.ts
    layouts/
      AppLayout.vue
      MobileLayout.vue
      AdminLayout.vue
  modules/             # 业务模块（按域拆）
    map/
      MapPage.vue
      components/
        OlMapCanvas.vue
        MapToolbar.vue
        MapSearchBar.vue
        WorkLotDrawer.vue
        RoleSwitcher.vue
        AttributionBadge.vue
      ol/
        projection.ts       # EPSG:2326 注册、transform helper
        tilegridHK80.ts     # HK80 tilegrid（origin/resolutions）
        styles.ts           # layer style functions
        interactions.ts     # draw/modify/select/snap 工厂方法
    admin/
      landLots/AdminLandLots.vue
      workLots/AdminWorkLots.vue
      users/AdminUsers.vue
    mobile/
      MobilePage.vue
      components/
        GpsLocateButton.vue
        BottomTabs.vue
  stores/
    useAuthStore.ts
    useLandLotStore.ts
    useWorkLotStore.ts
    useTaskStore.ts
    useUiStore.ts
  shared/
    types/
      landlot.ts
      worklot.ts
      task.ts
      role.ts
    utils/
      id.ts
      time.ts
      csv.ts
      geojson.ts
      persistVersion.ts
  main.ts
  style.scss
```

---

# B. 路由与布局（Web / Admin / Mobile）

## B1. 路由规划

* `/map`：主地图（默认）
* `/admin/land-lots`：LandLot 表格
* `/admin/work-lots`：WorkLot 表格
* `/admin/users`：用户/角色展示（mock）
* `/m`：移动端模式（Field Staff 视角或强制窄屏 UI）

> 角色切换是“演示用”，但仍建议做 route guard：Admin Panel 只有 Site Admin 进得去（更像真系统）。

---

# C. 配置常量（集中管理，避免散落）

`src/shared/config/mapApi.ts`

* Map API base：

  * Topographic Map API：zoom 10–20 ([CSDI Portal][1])
  * Label Map API：HK80 zoom 8–20 ([CSDI Portal][2])
* 版本号 `v1.0.0` 放常量，未来变更只改一处 ([CSDI Portal][1])
* 合规提示：要求展示 LandsD logo 与版权声明，且避免短时间大量请求 ([CSDI Portal][1])

---

# D. Store 切分与持久化（Pinia = “前端数据库”）

## D1. Store 设计

* `useAuthStore`

  * `role: 'SITE_ADMIN' | 'SITE_OFFICER' | 'FIELD_STAFF'`
  * `switchRole(role)`
* `useLandLotStore`

  * `landLots: LandLot[]`
  * actions：`add/update/remove/upsertFromFeature`
* `useWorkLotStore`

  * `workLots: WorkLot[]`
  * actions：同上 + `setStatus(id, status)`
* `useTaskStore`

  * `tasks: Task[]`
  * actions：`addTask(workLotId, title...)`, `toggleDone(taskId)`
* `useUiStore`

  * 地图工具状态：`tool: 'PAN'|'DRAW'|'MODIFY'|'DELETE'`
  * `selectedWorkLotId`
  * `isMobileSimulated`

## D2. persistedstate 策略（强烈建议做版本号）

`localStorage` key 加版本前缀，避免 PRD 演进导致旧数据把页面“加载崩”：

* `ND_LLM_V1_landlots`
* `ND_LLM_V1_worklots`
* `ND_LLM_V1_tasks`
* `ND_LLM_V1_auth`

首次进入做 seed（预置 demo 多边形），后续不覆盖。

---

# E. HK80（EPSG:2326）工程落地（重点）

## E1. 注册 EPSG:2326（HK80）

EPSG:2326 的参数（Transverse Mercator）可以直接来自 EPSG 定义：纬度原点、中央经线、假东/北等参数 ([EPSG.io][3])

`src/modules/map/ol/projection.ts`（示意）

```ts
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { get as getProj } from "ol/proj";

export const EPSG_2326 = "EPSG:2326";

export function registerHK80() {
  proj4.defs(EPSG_2326,
    "+proj=tmerc +lat_0=22.3121333333333 +lon_0=114.178555555556 " +
    "+k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +units=m +no_defs"
  );
  register(proj4);
  return getProj(EPSG_2326)!;
}
```

## E2. HK80 TileGrid（让 XYZ 在 2326 下“对齐”）

LandsD 的 HK80 向量底图服务描述里给了 tileInfo：`origin: (-4786700, 8353100)`、`rows/cols: 512`、以及 LOD resolutions 列表 ([GeoData.hk][4])
（实践上通常与 HK80 XYZ scheme 一致，可直接用于 OpenLayers TileGrid。）

`tilegridHK80.ts`（示意）

* `tileSize: 512`
* `origin: [-4786700, 8353100]`
* `resolutions: [78271.516964, 39135.758482, ...]` ([GeoData.hk][4])

> Topographic Map API 本身说明 zoom 10–20 ([CSDI Portal][1])，你可以在 UI 上限制 zoom 范围，避免用户缩到没瓦片。

---

# F. 地图模块组件化（vue3-openlayers + OL）

## F1. OlMapCanvas.vue（地图容器职责）

* 初始化 View（projection=EPSG:2326、zoom/center、minZoom=10、maxZoom=20）
* 加载底图（Topographic Map API HK80）([CSDI Portal][1])
* （可选）叠加 Label Map API HK80/tc ([CSDI Portal][2])
* 加载 LandLot/WorkLot 两个 VectorLayer
* 监听交互事件（drawend/modifyend/select）并写回 Pinia

## F2. Interaction 状态机（工程要点：互斥 + 可控）

用 `uiStore.tool` 做唯一真源，然后在地图层：

* `PAN`：关闭 draw/modify/select
* `DRAW`：开启 draw（按角色决定画 Land 或 Work）
* `MODIFY`：开启 modify（按角色限制目标 layer）
* `DELETE`：开启 select + 删除

### Snap 的“顺序”必须注意

OpenLayers 官方示例强调：**Snap interaction 要最后 add**，确保 pointermove 事件处理顺序正确 ([OpenLayers][5])
vue3-openlayers 社区也提到 interaction 顺序会影响 snap ([GitHub][6])

> 规则：先 add Modify/Draw，再 add Snap（最后）。

---

# G. 图层与样式（可读性 + 演示效果）

## G1. Layer Style（函数化）

* LandLot：深蓝实线边框 + 透明填充 + label(lotNumber)
* WorkLot：按 status 填色（Pending 灰、In-Progress 黄、Handover 绿、Difficult 红），边框黑色虚线
* 角色影响：

  * Site Admin：WorkLot 灰化（opacity 降低、不可选）
  * Field Staff：全部只读（但 WorkLot 可点）

---

# H. 权限工程化（不要只写在文档里）

## H1. UI 级权限（按钮可见/可用）

`canDrawLandLot / canDrawWorkLot / canModify / canDelete / canAccessAdmin`

* 用 computed 根据 role 输出
* MapToolbar 只渲染允许的按钮

## H2. 行为级权限（双保险）

即使按钮隐藏，也要在 action 执行前再检查一次（防止绕 UI）：

* `if (!permission.canModifyWorkLot) return;`

---

# I. 导出 CSV（Admin Panel 必须可演示）

`shared/utils/csv.ts`

* `exportWorkLots(workLots)`：输出 `id,operatorName,type,status,updatedAt,updatedBy`
* `exportLandLots(landLots)`：输出 `id,lotNumber,status,updatedAt,updatedBy`
* 下载方式：`URL.createObjectURL(new Blob([...]))`

---

# J. Mobile 模拟（Field Staff）

两种实现任选其一：

1. **路由分离**：`/m` 直接使用 MobileLayout（推荐：更像真 App）
2. **CSS 模拟**：在 Web 端加 `isMobileSimulated` class

GPS Locate：

* 使用预设 HK80 坐标点（落在某个 WorkLot 内）
* “点在多边形内”判定：用 OL geometry `intersectsCoordinate` / `containsCoordinate`

---

# K. 最小可用开发顺序（更像 Sprint）

1. 投影 + HK80 basemap 对齐（最先打通）
2. LandLot/WorkLot 渲染（从 store 读）
3. Draw/Modify + store 持久化
4. Select + Drawer + Tasks
5. Role 权限开关（按钮 + 行为双层）
6. Admin 表格 + CSV
7. Mobile / GPS

---

如果你把你们现在的 **vue3-openlayers 版本**、以及你们想用 **Topographic Map（PNG）还是 Vector Map（PBF）** 定下来，我可以再补一页《Implementation Notes》：

* 直接给出 `OlMapCanvas.vue` 的完整骨架（含 EPSG:2326、TileGrid、两层 VectorLayer、interaction 状态机、snap 顺序），你们照抄就能跑。

[1]: https://portal.csdi.gov.hk/csdi-webpage/apidoc/TopographicMapAPI?utm_source=chatgpt.com "Topographic Map API"
[2]: https://portal.csdi.gov.hk/csdi-webpage/apidoc/MapLabelAPI?utm_source=chatgpt.com "Map Label API"
[3]: https://epsg.io/2326?utm_source=chatgpt.com "Hong Kong 1980 Grid System - EPSG:2326"
[4]: https://mapapi.geodata.gov.hk/gs/api/v1.0.0/vt/basemap/HK80?utm_source=chatgpt.com "mapapi.geodata.gov.hk"
[5]: https://openlayers.org/en/latest/examples/snap.html?utm_source=chatgpt.com "Snap Interaction - OpenLayers"
[6]: https://github.com/MelihAltintas/vue3-openlayers/issues/230?utm_source=chatgpt.com "Need help with custom draw/modify/select/snap interactions"
两个 API 本质上就是公开的 XYZ 瓦片服务（Topographic Map = 底图瓦片、Map Label = 标注瓦片）。所以“纯前端获取”的方式很简单：

浏览器在地图移动/缩放时，会按 {z}/{x}/{y} 自动发起 HTTP GET 去拿 .png 瓦片

不需要后端、不需要签名 key（至少在 CSDI Portal 公共 Map API 的用法里就是这样描述的）

1) 你要“获取”的其实是：拼 URL 模板
Topographic Map API（HK80）

服务是 XYZ tile，zoom 10–20

https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/HK80/{z}/{x}/{y}.png

Map Label API（HK80，叠加在底图上）

也是 XYZ tile，HK80 zoom 8–20

https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/tc/HK80/{z}/{x}/{y}.png


纯前端就是把这两个 URL 交给 OpenLayers 的 XYZ source；OpenLayers 会自动请求瓦片。

2) OpenLayers 纯前端接入示例（推荐写法）

关键：跨域加载 tile 时加 crossOrigin: 'anonymous'（避免 canvas 污染、截图/导出等功能被限制）。

import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";

const basemap = new TileLayer({
  source: new XYZ({
    url: "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/HK80/{z}/{x}/{y}.png",
    crossOrigin: "anonymous",
  }),
});

const labels = new TileLayer({
  source: new XYZ({
    url: "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/tc/HK80/{z}/{x}/{y}.png",
    crossOrigin: "anonymous",
  }),
});

3) 你用 HK80 还必须处理的一件事：投影 + TileGrid 对齐

Topographic/Label API 只是“给你瓦片”，但你用 HK80（EPSG:2326）时，OpenLayers 的 View 与 tile grid 要对齐，否则会出现“底图与矢量不贴合”。

你之前问 HK80，我建议你把 tilegrid 参数集中配置：

origin: (-4786700, 8353100)

tileSize: 512

resolutions: [...]（LOD 列表）

这些参数来自 LandsD HK80 basemap（vector tile）服务描述的 tileInfo，对齐 HK80 瓦片格网非常有用。
（即使你用的是 PNG XYZ，也通常沿用同一套格网方案来避免偏移。）

4) 纯前端会遇到的“现实问题”与应对
(A) 204 No Content = 不是报错

Topographic Map API 文档明确说了可能返回 204 No Content
这表示该级别/范围没有瓦片（或覆盖不足），UI 上做个提示即可。

(B) 不要短时间大量请求

官方要求不要在短时间大量调用
纯前端也能做到：限制 zoom 范围（Topographic 10–20）、避免程序性疯狂 view.setCenter() 循环、搜索定位时做 debounce。

(C) 一定要做署名（Attribution）

Topographic Map API 的 Important Notice 要求在应用中显示 Lands Department logo / copyright notice
前端做一个 AttributionBadge 固定角落即可。

5) 如果你用 vue3-openlayers：你只需要把 URL 塞进 <ol-source-xyz>

你现在 PRD 里用 vue3-openlayers，那就是把上面的 URL 放进 ol-source-xyz（再配合你 HK80 的 view/tilegrid）。
