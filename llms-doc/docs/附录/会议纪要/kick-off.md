# Kick-off 会议纪要（ND 项目 Land / Work Lot 管理平台）

## 会议基本信息
- 会议名称：ND 项目平台开发 Kick-off 会议
- 日期：2026-01-29（周四）
- 时间：11:00–12:00（HKT）
- 形式：Zoom 线上会议
- 项目：ND/2025/01 – San Tin Technopole Phase 1 Stage 1 (East) – Contract 2 (C2)

## 参会人员
**isBIM（开发团队）**：Eric Xiao、Khalil Chiu、Rex Lau

**CEDD（项目/客户方）**：Victor Suen、Cherry Suen

**LandsD（土地部门）**：Keith Pang、W.H. Leung

**ABJV（顾问/现场管理）**：Victor Go、Humphrey Wu、Hon

**Kuly（现场 IT 支持）**：Tony Lo

---

## 会议目的
- 对齐项目目标、范围与关键用例
- 明确交付节奏（6–8 周，规划 8 周）与 2 周内原型输出
- 明确土地/BU/住户数据需求与可用性、格式与精度限制
- 初步确认部署环境（C1 Site Server / Windows Server / VM）与访问、安全安排
- 确立每周例会与原型评审机制

---

## 关键讨论要点

### 1) 业务痛点与平台目标
- 现有收地与交地信息跨多方数据对照，易产生归属误判与状态不清。
- 目标：在地图上快速定位地块与 BU/住户关联状态，提供风险提示与进度可视化。

### 2) 平台范围（Web + Mobile + GIS）
- Web 端：地图、图层、Work Lot 绘制/编辑、任务、报表与查询。
- Mobile 端：任务列表、GPS 定位、现场查看地块信息。
- 底图基于香港 CSDI，叠加项目层，形成类“Google Maps”交互体验。

### 3) Land Lot 与 Work Lot 定位
- Land Lot（地政地籍）作为参考图层。
- Work Lot 为业务操作主体，支持多边形绘制与状态维护。
- 需要支持图层切换对比法律地界与运营地界。

### 4) 数据复杂性与模型方向
- 一个 Land Lot 可对应多个 Operator；一个 Operator 可能跨多个 Lot。
- 数据模型不能假设 1:1，应支持分组与多对多关系。

### 5) 数据可用性与一期输入策略
- 精准坐标未完全可得；一期采用 Soft Copy Plans（南北区示意图）。
- 数据精度需在系统中标明“示意/参考”。

### 6) GPS 使用限制
- 移动端 GPS 仅作参考，不作为测量级定位依据。

### 7) 服务器环境与访问
- 部署在 C1 Site Server（Windows Server / VM）。
- 需尽快协调远程访问、端口、账号权限与安全审批。

### 8) 交付节奏
- Week 1–2：环境搭建、CSDI 接入、地图与图层基础能力、原型 Demo。
- Week 3–5：Web 与 Mobile 并行开发。
- Week 6–7：安全、QA、文档、UAT。
- CEDD 要求 2 周内有可演示输出。

---

## 已达成决议（Decisions）
1. 6–8 周交付，计划 8 周；2 周内交付可视化原型。
2. 以 CSDI 底图 + 项目叠加图层为核心，Work Lot 为运营主体。
3. 数据模型支持多对多关系（Lot/Operator/BU/Household）。
4. 一期以 Soft Copy Plans 为主，后续逐步补齐精准坐标。
5. 加速服务器访问与安全准备，避免影响前两周基础搭建。

---

## 行动项（Action Items）
| 编号 | 行动项 | 负责人 | 目标时间 |
| --- | --- | --- | --- |
| A1 | 输出数据需求清单（图纸/属性字段/建议格式） | isBIM（Eric） | Week 1 |
| A2 | 提供样例地块用于 2 周内 Demo | CEDD（Victor/Cherry） | Weeks 1–2 |
| A3 | 提供 Soft Copy Plans（含 BU/住户标注） | CEDD / LandsD | ~1 周内 |
| A4 | 协调现场 IT 联系人、服务器访问、端口策略 | CEDD + Site IT | ~1 周内 |
| A5 | 确认部署与安全要求，完成基础环境搭建 | isBIM + Site | Weeks 1–2 |
| A6 | 输出初版数据模型关系草案 | isBIM（Eric）+ CEDD | Weeks 2–3 |
| A7 | 确认用户类型/角色与用户数量估算 | CEDD + isBIM | Week 3 |
| A8 | 确定每周例会与原型评审节奏 | isBIM + CEDD | 立即 |
| A9 | 发送会议纪要与联系人清单 | isBIM（Rex） | 立即 |
