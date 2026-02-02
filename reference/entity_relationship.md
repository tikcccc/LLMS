1) LandLot 和 Operator 是什么关系？

不是 1:1，也不是严格的 1:N / N:1，而是“空间占用/经营关系”，通常是多对多（M:N）：

一个 LandLot（法律地界） 里面可能有多个经营单位（多个 Operator）。

一个 Operator 也可能跨多个 LandLot（例如不同位置的露天堆场、分散地块）。

在 Demo 里，这种关系不建议直接写成 landLot.operatorId，而是通过 **WorkLot（运营范围）**来表达：

LandLot：法律边界（LandsD/CSDI 的“地界”概念）

WorkLot：某个 Operator 实际占用/作业的范围（你们画出来的彩色面）

所以关系链是：

✅ 推荐的业务关系

Operator (1) → WorkLot (N)

WorkLot (M) ↔ LandLot (N)（通过 link 表或 relatedLandLots 来表达）

2) Operator 是不是和 LandLot 都提前管理员画好的？
LandLot：更像“提前画好的参考层”

在你们的 Demo 设定里，LandLot 是法律地界（蓝框），通常由 **Site Admin（测量/IT）**维护，演示时可以预置或由 Admin 画。
这也符合真实场景：地界通常来自测绘/地政数据源，不是现场运营人员随意改的。

Operator / WorkLot：通常不是“提前画好”

Operator（经营者/单位）是“人/公司/户”，通常来自清册、调查、登记，不是靠画图产生。

WorkLot（运营范围）更像现场/前线人员画出来或修订出来的“实际占用范围”，所以通常由 Site Officer 去画、去维护。

Demo 实现上最工程化的做法：

预置：LandLot（蓝框） + 少量 Operator + 1～2 个 WorkLot（方便开场）

演示：Site Officer 现场新增/修改 WorkLot，系统自动关联到 Operator，并显示关联 LandLots

3) Task 跟谁关联？

你们现有 schema 是 Task.workLotId，这非常合理：

WorkLot (1) → Task (N)
任务一般是“对某个运营范围做核对/交接/清场/测量”等工作，所以挂在 WorkLot 上最直观。

如果未来要扩展到“对某个 Operator（不限定范围）派任务”，再增加 targetType + targetId 即可，但 Demo 不必复杂化。

4) 所以有几个图层？

按你们 Demo（结合 CSDI/LandsD basemap）最清晰的图层是 3 层（+可选标注层）：

Basemap（底图）：Topographic Map（HK80）

LandLot Layer（蓝框）：法律地界参考层

WorkLot Layer（彩色面）：Operator 的运营范围（可点击/抽屉/任务）

可选加分：

Label Layer（标注）：Map Label API 作为叠加层（地名/标注）

5) 用一句话写进 PRD 的“关系定义”（建议直接复制）

LandLot：法律地界参考层（Admin 维护/预置）

Operator：受影响经营者主体（清册实体，可预置/可维护）

WorkLot：Operator 的实际占用/作业范围（Officer 绘制与维护）

Task：挂在 WorkLot 上的执行事项（Field Staff 只读/打卡）

并且：

Operator 1:N WorkLot

WorkLot M:N LandLot

WorkLot 1:N Task