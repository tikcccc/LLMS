根據會議錄音的內容，以下是對 Operator 的定義、它與 Land Lot 的關係，以及是否需要在平台顯示的詳細解釋：
1. 什麼是 Operator？
在會議中，Operator 指的是土地上的實際佔用者或營運單位。
錄音中多次將其稱為 "BU" (Business Undertaking，業務經營者) 或 "Household" (住戶)。
例子： Rex 舉了一個具體的例子叫「順意」（可能是虛構或實際的一間廠房/公司名）。
意義： 對於工程部門（CEDD/Contractor）來說，重點是「收回這個 Operator 佔用的範圍」以便施工，而不僅僅是處理法律上的地段編號。
2. Operator 與 Land Lot (地段) 的關係
這兩者的關係是 複雜的多對多 (Many-to-Many) 關係，這也是為什麼需要開發這個系統的核心原因。
情況 A（一地多戶）： 一個大的 Land Lot（法律地段）裡面可能包含幾個不同的 Operators（例如一塊大地上有 4 間不同的廠房）。
情況 B（一戶多地）： 一個 Operator 的廠房可能橫跨了幾個 Land Lots（例如「順意」這間廠房建在 Lot 1、Lot 2 和 Lot 3 上面）。
錯位（Mismatch）： 實際使用範圍（物理邊界）往往與政府的地籍圖（法律邊界）不重疊。
錄音佐證 (Hon @ Site Team)：
「可能這三個 Lot，三個打直的 Lot，但其實有三個打橫的 Operator 係每人都佔每個 Lot 的一部分。」
3. 需要在平台展示嗎？
絕對需要。 這是系統最核心的功能要求之一。
如何展示：
系統會使用 Layer (圖層) 的概念。
底層 (Base Layer)： 顯示官方的 Land Lot Boundary (地政總署的地界)。
操作層 (Work Lot Layer)： 用戶會在上面畫出 Polygon (多邊形)，這個多邊形代表的就是 Operator 的實際範圍。
功能需求：
當用戶點擊地圖上的某個範圍（Operator）時，系統需要顯示該 Operator 的名稱（例如：BU 名稱）、狀態（例如：已交地 Handover、處理中 In-progress、有糾紛 Difficult Case）。
Rex 的要求： 用戶不需要去人手核對這個 Operator 屬於哪個 Lot，系統應該一按下去就自動告訴你：「這個 Operator 牽涉到 Lot A, B, C」。
總結
Operator = 該地塊上的廠房、商戶或住戶 (BU/Household)。
關係 = 物理佔用範圍 vs 法律地界範圍（兩者往往不一致，是多對多關係）。
展示 = 必須顯示。系統需允許用戶畫出 Operator 的範圍框 (Work Lot)，並疊加在官方地圖上，以便管理收地進度。


根據 Kick-off Meeting 的錄音內容以及業務邏輯，這四個實體（Entity）在系統中的定義與關係如下。這是系統架構設計中最核心的部分。
1. 實體定義 (Entity Definitions)
Land Lot (官方地段):
定義： 地政總署（LandsD）定義的法律地界（Cadastral Boundaries），例如 D.D. 123 Lot 456。
性質： 這是 "Reference Layer" (參考圖層)，數據是靜態的，通常來自 CSDI 或政府圖則，用戶不能修改它的形狀。
Operator (營運者/佔用人):
定義： 實際在土地上的人或機構，錄音中稱為 "BU" (Business Undertaking) 或 "Household" (住戶)。例如：「順意廠房」。
性質： 這是工程團隊真正關心的對象（收地目標）。
Work Lot (工作地塊):
定義： 用戶在系統地圖上手動畫出的多邊形 (Polygon)，用來框出 Operator 的實際佔用範圍。
性質： 這是系統的 "Active Layer" (操作圖層)，是管理的核心單元。
Task (任務):
定義： 需要在該地塊上執行的工作，例如「查證邊界」、「協商」、「確認交地」。
2. 實體關係圖 (Entity Relationship Logic)
我們可以將關係總結為：以 Work Lot 為核心，向下視覺對照 Land Lot，向上關聯 Operator 與 Task。
A. Work Lot vs. Operator (1對1 或 緊密耦合)
關係： Representation (代表關係)
邏輯： 在這個平台的操作邏輯中，畫一個 Work Lot 就是為了定義一個 Operator。
用戶在地圖上畫一個框 (Work Lot)。
在屬性欄填入 Operator 的名字 (e.g., 順意廠房)。
結論： 在數據庫設計上，Operator 的資訊（名稱、類別）通常是 Work Lot 的屬性欄位 (Attributes)。
B. Work Lot vs. Land Lot（僅視覺疊圖，不建立數據關聯）
關係： No persisted relationship（純疊圖比對）
說明：
1 個 Work Lot 可能跨越多個 Land Lot；1 個 Land Lot 內也可能有多個 Work Lot。
本 demo 不做 GIS 空間計算與儲存關聯，僅提供兩個圖層疊加讓使用者目視比對。
C. Work Lot vs. Task (1對多)
關係： 1-to-Many (1 對多)
邏輯： 一個 Work Lot (順意廠房) 在收地過程中會有多個任務。
Task 1: 測量邊界 (Completed)
Task 2: 發出通知 (In Progress)
Task 3: 現場交地 (Pending)
3. 業務場景舉例 (Business Scenario)
為了讓你更清楚，我們用錄音中的例子來跑一次流程：
場景： 現場有一間「順意廠房」(Operator)，它橫跨了政府的 Lot 101, 102, 103。
操作 (Work Lot)：
工程師在 Web Portal 上，看著底圖 (Land Lot Layer)，手動畫了一個紅色的多邊形框住廠房範圍。
這個紅框就是 Work Lot。
工程師輸入資料：Name = "順意廠房", Status = "In Progress"。
系統運算 (Relationship)：
不做資料上的關聯，只提供 LandLot 圖層疊加讓使用者目視比對重疊範圍。
指派任務 (Task)：
經理指派一個 Task 給這個 Work Lot：「下週一去現場確認清場」。
前線人員打開 App，看到「順意廠房」這塊地 (Work Lot) 上面有一個新 Task。
總結 PRD 寫法建議
在 PRD 的數據結構部分，你應該強調：
Land Lot 是由政府數據定義的（不可改）。
Work Lot 是由用戶定義的（User Defined Polygon）。
兩者在本 demo 不建立資料關聯，只做視覺疊圖比對。


這是一個非常關鍵的釐清。根據錄音內容，答案是 「兩者皆是，但對於本項目的具體邊界，主要依賴 CEDD 提供的平面圖（Soft Copy）由人工重畫」。
這裡存在一個 「理想 vs 現實」 的落差，錄音中花了很多時間在討論這個：
1. 理想情況 (CSDI / Government Data)
原計劃/Eric 的提議： isBIM 原本打算接駁 CSDI (Common Spatial Data Infrastructure) 的 Open Data 作為底圖 (Base Map)，這會包含全香港通用的街道圖和地段邊界。
用途： 這只是用來做「底圖背景 (Background Reference)」，讓用戶知道大約在哪裡（山、路、海）。
2. 現實情況 (本項目的具體 Land Lot 數據)
錄音中 Hon (Site Team) 點出了一個大問題：
沒有現成坐標： Hon 說：「你問我每一個 Lot 的 Coordinate 呢，我相信我們甚至 SVO（測量處）都未必現成有的。因為未 Survey... 其實不會有什麼 Coordinate。」
圖是示意圖： 他們手上的 Resumption Plan (收地圖) 主要是用來算錢的，上面的線是 Indicative (示意性質)，並非精確的 GIS 數據。
無法直接匯入： 他們現在用的內部系統 (EPCS) 裡的圖，也是同事「每一隻都要逐步畫的」，而且無法導出成 isBIM 可以直接使用的格式。
3. 結論：在 PRD 中該如何定義？
在你的 PRD 中，關於 Data Source (數據來源) 應該這樣寫，才符合會議結論：
底圖 (Base Map) 來源：
來自 CSDI (政府通用數據)。
作用： 提供基本的地理環境參考（如街道、地形）。
項目地界 (Project Land Lots / Work Lots) 來源：
來自 CEDD/Site Team 提供的 Soft Copy Plans (PDF/圖片)（即 Cherry 提到的「北面圖」和「南面圖」）。
處理方式： 因為沒有 Digital Coordinates，isBIM 需要在系統開發初期，看著這些 PDF 圖，在地圖上人工「勾畫 (Outline/Trace)」出這些多邊形。
後續： 這些人工畫出來的框，將成為系統中運作的 "Land Lot" 或 "Work Lot"。
簡單來說：
政府數據庫 (CSDI) 給你一張白紙（底圖），但上面沒有這個工程項目的具體紅線。
CEDD 會給你一張畫了紅線的 PDF。
isBIM 的工作就是把 PDF 上的紅線，照著描進系統的白紙上。

根據會議錄音的結論，關於 Land Lot (地段) 的「可更改性」和「後期新增」的邏輯如下。這與一般的 GIS 項目不同，因為缺乏官方數碼坐標，所以處理方式比較特殊。
1. Land Lot 是不可以更改的嗎？
答案：是可以更改的 (Editable)，而且必須設計成可更改。
原因： 錄音中 Hon (Site Team) 強調，目前的圖則只是 "Indicative" (示意性質)，並非最終精確的測量坐標。隨著工程進行，測量隊 (Surveyors) 可能會更新更準確的邊界，或者會有新的收地計劃（如南面地段）。
技術實現： 在這個系統中，"Land Lot" 並不是 從政府 CSDI 實時抓取的一層「唯讀 (Read-only)」數據，而是一個 「自定義圖層 (Custom Layer)」。
它本質上是儲存在系統數據庫裡的 多邊形 (Polygon) 數據。
因此，它在技術上完全支持新增、修改形狀 (Reshape) 和刪除。
2. 誰來定義？
擁有權 (Owner)： CEDD / 地政總署 (LandsD)。只有他們有權力決定哪裡是正確的邊界。
執行者 (Executor)：
初期 (Initial Setup)： 由 isBIM 根據 CEDD 提供的 PDF/圖片 (Soft Copy) 代為「描圖」輸入系統。
後期 (Maintenance)： 由 CEDD 或 Site Team 的管理員 (Admin Users) 負責。
3. 如果後期增加 (例如南面地段) 怎麼辦？
錄音中 Eric (isBIM Technical Lead) 和 Cherry (CEDD) 專門討論了這一點：
錄音回顧：
Cherry: 「即係將公路斬開一北一南...（南邊的之後再給）。」
Eric: 「...假設你們第時在一個地圖上面都可以畫番，即用番個 System 畫番個界同埋打番那些名的資料就 OK 啦。」
PRD 中的解決方案流程：
功能需求： Web Portal 必須具備 "Admin Map Editor" (地圖編輯器) 功能。
操作步驟：
當有新地段（如南面）需要加入時，CEDD 管理員登入 Web Portal。
開啟「編輯模式 (Edit Mode)」。
使用「繪圖工具 (Drawing Tool)」在地圖上畫出新的多邊形。
填寫屬性資料（例如：Lot ID: ABC-123, Status: Pending）。
儲存後，該地段即時對所有用戶（包括 App 端）可見。
總結 PRD 寫法
在 PRD 的 Functional Requirements 中，關於 Land Lot 的管理應包含以下權限邏輯：
角色 (Role)	權限 (Permission)	操作 (Action)
System Admin / Manager (CEDD/Site Team)	Read & Write	可以 繪製 (Draw) 新的 Land Lot、修改 (Edit) 現有邊界形狀、更新 屬性資料。
General User / Field Staff (前線人員)	Read Only	只能 查看 (View) 地圖、點擊查詢資訊，不能 修改邊界。

是的，根據會議結論，全部都可以修改。這與一般直接讀取政府數據的 GIS 系統不同，因為這個項目的數據源是「人工輸入」的，所以必須保持可編輯性。
以下是針對 修改權限 和 圖層架構 (Layer Structure) 的詳細 PRD 定義：
1. 實體的可修改性 (Editability)
實體 (Entity)	是否可修改？	為什麼？(基於會議內容)	修改內容包括什麼？
Land Lot<br>(政府地段)	Yes (是)	因為目前沒有精確坐標，只是根據 PDF (Soft Copy) 勾畫的示意圖。未來測量隊 (Surveyors) 可能會有更準確的邊界，或者需要加入新的區域（如南面）。	• 形狀/邊界 (Shape)<br>• 地段編號 (Lot ID)<br>• 新增/刪除地塊
Work Lot<br>(工作地塊)	Yes (是)	這是系統的核心。用戶需要畫出 Operator 的實際佔用範圍。隨著收地進度（例如部分交地），範圍形狀可能會改變。	• 形狀 (Polygon)<br>• 關聯的 Operator 資料<br>• 狀態 (Status color)
Operator<br>(營運者資料)	Yes (是)	Operator (如 BU 名稱、聯絡人) 本質上是 Work Lot 的屬性資料 (Attribute)。這些資料會隨著調查而更新。	• 名稱 (Name)<br>• 聯絡資訊<br>• 備註
2. 圖層架構 (Layer Structure)
為了滿足 「一個 Operator (Work Lot) 可能橫跨多個 Land Lot」 的業務邏輯，系統至少需要 3 層 (3 Layers) 的疊加結構：
第一層 (最底層)：Base Map (底圖)
來源： CSDI (政府通用數據) 或通用地圖 (Google/OSM)。
內容： 街道、山脈、海岸線、建築物輪廓。
性質： Read-only (唯讀)。用戶無法修改，僅作背景參考。
第二層 (中間層)：Land Lot Layer (地段層)
來源： 由 isBIM 初期根據 PDF 勾畫，後期由 CEDD 管理員維護。
內容： 政府定義的法律地界 (D.D./Lot No.)。
性質： Editable (可編輯)。
用途： 這是「網格 (Grid)」。用來讓用戶知道「這裡原本是哪幾個地號」。
Rex 的需求： 可以 Toggle (開關) 這一層，用來核對 Operator 佔了哪些地。
第三層 (最上層/操作層)：Work Lot Layer (工作層 / Operator 層)
來源： 由用戶 (Site Staff) 根據現場實際佔用情況繪製。
內容： 代表 Operator (BU/Household) 的多邊形 (Polygon)。
性質： Editable (可編輯) & Interactive (可互動)。
用途： 這是「貼紙 (Sticker)」。貼在 Land Lot 上面。
視覺化： 這一層會根據 Status 變色 (紅=滯後, 綠=已交地)。
點擊互動： 用戶在 App/Web 點擊這一層的色塊，就會彈出 Operator 的資料和 Task 列表。
3. PRD 寫作建議 (系統邏輯描述)
在你的 PRD 中，可以這樣描述這兩層的關係：
"The Overlay Logic" (疊加邏輯):
The system shall allow the Work Lot Layer (representing actual Operators) to be superimposed on top of the Land Lot Layer. Since these boundaries often do not align, the system must support independent editing of both layers. A user should be able to draw a single Work Lot polygon that visually covers parts of multiple Land Lots on the layer below.
這樣設計完全符合 Hon (Site Team) 提到的「三個直的 Lot (Land Lot) 被三個橫的 Operator (Work Lot) 覆蓋」的複雜情況。
