问题：原文里面提到了operator 并且要加operator进这个系统吗？
這份是根據你提供的原始文字整理而成的 逐字稿 (Verbatim Transcription)。我已將其整理為對話形式並標註了講者（根據內容推斷），以便閱讀。
(註：內容保留了原本的廣東話口語及中英夾雜的表達方式)
Project: Platform Development for ND Project - Kick off Meeting
Date: 29 January 2025
Rex (isBIM):
Hello, good morning everyone. 大家都到齊啦，咁我們就開始這個 Kick-off meeting。
其實我們上次開過一次，分享過我們有什麼需求啦。其實都講過，因為我們現在處理收地個 Status 其實都好多資料性的東西。
如果我們好多個 parties 都在 Plan 上面去 determine 一些 asset，可能就會有些好簡單的東西，譬如透過 System 一次做完，其實就不需要個個都花些時間去對番邊一個位。
又或者我們有需要去睇，譬如個地，例如 Land parcel 1 夾比 ID 的，牽涉幾多 BU (Business Undertakings) 或者 HouseholD。如果每一次去對的時候其實都有一個複雜性，同埋亦都會牽涉到判斷錯誤。到底這個 household 或者這個 BU 其實是去咗 ID 地 1 定係 ID 地 2 呢？其實好多時就會有些少人為上面的判斷錯誤。
我們希望透過這個平台，可以 efficient 些，大家一撳就知道 ID 地 1 牽涉 ABCD 幾個 BU，大家就清楚，同埋可以知道埋個 Status。
個 Status 例如是已經 handover 給 Civil 啦，抑或是個 household 完咗有糾紛，都可以好容易睇得到。特別是有啲地複雜性高啲，收地的時候可能會影響到工程，亦都可以有一些 Timer 或者 indication 在 system 裡面，知道這個地搞不掂就有機會 turn out 會有 impact to 個 construction program。
希望可以做到一個這樣的 platform。
(Rex 確認 Eric 是否準備好分享畫面)
Eric, is speaker okay?
Eric (isBIM):
Okay. (嘗試分享畫面) Wait.
Rex:
我介紹下我們團隊先，我們這邊主力會做開發或者 Communication 就是我們的 Eric。我會幫手 support 下。另外我們還有 Hon 在這邊，在這個 Project 裡面主力的同事就是 Eric，之後開會主力都是 Eric，如果有些 technical 的東西 Hon 都會來幫手 join 下，或者看看 project run 的時候有沒有什麼需要協調。
Eric 麻煩你講講今日 kick-off，go through 下個 agenda，同埋個 project 會點樣行。
Eric:
Okay. 大家都見到了。我講講今日個 Agenda，今日主要都是講番我們小小的 understanding，大家去 line up，同埋個 development roadmap，即是這短短六至八個禮拜大家怎樣去夾。
講番個 Overview，我們都清楚有兩 Part，主要個 Web platform，剛才 Victor 都介紹了主要的功用。所以會有一個 Web platform 給大寫同事在電腦用。亦都有個手機 App 方面，大家在出邊或者現場去做一些登記、任務追蹤。
我們這個 platform 最主要一樣野就是 GIS Integration。因為我們過往都有不少 project 用了這一 Part 的東西，Based on CSDI data，或者我們其他的 data as a layer 可以在 System 展現出來。
講番個 Timeline，頭兩個禮拜我們會跟番我們現有的 Architecture 去 setup 個 GIS integration、Base map、Testing environment。
跟住第三至五個禮拜，我們同步會做一些 Development 的工作。這部分每個禮拜大家都要夾住去行。可能我們有些 Prototype 去呈現，或者有些大家 function 上的 agreement，有些 testing 要做。
譬如講番詳細少少，第一步，一至兩個禮拜內，因為我們都有一些現有的 System，我們就會 Setup 個 Development environment。會將我們需要的 GIS API set 好。之前都講了，我們可能用些 CSDI 的 Open data 做底，在上面再去畫我們的 Land lot。
譬如 Base map 那邊可能有些 Street map 或者 topographic map，或者你們想有些什麼 data 想 integrate，這些都可以去傾同埋擺落去。
跟住 Development 那邊，我們會在 Web portal 那邊去 develop 一個 Land lot management。譬如上面就可以畫那些 Land lot boundary，用一些 Polygon (多邊形) 畫出來。畫完之後可以對應番不同的 Land lot，可以管理番它。有什麼 extra information 我們都可以加落去這一 Part。
Layer 那邊也是，剛才講了，我們可以開關不同的 Layer，或者你們政府的、或者自己有什麼 Data layer 都可以擺落去 Manage。
Task 方面，剛才好重要講到我們收地或者有些 timeline 要跟，有些同事要分配任務，就在 Task module 那邊去跟進。
最後 System 都有一些 Config，譬如 User 的加加減減、Role management。
另外就 Mobile App 那邊，有些基本 function。個 App 我們都是實用為主。可以實時 track 到你在邊個位置，邊達 Land lot。Indoor 就做不到這些。另外就是 Task management，其實現場好重要都是睇下有什麼 Task，睇下這些達地相關的資料。最後有什麼任務的東西就可以同個 Server 去 sync 番。
最後階段我們 Implement，一個 Local 的 implementation，我們一些基本的 Security 東西都會 fulfill。
另外就會有些 Testing，我們 Internal 會自己去 Test performance 各樣野。亦都會邀請同事去做一個 UAT (User Acceptance Test) test，表示個 System OK 啦，我們 Accept 啦。
最後就可以 Handover，可以做 Training，可以給些 Menu 大家。
這個就是個 Summary scope。來到這一 Part 大家有沒有什麼問題？
Victor (CEDD):
Victor 個 Timeframe OK 嗎？聽不聽到？
Rex:
聽到。
Victor:
其實我想問下，頭那兩個星期，我們 achieve 到什麼？感覺上好像兩個星期後我們已經有些少野睇到？
Eric:
我們 Setup 就其實... 這是一個我們的 Foundation，即是我們自己這邊的一些準備。我們會 Setup 我們的 Development project architecture，會 Setup 我們部機去做測試。
Hon (isBIM):
不好意思，Victor 我想搭嘴問一問。我知道現在 Server 那邊，應該 C1 那部機是 Server。我們都 Review 了 Spec。我想問下那邊 OS 的 Report 系統是用什麼環境？Windows, Linux?
Victor:
Win Server 來的。
Hon:
Windows Server 來的？OK。
Victor:
我題外話問少少，有沒有機會是架一些 VM 出來，即 On top 有些虛擬機在上面 Run？
Hon:
可以，可以的。
Victor:
我們需要不需要去 Access 地盤那部 Server？即需不需要有些 Port 開給我們？
Hon:
這些我們之後會去溝通。
Victor:
不如咁，我們寫番個 Meeting minutes。麻煩 Victor gather 番些 Communication email，如果好點的話，地盤那邊 IT 部門可能有代表有個電話給我們，我們可以看看有沒有 IP 可以入到去。當然大家可以傾傾 Security 的問題，看看怎樣可以叫 Access 入去裝在裡面。我們當然這些 Communication 都會經 Victor 你，但我們都想直接 Contact 他。
Rex:
好啊，我們幫手給番個 Contact list 和大家的名字。
Victor:
其實我們都有少少 Piece meal 的地都開始收到的。其實我覺得都可以... 之後我們會夾一夾，都可以成為這些小小的 example，你一邊試 Build up 的時候，可能已經有幾塊地去 Example trial。我覺得都可以叫做我們兩個星期倒，就已經有些野睇緊或者處理緊。
同埋我都希望... 頭先你講那些兩個 week 跟住三 week 做什麼。因為那些 terms 始終對我們有點複雜，或者不是很熟。可能就要多些少包番開，因為另外 Wes (Binnies) 都給了個 email 我們，其實都寫有些 information 或者有些野要我們 Feed 的。
可能都要幫手一起包一包，究竟在邊一個 Duration 裡面其實我們要給那些 File 係些什麼，和它是什麼 Format。可能我我們會跟不到那些 Technical terms。
Eric:
明白。我們應該都有個 Working group。我們其實今日開會之後我們就開始 Send email，大家需要麻煩幫手提供些什麼。我們同埋這每個禮拜個 Planning 就會開始 update 給大家。今日個會就主要是粗略少少講番個 Timeline。
Hon:
另外我都看了現在 C1 那部地盤 Server，我們都 Review 了 Spec。OS 是 Windows 嗎？
Victor:
Win Server。
Hon:
我想問下，OS Report 系統是用什麼環境？
Victor:
Win Server。
Hon:
VM 來的？
Victor:
VM 來的。
Eric:
Victor，我想問下，其實頭先 Wes 講那些 Log，我諗又未必是我們現在講那個... 即個 ID，Identification 似乎是兩套不同的 Language 我估。
Victor:
一個是工程的...
Rex:
因為個 Land lot 有機會一達... 你睇到個 Land lot 有機會裡面牽涉有四個 Operator，即是有四間不同的廠房咁樣。
因為我們一路 Deal with 地政都是講緊是這個 Layer 的東西。Instead of 個 Land lot 個 ID。
Eric:
不緊要，我們 Align 番。我們將我頭先講那個或者我們一些 CSDI 那些 Open data 我們 Cap 些上來，看看邊部分會岩用。如果不岩用的話你們再 Comment 給我們，我們再基於些資料畫出來又好，或者是哪裡拿 Data 都好。
Eric:
其實我補充下，其實 Wes 的意思即是除了些 Open data，有沒有些你們一些 Private 的 data 都需要擺上去或者 Share 出這個 Project 咁樣啫。
即可能我不知道除了 CSDI 之外，地政同事 for 你這個 project 都有一些 data 想擺落個 System 的，都稍微就溝通下個 Format 呀咁樣。
Cherry (CEDD):
我們可以每後再決定些同事再傾傾。
Hon:
Share 呀 Share 呀。Nancy 那些同事、Keith... 我們大概都... 今朝聽了少少今日個會想講這個 Platform 啦。先問番我們想問多少少野先。Eric 介不介意去一去番第一張 Slide？個 Web portal 你寫 Land lot management。
給番少少資料我們其實手頭上會有的野呢，就是譬如我們整個 Resumption 的地段我們會有啦，我們都有張 Resumption plan 的。
但是如果話真是你問我每一個 Lot 的 Coordinate 呢，我相信我們甚至 SVO 都未必現成有的。因為未 Survey 那些同事如果未 Survey 其實不會有什麼 Coordinate，即是一條條線這樣跌出來的啫。
所以個 Reference 其實是... 一個粗略 Reference 來的。同埋我們收地那張圖都是 Indicated 啦，我們收地是依個 Area 去計番個 Rate 算錢的啫，所以未必有個... 或者你頭先想講那種 Information handy 會有。
Hon:
第二樣野就是如果他用一個 Lot 做一個單位這樣去 Manage 呢，好像頭先 Victor 所講可能一個 Lot 可能有幾個 Operator，或者調番轉，可能有這三個 Lot，三個打直的 Lot，但其實有三個打橫的 Operator 係每人都佔每個 Lot 的一部分。
你個 Presentation 我不知道你們有沒有考慮這個情況是怎樣 Present 囉。因為它未必是一個 Lot 就一個 Operator，或者 Operator is part of 一個 Lot。可能個 Operator 牽涉幾個 Lot。譬如牽涉 123 這三個 Lot，另一個 Operator 1234 這三個 Lot 的時候，會不會... 看看怎樣去 Present 這件事。
因為我們初步聽落去個 Purpose 都是想有個好似一個 Map 的 Platform，一 Select 一些範圍我們就知道裡面有些什麼的 Tearis (Tenants?) 啦，亦都牽涉了那些地段是什麼地段啦，可能有這些 Information 囉。
但可能我們 For see 就會有個 Presentation 個考慮會不會做得到。
Eric:
這個做到的。我們其實在這一單 Particular，在這單 Project 裡面呢，就可能現在都提早問下，那個 Land lot 是... 即是一炸... 即是定係會有 Land lot group 咁樣？即兩溝咁樣？即譬如一個 Group 的 Land lot 裡面又包開有幾個不同的 Land lot。
至於你話一個 Land lot 有不同位置這些是我們之前都 Handle 過了，這些沒問題。即是分散幾開這些好正常的。
但是會不會有一些需要是不同 Land lot 你又想特別 Group 埋它一起變成一個 Land lot group 咁的？這樣就剛剛想到的一個問題。
Rex:
我回答下。我都用我用家的角度分享少少啦。我現在其實我去 Take up 地政交給我們的地的時候呢，其實我就不是最 Concern 他其實 Belong to 邊一個 Lot 呀咁樣的。我就係睇個位置囉，同埋他個 Operator 係咪成舊野比哂我囉。
但不代表他本身有一些 Information 不重要。因為可能在地政角度好重要，因為好像頭先咁講，一個 Operator 原來牽涉左三個 Lot 窩，他地政一定要好清好楚這些情況的。
但可能就在我們 Operation 就是，可能有一個 Layer 就是去解決到他將這個 Operator 叫做順意交晒給我既，咁樣啦叫做順意 Operator 啲野個地交晒給我。
但他可能背後是牽涉到有牽涉到三個 Lot 的，好似頭先 Victor 地政那邊個分享那個情況。咁可能你就要預備定有一個 Layer 係去同他同我頭先講個... 一收收晒成個 Area 牽涉三個 Lot 個個，可能要有啲關係囉。他在不同的 Layer 的時候他會知道，原來這個這樣的 Operator 他一開埋個 Land lot 的 Layer 就知道他牽涉左三個不同的 Land lot 的，可能會有啲咁樣的 Preparation 要預備定囉。
Eric:
OK。這個 OK 的。因為其實個... 可能比喻就是好似有些淘寶購物車咁樣，其實這一次的 Transaction 他就有幾單野在裡面啦，不同的 Product 呀咁樣囉。來到這個都一樣啦，他這個人這一次 Task 就涉及了幾個 Land lot 的，這些都 OK 的，這些我們都 Handle 到的。
Victor:
我想問埋之前地政比過一張我們叫 Land plan 啦我記得好似係。裡面就 Mark 咗好多即是些 BU 或者 Household 的位置的。如果咁講即係這些框框其實都是 Indicated 的了係咪？
Hon:
Cherry 呀，Eric 呀。即是個意思係其實類似本身我們逐個逐個都有啲地交比你們啦。我們 Internal 都會有一張圖會自己會定期交完之後會 Update。譬如那個 Area 裡面有邊個位已經 Handover 咗，邊啲係未... 即類似係咁個 Function 係嘛？
只不過現在係用一個 App 或者一個電子化形式去見得到，或者落去 On site 那些同事都開住可以看到返個 Status 和個 Location 啫。
同埋我們之後 Working group 同埋 LMCo 啲同事去自己拿上去做 Presentation 那時都會用返這些 System。到時我們的目標就是可以一次過撳就撳晒究竟有幾多 Percentage of land 係已經交咗比 CDD 啦，有幾多係處理中或者有些 difficult case 可以就咁在這個平台那裡 Show 到出來。
Eric:
即係話譬如現在 High grade 北面這一兩張圖的...
Cherry:
那裡我們可以做啦。即係將公路斬開一北一南。
Eric:
這張圖其實我們或者我 Share 少少啦，Sorry，Somehow 我們本身去做 BPCS 呢，其實本身都有類似你們講的一個... 我們都有個 App 嘅，有個叫 EPCS 的 App 呢，其實我們做那時都有可以 Input 到裡面譬如去到那個地段有一個什麼的 Business undertaking 呀，有沒有些 Household。
跟住入返一些資料，咁其實我們自己本身有。但當然那個 System 就我們 Internal 用的啦。同埋我們都有 GPS 的也都方便我們對個位。
但頭先聽阿 Hon 去講，因為我們甚至 Even 我們 SMO 同事 Develop 這些 System 呢，個 GPS 都好大個誤差的。都係 For 一個 Reference 嘅啫。都要靠同事落去去睇返些 Land boundary 定個位置的。
如果你話我們畫... 即點解阿 Hon 那時說我們通常都會比那張圖 Present，可以畫一些飛線，可能用做個 Base，有些同事畫了些 Site map 做個 Base 的。這我們本身就沒個 Hard define 定。我們都會傾可能我們 Run，即是我們 Flow 畫了先的。因為第一我們同事，即是我們自己 Internal 都有這些圖會畫啦。
但再另外除了個 EPCS 以外再用一個你可能你緊 Develop 一個 Platform 再再再畫或者再做呢，可能就我們未必有咁多 Resources 去去做這一樣野。所以我們可能初步最南邊有部分其他... 用番這個 Presentation 的方式比你們先好不好呀？
都我們即... 即... 可能有些同事如果有有有 resources 或者 Capacity 我們去去真的再試呀，用你緊個 Platform 去發覺都都都可以喔，或者都幫更加幫到手喔，到時我們才再看下怎樣是個 Input 好不好呀。
Cherry:
我我不反對。純粹我們要有些範圍同些名那些資料。
Eric:
其實最主要我們想個 System 就當然 CDD 負責去 Build 同埋去負責營運啦。同埋大家都想 Share 埋這個 System 比你們那邊，即假設譬如現在我們個 BU 同埋 Household 那張 Plan 呢就是 Cover 咗我們比較北邊的地盤啦。
但去到之後可能南邊甚至乎會 Locate 他 Contract 那些我們都想 Share 埋給你們那邊去用呢，就是假設你們第時在一個地圖上面都可以畫番，即用番個 System 畫番個界同埋打番那些名的資料就 OK 啦。這個就是我們暫時需要你們提供的 Input 來的。
Hon:
即係話譬如現在 High grade 北面這一兩張圖的 Soft copy...
Cherry:
那裡我們可以做啦。即係將公路斬開一北一南。
Rex:
我想問問你們用那個 EPCS 個 System 你們畫完那些 Data 是什麼 Format 的？即會不會是些 DGN 或者是可以 Share 到給我們？
Hon:
看我們可以可以在個 App 那裡導出同埋可以可以即步步咁樣 Copy 出來囉。但他個什麼 Format 我又沒很詳細了解過。其實 Soft copy 我們自己這些我們自己以前些同事其實每一隻都要逐步畫的。但畫完之後他會畫得快少少同埋簡單一點咁畫。是我們 Internal for 我們做野用的一個 Tools 來的。
就應該未必可以這樣給到一些 Data 給你 Feed 進去，我諗他本身沒沒考慮這些的。
Rex:
OK，OK。好啊，好啊。無問題。我覺得都 OK 的，因為始終那些線呢，我都 Understood 既好 Indicative 既其實有時都需要一些即 On-site 的 Determination 的。所以這個這樣的 Data 我覺得都夠，即最少我們都 Outline 番出來囉。
即我們暫時跟住這個 Scheme 去行先囉到後面如果這個 System 你們 Develop 咗，或者都可以我們有同事可以也都試用，研究下，或者我們畫了圖一起一起畫了先，可以到那一時我們做到那一方面再試下有沒有有沒有這樣的機遇囉。
Cherry:
好。好。
Victor:
好啊。
Eric:
另外 Eric 啊有沒有 Concern 一下個 Numbers of User 啊或者個 Type，即邊個 User，邊一種累的 User 係係睇到些什麼資料，需不需要現在可以初步有個問番 CEDD 他們拿個 Concept 先？
Rex:
這個要傾的。不過就就可能都可以稍後再再寫多小少野出來先。因為因為現在些 Information 可能都要再有個 Structure 都需要再諗一諗。
即我想最 Open 些 Data 就暫時就如果我們可以既就都比晒先既。咁咁就在暫時這個 Stage 就。即是將來再 Develop 的時候可能就多小少。
因為將來我們預了 Contract Stage 一開始的時候，即即其實現在盤頭入去啦，咁即當盤頭入去的時候，可能我們將來會再 Develop 多一層盤頭自己本身個 Program 的一些即 Key 的 Data 可能都會擺落去。即例如個位置盤頭已經要在幾月幾月某月某日時候一定要開始打樁的啦。但原來呃著了紅燈窩即他 Late start 已經到了但我們都未收到這達地窩，或者三個月前都未收到這達地窩。咁可能就會有 Timer 出聲 Alert 咁樣囉。咁即都都 Long term 都想做到咁樣的。
Rex:
ERIC 有沒有其他野需要... 我諗我們都寫番個 List 出來看看有什麼要 Gather from CDD 好不好呀？等他們可以照單執藥。
Eric:
好啊好啊。同埋 IT Contractor 我們都會有些野問啦咁樣大家溝通下，無間。
Rex:
嗯嗯嗯。好，咁我轉頭就都定番個即搵邊個 Contact point 啦。
Hon:
好啊。咁你定那個 List 出來的時候我們就，係囉將個 Meeting minutes 就 Circulate 番晒今日有 Join 即睇那個 List 的人囉，咁大家都可以 Align 番知道我們個進度，即今日開了 Kick off meeting，跟住大家有些什麼 Follow up action。
Rex:
好啊，好啊。OK。
Eric:
還有沒有其他野？
Cherry:
我無。看看地政同事有沒有其他野想補充補充？
Hon:
Victor 這裡有個好 Minor 的。我知道你們會經 C1 應該是比 C1 我們去做這個 Contract 的。但你可不可以即 Email 都寫番隻字給我們等我們可以叫做叫做開了個個個 Project 咁樣呀。
Rex:
OK，OK，好啊。明白。咁都都簡單講埋少少啦。咁其實頭先阿 Tony，Tony Lo 呢他即他都是 IT 實便 Support 啦。咁其實他亦都是 Coolie Contractors 裡面的即同事來的。咁咁變左其實我們都是會找他去溝通你們 IsBIM 那邊去再再再聯絡囉。咁就即關於些 Server 的 Setting。
Hon:
好啊。錯。另外我有個 SRE 阿 Humphrey 都係在這個會度的。咁他會幫我手去處理一些即可能細緻這樣囉。
Rex:
好，咁就咁啦，麻煩晒咁多位。
All:
OK 好，唔該晒。拜拜。拜拜。拜拜。