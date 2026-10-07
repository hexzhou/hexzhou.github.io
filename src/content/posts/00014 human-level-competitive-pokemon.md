---
title: '基于 Transformer 的可扩展离线强化学习：实现人类水平的宝可梦竞技对战'
published: 2026-10-07 00:00:00
tags: [AI, 强化学习, Transformer, 宝可梦, 论文翻译]
draft: false
description: 'Metamon 如何利用真实人类对战回放、离线强化学习和 Transformer，在宝可梦竞技单打中达到人类水平。arXiv:2504.04395v2 全文中文翻译，包含附录 A—F。'
image: ''
category: 'AI'
lang: 'zh_CN'
license: false
sourceUrl: https://arxiv.org/abs/2504.04395
sourceTitle: "Human-Level Competitive Pokémon via Scalable Offline Reinforcement Learning with Transformers"
sourceAuthors: [Jake Grigsby, Yuqi Xie, Justin Sasek, Steven Zheng, Yuke Zhu]
authors: [Jake Grigsby, Yuqi Xie, Justin Sasek, Steven Zheng, Yuke Zhu]
sourceDate: "2025-07-30"
arxiv: "2504.04395v2"
sourceLanguage: en
language: zh-CN
translationMode: refined
translationDate: "2026-10-07"
---

**作者：** Jake Grigsby；Yuqi Xie<sup>†</sup>；Justin Sasek<sup>†</sup>；Steven Zheng<sup>†</sup>；Yuke Zhu

> 原文：[Human-Level Competitive Pokémon via Scalable Offline Reinforcement Learning with Transformers](https://arxiv.org/abs/2504.04395v2)
>
> 译者说明：依据 arXiv v2（2025 年 7 月 30 日）全文翻译，包含正文与附录 A—F。参考文献保留原始书目信息；配图保留原版，图注已译。“原注”为作者脚注，“译注”为译者补充。

## 摘要

<!-- source:abstract1.1 -->

宝可梦竞技单打（Competitive Pokémon Singles，CPS）是一款流行的策略游戏。玩家需要根据不完全信息，学会利用对手的弱点；一场对战可能包含一百多个具有随机性的回合。CPS 的人工智能研究主要采用启发式树搜索和在线自我对弈，但这款游戏也可以成为一个研究平台，用于探索在大规模数据集上离线训练的自适应策略。我们开发了一套处理流程，从观战者第三人称视角保存的日志中，重建智能体的第一人称视角，从而让十余年来积累的真实人类对战记录成为可用的数据集，而且这个数据集每天都在增长。借助这些数据，我们采用一种黑箱方法，训练大型序列模型，使其仅凭输入的轨迹适应对手，并在完全不进行显式搜索的情况下选择招式。我们在宝可梦最早的四个世代中，研究从模仿学习（imitation learning，IL）到离线强化学习（offline reinforcement learning，offline RL），再到利用自我对弈数据进行离线微调的递进过程。这四个世代的对战竞技性很强，同时也是信息最不充分的世代。训练得到的智能体胜过了近期的一种大语言模型智能体方法和一款强大的启发式搜索引擎。我们的最佳智能体匿名参加线上人类对战时，排名进入了活跃账号的前 $10\%$。全部智能体检查点、训练细节、数据集和基线方法均已在 [metamon.tech](https://metamon.tech) 公开。

<a id="S0.F1"></a>

<!-- source:S0.F1 -->

![S0.F1.g1](/images/human-level-pokemon/Figure1_v2_safe.png)

图 1：**CPS 中的批量训练与评估。** 我们开发了名为 `Metamon` 的平台，使研究者能够基于 Pokémon Showdown 的人类对战数据，开展离线强化学习。

<a id="S1"></a>

## 1 引言

<!-- source:S1.p1.1 -->

宝可梦竞技单打（**CPS**）是一款双人策略游戏。它融合了国际象棋的长规划跨度，以及扑克的不完全信息、对手建模和随机性，又加入了大量专有名词和冷门游戏机制，多到需要一部[百科全书](https://bulbapedia.bulbagarden.net/wiki/Main_Page)才能完整记录。在 CPS 中，玩家从数十亿种可能性中构筑自己的队伍，并与对手交战。每个回合，玩家可以选择让场上的宝可梦使用招式，也可以换上队伍中的另一名成员（图 [1](#S0.F1) 右）。招式可以对对方造成伤害，并最终使其失去战斗能力；直到只剩一方仍有能够战斗的宝可梦，该玩家获胜。CPS 人工智能是一个令人兴奋的强化学习（reinforcement learning，RL）问题，因为它要求在极其庞大的状态空间中进行不确定性推理。最强的宝可梦人工智能依赖定制模拟器中的启发式搜索（[Mariglia，2019](#bib.bib48)），或结合自我对弈的测试时蒙特卡洛树搜索（[Wang，2024](#bib.bib79)）。值得注意的是，宝可梦竞技对战所使用的网站保存了十多年来逐回合的对战记录。我们开发了一套处理流程，将这些日志转换为智能体在正式排位赛中与人类对战时所处的部分可观测视角，从而得到了一种自然积累、且每天都在增长的离线强化学习数据来源（[Lange 等，2012](#bib.bib41)）。我们的“重建”过程专门针对 CPS，也会产生一些需要强化学习克服的 CPS 特有问题。从更广的角度看，这也是利用已有数据启动数据飞轮时可能遇到的一类挑战。医疗、金融等强化学习应用领域中，存在大量与问题*相关*的数据，例如患者记录和时间序列，但这些数据并未整理为智能体视角的轨迹。将它们转换为这种格式，会在重建得到的（部分可观测）马尔可夫决策过程（(PO)MDP）与真实世界之间形成“仿真到真实”的差距。

<!-- source:S1.p2.1 -->

我们的数据集使一种此前难以实践的 CPS 人工智能思路成为可能：序列模型或许可以利用无模型强化学习（model-free RL）和长期记忆，推断对手的队伍与行为倾向，从而在不使用显式搜索或启发式规则的情况下学会对战。我们的实验将这一思路贯彻到底，形成了一个关于大型策略训练与评估过程的案例研究（图 [1](#S0.F1) 左）。我们开发了一组启发式对手和模仿学习对手，并使用程序生成的宝可梦队伍进行离线评估。以这些对手为基准，我们评估了通过模仿学习和离线强化学习训练、参数量最高达到 $200$M 的 Transformer（[Vaswani 等，2017](#bib.bib76)）。当部署到 CPS 前四个世代的排位对战中，与人类玩家交手时，我们最大规模的强化学习策略获得的官方预估是：根据世代不同，击败随机抽取对手的概率为 $41$-$58\%$。这几个世代竞争激烈，对战持续时间最长，对手队伍所披露的信息也最少。我们没有等待数据集继续积累，而是探索这样一种想法：让模型在刻意不贴近真实情况的自我对弈数据上训练，或许也能带来收益。这些数据不试图复现线上对战中未知的队伍与对手分布。由此训练得到的智能体，其预估胜率提升至 $64$-$80\%$，排名进入活跃账号的前 $10\%$，并登上了全球排行榜。近期的一种大语言模型智能体（[Hu 等，2024](#bib.bib29)）在早期世代漫长的规划跨度下缺乏竞争力，而我们的最佳智能体能够达到或超过最强启发式搜索引擎的水平。

<a id="S2"></a>

## 2 背景：宝可梦竞技单打

<!-- source:S2.p1.1 -->

对于不熟悉宝可梦竞技对战的读者，顶级对战策略的复杂程度很难用言语充分说明。这款游戏将对手建模、随机状态转移、复杂动态、长跨度规划和庞大的初始状态空间结合在一起。宝可梦对战具有很强的随机性，玩法围绕细致的机制展开，特殊情形层出不穷。CPS 在 [Pokémon Showdown](https://pokemonshowdown.com/)（**PS**）上进行，这是一个每天有数千名玩家使用的网站。PS 模拟了每个主要商业游戏版本，即每个“世代”的战斗机制。虽然一些基本原则可以跨世代通用，竞技对战却依赖各世代独有的细节。PS 将每个世代进一步划分为不同“分级”（tier），各分级通过不同规则维持竞技平衡。每个世代的每个分级都是一款独立的游戏；更准确地说，是两款依次进行的游戏：队伍*构筑*和队伍*操控*。玩家在匹配对手之前先构筑队伍，并权衡取舍，以应对自己认为可能遭遇的威胁。队伍构筑会趋向某种均衡，可能将搜索范围缩小到数千种具有实质差异、被认为具备竞技可行性的队伍。

<!-- source:S2.p2.1 -->

除了应对宝可梦对战的随机性，队伍操控，也就是实际对战，主要涉及不完全信息下的决策。对方宝可梦的详细信息，只有在直接影响战局时才会被揭示。我们可以根据对手已经透露的信息推断其队伍，从而获得优势。例如，我们可能知道宝可梦 $A$ 经常与宝可梦 $B$ 一起使用，也知道宝可梦 $A$ 通常携带招式 $x$ 或 $y$，却很少同时携带两者。我们也可能通过披露某些信息，让对手误以为我们采用了某种队伍构筑，再在后续对战中给他们一个意外。玩家的（大部分）决策都是同时作出的。根据对手的队伍和此前表现出的倾向，准确预测其选择，是区分高水平玩家的关键能力。例如，某个招式或许能直接赢下对战，但只有当我们相信对手本回合会换人时，选择它才是安全的。归根结底，宝可梦玩家一直在更新关于对手队伍与策略的先验，以改善自己的决策。

<!-- source:S2.p3.1 -->

PS 有三项玩家指标。**ELO** 是一种标准评分体系，但 PS 的版本刻意引入了较大波动，而且不同游戏模式之间的 ELO 不可比较。**Glicko-1** 类似 ELO，但会考虑玩家的完整对战历史，对我们的研究而言，它能更好地估计真实水平。PS 的匹配系统倾向于让 ELO 评分相近的玩家交手。**GXE** 对这种匹配偏差进行校正，估计玩家击败随机抽取对手的概率。宝可梦对战具有内在的高方差，这一点对单挑无限注德州扑克玩家来说并不陌生：尽量降低风险被认为是一项关键能力，但有些失利无法避免。最顶尖玩家的 GXE 为 $74$-$90\%$（图 [2](#S2.F2) 右）。

<a id="S2.F2"></a>

<!-- source:S2.F2 -->

![S2.F2.g1](/images/human-level-pokemon/merged_metamon_ps_sumary_fig_large_font.svg)

图 2：**各世代的对战长度、队伍多样性与方差。** 对战长度依据我们的回放数据集统计，并按长度分箱，分箱的最大长度为 $100$。GXE 统计数据采集于 2025 年 2 月。

<!-- source:S2.p4.1 -->

PS 的人工智能研究需要决定研究哪些世代和分级。通常的选择是最新世代的“随机对战”分级。随机对战为双方提供程序生成的队伍，省去了队伍构筑环节。这套规则的玩家群体更偏休闲，而我们将关注玩家自行设计队伍、使之契合自身打法的赛制。**我们的智能体将学习四个不同的分级，但评估将集中于“OverUsed”（OU）。** OU 是最具代表性的竞技赛制，因此也是最受欢迎的分级，自然拥有最多可供学习的数据（第 [3](#S3) 节）。总体而言，随着世代更替，OU 的队伍组合和游戏机制都会增加（图 [2](#S2.F2) 右）。一个关键变化是，从第五世代开始，庞大的队伍空间带来了极高的方差，因此 PS 引入了“队伍预览”（team preview）机制，在对战开始前揭示对手的队伍。我们尤其关注 CPS 的部分可观测性，因此将研究范围限定在前四个世代。

<!-- source:S2.p5.1 -->

**早期世代的 OverUsed。** 除了标志性地缺少队伍预览，CPS 的早期世代还具有独特的游戏机制，以及明显异于其他世代的对战长度（图 [2](#S2.F2) 左）。第一、第二世代以极高的随机性著称；由于进攻能力较低，重点从队伍配置转向了漫长交锋中的对战策略。第三世代以长盛不衰的人气和良好的竞技平衡著称：按 GXE 衡量，中位水平玩家与顶尖玩家的差距很小（图 [2](#S2.F2) 右）。第四世代则更像现代版本，许多宝可梦可以用一个招式击倒对手；快节奏对战让玩家必须在较短的规划深度内作出攸关胜负的决策。早期世代形成了一个几乎独立的竞技社区，历史悠久，玩家群体相对较小，但参与者都是主动选择加入的。我们将面对的人类对手，专门选择了一款已有 $15+$ 年历史的游戏的竞技赛制，因为这是他们的兴趣与专长所在。这里的休闲玩家很少；我们将遇到的许多“低评分”账号，实际是有经验的玩家出于各种原因登录的小号。附录 [C](#A3) 发现，与现代世代的随机对战相比，基于宝可梦基本原则和查询表的启发式方法，在面对早期世代 OU 的人类玩家时效果要差得多。

<!-- source:S2.p6.1 -->

虽然我们使用无模型、长上下文强化学习，并聚焦早期世代 OU 的做法具有新意，但 CPS 人工智能已有相关研究。最强的宝可梦机器人主要采用启发式树搜索，并搭配定制的高吞吐量模拟器。一些研究在随机对战赛制中，尝试过基于网络的状态评估和蒙特卡洛树搜索（MCTS）（[Browne 等，2012](#bib.bib8)；[Huang 和 Lee，2019](#bib.bib30)）。宝可梦主要在互联网上对战和讨论，这为近期的大语言模型智能体技术提供了丰富的游戏知识（[Hu 等，2024](#bib.bib29)；[Karten 等，2025](#bib.bib35)）。第 [5](#S5) 节中，我们将在与关键基线交手时讨论这些方法。附录 [A](#A1) 综述了 CPS 人工智能研究，附录 [B](#A2) 则讨论离线强化学习与游戏智能体的相关工作。

<a id="S3"></a>

## 3 构建真实人类对战的离线强化学习数据集

<!-- source:S3.p1.1 -->

PS 会为每场对战生成一份日志，即“回放”。如果无人保存，回放会在短时间后失效。玩家保存回放，可能是为了日后研究、与朋友分享有趣的结果，或记录正式赛事的成绩。PS 作为宝可梦竞技对战的主要平台已有十余年，足以积累数百万份回放。PS 回放数据集是一种令人兴奋的自然积累数据来源。不过，它存在一个关键问题：CPS 的决策是在两名对战玩家之一的部分可观测视角下作出的，而 PS 回放记录的是第三方观战者的视角，观战者无法获取任何一支队伍的私有信息。我们将观战视角分别转换为双方玩家各自的视角，使 PS 回放数据集得以用于学习。

<!-- source:S3.p2.1 -->

回放重建主要包含四个步骤。首先，我们依照 PS API，从观战者视角**模拟**对战的当前状态。在这一过程中，我们不断利用新出现的信息，估计双方尚未观测到的队伍初始配置。对战结束后，我们**推断**所有始终未被揭示的信息。为此，我们需要对各世代、各分级的竞技队伍分布进行建模。幸运的是，PS 社区会统计宝可梦的使用情况，以衡量趋势并评估规则变更。我们利用已有的使用数据，以及相似回放中已揭示的队伍，建模人类构筑的队伍分布。接下来，我们选择一名玩家的视角，将推断出的己方队伍成员信息**回填**到轨迹中，复现该玩家在作出决策时能够观察到的信息。最后，我们将重建轨迹**转换**成与线上模拟器完全相同的格式。附录 [D](#A4) 逐步介绍了一个简化示例，并使用一份真实回放，按照下一节讨论的观测空间、动作空间和奖励函数，将原始输入、推断队伍和轨迹输出可视化。

<a id="S3.F3"></a>

<!-- source:S3.F3 -->

![S3.F3.g1](/images/human-level-pokemon/data_distribution_v2.png)

图 3：**数据集概况。** 我们的初版离线数据集包含 $475$k 场对战；图中分别按 PS 赛制（左）、ELO 评分（中）和以智能体时间步计量的长度（右）汇总。

<!-- source:S3.p3.1 -->

这一过程并非总能成功，因为一些游戏机制无法从不完整信息中重建。我们通过一系列检查，识别进入歧义情形的轨迹，并采取保守做法，将其丢弃。最终，我们能够从最早追溯到 $2014$ 年的第 $1$-$4$ 世代历史对战中，下载并重建超过 $475$k 场人类对战示范，且包含塑形奖励（图 [3](#S3.F3)）。每场对战产生两个玩家视角的轨迹，共计约 $950$k 条序列，包含 $38$M 个时间步。玩家名称和聊天内容均已匿名化，轨迹以灵活的格式保存，便于研究者自定义观测、动作和奖励。我们的处理流程持续下载新对战，最近还扩展到了第九世代 OU，使轨迹总数达到 $3.5$M。不过，本文实验使用的是最初的 $950$k 条轨迹数据集，数据截止日期为 2024 年 9 月。

<a id="S4"></a>

## 4 利用序列数据上的离线强化学习实现无需搜索的宝可梦对战

<!-- source:S4.p1.1 -->

玩家在讨论和教授这款游戏时，通常认为自己的决策策略 $\pi$ 取决于当前对对手策略（$\pi_{o}$）和队伍配置（$c_{o}$）的估计。设 $c_{p}$ 为我方队伍配置。本文采用贝叶斯强化学习（Bayesian RL）（[Ross 等，2007](#bib.bib60)；[Ghavamzadeh 等，2015](#bib.bib21)）或元强化学习（meta-RL）（[Beck 等，2023](#bib.bib3)）的视角，将对手的选择视为环境未知转移函数 $T(s_{t+1}\mid s_{t},a_{t},\pi_{o})$ 的一部分（[Zintgraf 等，2021a](#bib.bib84)）。我们的目标是找到一个策略，使其在某种环境潜变量分布下最大化回报。在本研究中，这一分布对应于 PS 上的活跃对手，以及我们的队伍分布：

<!-- source:S4.EGx1 -->

<a id="S4.E1"></a>

$$
\displaystyle\pi^{*}=\arg\max_{\pi}\mathbb{E}_{\pi_{o},\,c_{o}\sim p(\pi_{o},c_{o}),c_{p}\sim p(c_{p})}\left[\mathbb{E}_{\tau\sim p(\tau\mid\pi,\pi_{o},c_{o},c_{p})}\left[\sum_{t=0}^{T}\gamma^{t}\,R(s_{t},a_{t})\right]\right]\tag{1}
$$

<!-- source:S4.p3.1 -->

基于上下文的方法会从先前经验中估计未观测变量，并以这些估计作为策略的条件。在这里，这意味着利用整场对战的历史（原注：对此处基于上下文的框架，一个自然扩展是在当前对战之外，纳入同一对玩家此前的对战。这可能使智能体能够在锦标赛的三局两胜赛制中进行适应。），也就是观测、奖励（原注：由于我们的宝可梦奖励函数从不变化，因此它可被视为状态空间的一部分。在我们的设置中，奖励恰好对推断上一回合的*结果*很重要。）和双方玩家的动作，来估计（$c_{o}$，$\pi_{o}$）。如果我们希望避免显式预测 $c_{o}$ 或 $\pi_{o}$（[Humplik 等，2019](#bib.bib31)）——这很难明确建模——或避免建模宝可梦复杂的动态（[Zintgraf 等，2021b](#bib.bib85)），就可以采用一个简单的黑箱框架（[Duan 等，2016](#bib.bib14)；[Wang 等，2016](#bib.bib78)）：序列模型 $S_{\theta}$ 将当前潜变量下的全部先前经验，也就是从对战开始到当前时间步的整段轨迹 $\tau_{0:t}$，作为输入，并输出供策略网络 $\pi_{\phi}$ 使用的表示 $h_{t}$。与标准深度强化学习一样，整个系统通过端到端训练最大化公式（[1](#S4.E1)）。由于更准确地估计对手会提高胜率，序列模型会隐式学会这种行为。在测试时，策略需要权衡探索与利用：如果揭示新信息有助于提高预期回报，它就可能采取能够获取这些信息的动作。

<!-- source:S4.p4.1 -->

我们将使用第 [3](#S3) 节的离线数据集（$\mathcal{D}$）近似公式（[1](#S4.E1)）中的期望。这隐含了一个假设：历史上的队伍与打法分布，同当前游戏中的分布完全一致（[Dorfman 等，2020](#bib.bib13)；[Li 等，2024](#bib.bib46)）。这个假设并不成立，但两者可能足够接近，尤其是在策略已经高度优化的早期世代 OU 中。如果希望扩充数据集，例如通过自我对弈，我们就需要尽量选择符合真实分布的队伍和对手。另一种做法是采集*明确*处于分布外（out-of-distribution，OOD）的数据。例如，我们可以让一只罕见的宝可梦首发；这样，当策略开始一场真实对战，并看到更常见的首发选择时，就没有理由认为自己面对的是我们合成生成的队伍或对手。

<!-- source:S4.p5.1 -->

宝可梦具有复杂的状态空间，我们的策略可能需要很大的规模，而通过离线强化学习训练这样的策略也并不容易。为提高稳定性，我们可以从行为克隆（behavior cloning，BC）的角度理解这一问题：预测人类玩家的动作，要求模型推理被模仿玩家的策略，以及该玩家如何理解对手。要准确预测，就需要长上下文输入。大型数据集包含了不同水平玩家在竞技和休闲场景中的决策，强化学习可以帮助我们从这些噪声中筛选有效行为。我们最终仍采用同样的设置，但更倾向于一种能够稳妥退化为 BC 的更新方法。同时，如果我们判断离线强化学习的风险足够小，它也应允许我们调整损失函数，使之更偏向最大化回报的行为（[Springenberg 等，2024](#bib.bib72)；[Wu 等，2019](#bib.bib81)；[Fujimoto 和 Gu，2021](#bib.bib18)）。理想情况下，BC 成为我们可以进一步改善的性能下界。这类方案采用策略网络—价值网络（actor-critic）结构，通过标准的单步时序差分更新，训练价值网络（Critic）输出 $Q$ 值。策略网络（Actor）的损失函数一般采用如下形式：

<!-- source:S4.EGx2 -->

<a id="S4.E2"></a>

$$
\displaystyle\mathcal{L}_{\text{Actor}}=\mathbb{E}_{\tau\sim\mathcal{D}}\left[\frac{1}{T}\sum_{t=0}^{T}\left(-w(h_{t},a_{t})\log\pi(a_{t}\mid h_{t})-\lambda\mathbb{E}_{a\sim\pi(\cdot\mid h_{t})}\left[Q\left(h_{t},a\right)\right]\right)\right]\tag{2}
$$

<a id="S4.T1"></a>

<!-- source:S4.T1 -->

| **模型名称** | $w(h,a)=$ | $\lambda$ |
| --- | --- | --- |
| "IL" | 1 | 0 |
| "Exp"<br>（也简称“RL”） | $\exp(\beta A^{\pi}(h,a))$<br>（裁剪后） | 0 |
| "Binary" | $A^{\pi}(h,a)>0$ | 0 |
| "Binary+MaxQ" | $A^{\pi}(h,a)>0$ | > 0 |

表 1：**$\mathcal{L}_{\text{actor}}$ 的配置（公式（[2](#S4.E2)））。** 优势由价值网络估计：$A^{\pi}(h,a)=Q(h,a)-\mathbb{E}_{a^{\prime}\sim\pi}[Q(h,a^{\prime})]$。

<!-- source:S4.p7.1 -->

其中，$h_{t}$ 是序列模型 $S_{\theta}(\tau_{0:t})$ 的输出，用于代替状态。第一项是 BC 目标，它根据函数 $w$ 对决策重新加权，并将学习限制在离线数据集已执行的动作上（[Wang 等，2020](#bib.bib80)；[Nair 等，2020](#bib.bib52)）。第二项是标准在线离策略学习中的策略网络更新项，在离线使用时可能高估 OOD 动作的价值（[Kumar 等，2019](#bib.bib38)）。我们的实验将研究公式（[2](#S4.E2)）的不同配置，概括见表 [1](#S4.T1)。关于强化学习工程细节的进一步讨论，请参阅我们在全部实验中使用的 AMAGO（[Grigsby 等，2024a](#bib.bib22)）实现。

<a id="S4.F4"></a>

<!-- source:S4.F4 -->

![S4.F4.g1](/images/human-level-pokemon/arch_v6_safe.png)

图 4：**模型概览。** 模型依据当前对战各回合的观测、动作和奖励表示，预测动作。

<!-- source:S4.p8.1 -->

接下来，我们需要为 CPS 定义观测空间、动作空间和奖励函数。智能体需要足够的信息来复现人类决策，PS 网站的用户界面自然是一个参考。不过，我们的模型具备记忆，无须在每个时间步提供全部信息。我们需要在输入维度、记忆难度、对宝可梦复杂动态的泛化能力，以及回放重建与部署之间的仿真到真实误差（sim2real）暴露程度之间取舍。最终，我们折中采用了包含 $87$ 个词的文本和 $48$ 个数值特征。文本部分具有一定可读性，图 [5](#S4.F5) 给出了数据集一份回放中的示例。**最关键的一点是，我们完全依赖记忆来推断对手的队伍**；观测只包含对手当前场上的宝可梦。我们的 CPS 观测在记忆需求上，更接近商业电子游戏，而非 PS 网页界面。我们有信心，序列模型能够回忆先前的时间步，因此值得采用这种设计，避免在对手完整队伍逐渐被揭示的过程中，其特征产生分布偏移。动作空间有九个离散动作：前四个索引对应当前场上宝可梦的招式，其余五个对应换上另一名队伍成员。观测以可预测的顺序传达这些动作的确切含义。奖励函数以二值胜负结果为主，另对造成伤害和恢复生命值施加少量奖励塑形。附录 [E](#A5) 提供了更多细节。

<!-- source:S4.p9.1 -->

每个时间步的观测、上一动作和上一奖励，都由一个 Transformer 编码器处理。该编码器使用专门的汇总词元，对多模态序列进行注意力计算（[Devlin 等，2019](#bib.bib12)）。文本编码时，我们依据数据集对宝可梦词汇进行词元化，并以 `<unknown>` 词元处理可能遗漏的罕见情况（原注：我们尝试了一种数据增强方案，将词元设为 `<unknown>`，迫使模型从先前时间步中恢复信息。超过 $100$M 参数的模型默认采用这一策略；较小模型若采用该策略，会以“Aug.”标记。我们没有发现这一策略影响性能的证据）。生成的回合表示序列随后输入一个因果 Transformer，后者具有策略网络与价值网络输出头（图 [4](#S4.F4)）。

<a id="S4.F5"></a>

<!-- source:S4.F5 -->

![S4.F5.g1](/images/human-level-pokemon/metamon_annotated_observation.svg)

图 5：**观测与动作空间。** 文本顺序很重要，但各个词可以被词元化为长度固定（为 $87$）的数组。观测还包含 $48$ 个数值特征。每个动作索引的含义会随回合变化，但在文本中始终按一致的顺序呈现。

<a id="S5"></a>

## 5 实验

<!-- source:S5.p1.1 -->

我们首先在不同模型架构上，评估一系列逐步增加强化学习比重的训练目标。模型按参数量分为“Small”（15M）、“Medium”（50M）和“Large”（200M），概况见表 [3](#A5.T3)。结果中的模型名称由规模和训练目标决定（表 [1](#S4.T1)）。表 [4](#A5.T4) 列出了完整的模型配置。我们大致按实验推进的顺序讨论结果，不过有些图会提前展示模型在“合成”自我对弈数据集上训练后的胜率，这些数据集将在第 [5.3](#S5.SS3) 节介绍。我们的目标是与人类玩家竞争，但这种评估成本高，而且带来了一个难题：应该将哪些模型检查点部署到 PS 上？为回答这个问题，我们进行了大量针对不同对手的评估。

<!-- source:S5.p2.1 -->

训练时，我们使用离线数据集指定己方队伍，但评估时需要用一组队伍来“提示”智能体。我们采用三组队伍：1）**多样化队伍集（Variety Set）**：为每个世代／分级程序生成 $1$k 支刻意保持多样性的队伍，用于评估 OOD 对战能力，以及生成第 [4](#S4) 节提到的明确处于分布外的自我对弈数据。2）**回放队伍集（Replay Set）**：基于顶尖玩家的回放近似其队伍选择，并按照第 [3](#S3) 节的方法推断尚未揭示的细节。3）**竞技队伍集（Competitive Set）**：从论坛讨论中抓取每个世代／分级的 $10$-$20$ 支完整“示例”队伍；这些队伍通常由专家为初学者设计。除非另有说明，胜率均在数百或数千场对战的大样本上测量。评估使用 [poke-env](https://github.com/hsahovic/poke-env)（[Sahovic，2020](#bib.bib62)），与本地运行的 PS 服务器及公开网站交互。

<a id="S5.SS1"></a>

### 5.1 启发式评估

<a id="S5.F6"></a>

<!-- source:S5.F6 -->

![S5.F6.g1](/images/human-level-pokemon/heuristic_composite_scores.svg)

图 6：**启发式综合得分。** 对阵我们六种启发式策略的平均胜率，用于衡量核心游戏知识，并为不同游戏模式建立一个相对固定的参照点。

<!-- source:S5.SS1.p1.1 -->

我们构建了十二种启发式对手，用于评估核心游戏知识。这些策略基于宝可梦的基本概念，以及对官方宝可梦版本、难度大幅提高的玩家自制 ROM 改版和常用 CPS 人工智能基线中策略的重新实现。附录 [C](#A3) 完整介绍了这些策略及其相对表现。在多样化队伍集上，对其中 $6$ 种启发式策略的平均胜率构成“启发式综合得分”（图 [6](#S5.F6)）。我们使用参数量为 $500$k-$4$M、通过 BC 训练的 RNN 轨迹模型 $S_{\theta}$，调优回合编码器架构（图 [4](#S4.F4)）。附录 [F.1](#A6.SS1) 记录了这些模型的预测准确率，并提供更多细节。最好的 BC-RNN 模型在早期启发式综合得分排名中领先，它们将成为我们迈向人类水平对战能力的下一阶挑战。明显的欠拟合迹象促使我们将 Transformer 智能体的起始规模设为 $15$M。虽然我们随后将在 OU 上使这一基准的表现趋于饱和，但启发式策略仍是固定的评估目标，不受 OU 与智能体所学习的另外三个分级之间数据量差异的影响（图 [3](#S3.F3)）。图 [7](#S5.F7) 展示了从 OU 到 NeverUsed（NU）对战能力的可预期下降。我们评估了 $\mathcal{L}_{\text{actor}}$ 目标（公式 [2](#S4.E2)）的许多变体，但没有发现它们之间存在显著差异。

<a id="S5.F7"></a>

<!-- source:S5.F7 -->

![S5.F7.g1](/images/human-level-pokemon/ou_vs_nu_heuristics_final.svg)

图 7：**OU $\rightarrow$ NU。** 启发式评估凸显了 OU 分级与回放较少的分级之间的差距。OU 得分可以与图 [6](#S5.F6) 直接比较。

<a id="S5.SS2"></a>

### 5.2 模型对手评估

<a id="S5.F8"></a>

<!-- source:S5.F8 -->

![S5.F8.g1](/images/human-level-pokemon/mediumrl_dpg_vs_basernn_by_policy_head.svg)

图 8：**多 $\gamma$ 策略。** 模型在多个价值估计跨度上进行训练，而长期规划能提高胜率。

<!-- source:S5.SS2.p1.1 -->

附录 [F.1](#A6.SS1) 将我们较大的 Transformer 模型与表现最好的 RNN 基线进行了对战评估。（**译注：原文此处引用 F.1，相关对战评估实际见附录 F.3 的图 29。**）采用 RL 更新的 Transformer 显著优于纯 BC Transformer，但所考察的多种 RL 变体之间差别不大。相较于 RL，BC 的模型规模与性能之间更明显地呈现出预期关系。按照 [Grigsby 等（2024a）](#bib.bib22) 的方法，我们针对一组 $\gamma$ 并行优化策略网络和价值网络的输出。在测试时，我们可以选择任意一个规划跨度所对应的动作。图 [8](#S5.F8) 证实，智能体正在利用长期价值估计提高胜率。其他所有评估均采用 $\gamma=.999$ 对应的策略。在规模较有限的竞技队伍集上，RL 已能轻松战胜较小的 IL 基线，因此我们转向在回放队伍集上与 Large-IL 对战。图 [9](#S5.F9) 展示了主要模型在 OU 中的胜率。

<a id="S5.SS3"></a>

### 5.3 来自自我对弈的合成数据

<!-- source:S5.SS3.p1.1 -->

第 [5.5](#S5.SS5) 节将表明，我们的离线数据集能训练出在公开天梯上达到人类水平的策略。我们的智能体每天都会为新一批回放贡献对战记录，与人类玩家一道扩充数据集。原则上，我们可以等待数据集扩大，再重新训练新策略，但在单个项目的时间跨度内，这些新增数据尚不足以带来显著影响。我们可以在本地 PS 天梯上部署智能体，将其轨迹加入人类对战数据集，再重新训练或微调模型，以加快这一过程（图 [1](#S0.F1) 左）。不过，我们需要警惕新离线数据集所隐含的队伍与对手出现频率偏离 PS 上的真实分布。一种做法是生成与原始数据集明显不同的数据，使模型在以真实对战为条件时，对 $p(\pi_{o},c_{o}\mid\tau_{0:i})$ 的隐含估计在 $i$ 较小时仍保持不变。我们从所有智能体中选取不同检查点混合使用，让它们在本地托管的 PS 天梯上竞争，并采用多样化队伍集中的队伍。我们优先追求多样性而非逼真程度，希望这些数据能覆盖回放重建失败的情形，帮助模型以无模型方式更好地学习宝可梦的随机状态转移，同时避免使其对人类队伍和策略的估计产生偏差。

<a id="S5.F9"></a>

<!-- source:S5.F9 -->

![S5.F9.g1](/images/human-level-pokemon/head2head_vs_large_il_final.svg)

图 9：**与 Large IL 对战的内部评估。** 结果采用最后 $200$k 个训练步中表现最好的检查点，每个世代的样本量为 $500$ 场对战。

<!-- source:S5.SS3.p2.1 -->

SyntheticRL（SynRL）模型均为从头训练的 Large Binary+MaxQ 策略（式（[2](#S4.E2)））。**SyntheticRL-V0** 的训练仅在第 $1$ 和第 $3$ 世代使用“合成”的多样化数据，数据集总规模为 $2$M 条轨迹。与此前的策略相比，它在对战启发式对手（图 [28](#A6.F28)）、BC-RNN（Gen1OU 和 Gen3OU 中的胜率分别高达 $95\%$ 和 $85\%$）及 Large-IL（图 [9](#S5.F9)）时，都表现出令人期待的提升。**SynRL-V1** 在此数据集基础上加入第 $2$ 和第 $4$ 世代的数据，使轨迹总数达到 $3$M，并从头重新训练一个 $200$M 参数的策略，从而在各世代均取得了提升。

<a id="S5.F10"></a>

<!-- source:S5.F10 -->

![S5.F10.g1](/images/human-level-pokemon/gen1ou_win_rates.svg)

图 10：**Gen1OU 自我对弈。** 在回放队伍集上采样 $500$ 场对战。

<!-- source:S5.SS3.p3.1 -->

“合成”数据生成过程中如此谨慎是否必要？为检验这一点，我们让 SynRL-V1 使用更接近真实分布的回放队伍集，与自身近期检查点对战，直至离线数据集达到 $5$M 条轨迹。随后，我们继续训练 $200$k 个梯度更新步，得到 **SynRL-V1+SelfPlay（SP）**。正如预期，所得模型在与自身（图 [10](#S5.F10)）以及第 [5.4](#S5.SS4) 节的一个关键基线对战时表现明显更好，但第 [5.5](#S5.SS5) 节将表明，这种提升在面对真实玩家时并不稳定。对战回放清楚地表明，模型认为自己的对手是 SynRL-V1。于是，我们回退到此前方案，使用不符合真实分布的队伍和 IL 对手将数据集扩展至 $5$M 条轨迹，再次微调 SynRL-V1，得到 **SynRL-V1++**。最后，我们在 SynRL-V1++ 数据集的基础上加入 $50$k 场新的人类对战回放，从头训练一个新的 $200$M 参数模型。我们采用简单的二值加权 BC 更新替代 Binary+MaxQ，并将价值预测转换为 two-hot 分类（**译注：用两个相邻分箱的权重表示标量值。**）（[Schrittwieser 等，2020](#bib.bib67)；[Hafner 等，2023](#bib.bib25)；[Farebrother 等，2024](#bib.bib16)），具体采用 [Grigsby 等（2024b）](#bib.bib23) 在这一场景中的实现。这一技巧常见的采用理由是对超参数不敏感，以及在多任务 RL 中不受回报量级影响。在我们的实验中，价值网络准确性的提升使二值 BC 筛选机制的悲观程度达到了新的水平（图 [25](#A5.F25)）。考虑到此时数据集主要由相当于人类初级或中级水平的决策构成（第 [5.5](#S5.SS5) 节），这可能是一种改进。所得的 **SynRL-V2** 模型在所有指标上都是我们表现最好的模型，包括与启发式对手、其他模型以及下文将讨论的关键外部基线的对战表现。

<a id="S5.SS4"></a>

### 5.4 大语言模型智能体与启发式搜索

<!-- source:S5.SS4.p1.1 -->

Foul Play（[Mariglia，2019](#bib.bib48)）是一个先进的宝可梦竞技单打引擎，通过自定义模拟器搜索宝可梦的博弈树。它融入了大量领域知识，实现了许多我们希望策略能从数据中学到的行为。例如，它会在对战中根据 PS 的使用率统计推断对手的队伍，类似于我们在构建数据集时的做法。Foul Play 于 2025 年 1 月的一次更新加入了对早期世代的支持。我们在回放队伍集上向该引擎发起挑战，每个世代进行 $300$ 场对战，结果见图 [11(a)](#S5.F11.sf1)。在第 3 和第 4 世代，即有效搜索深度可能最低的世代，我们能与该机器人的最佳版本打成平手；而在规划跨度更长的第 1 和第 2 世代，我们的表现优于它。PokéLLMon（[Hu 等，2024](#bib.bib29)）采用更通用的方法，利用互联网上丰富的宝可梦资料构建大语言模型智能体。其提示词纳入了宝可梦属性相克关系、招式描述等领域知识，并由大语言模型在可用招式之间作出选择。[Hu 等（2024）](#bib.bib29) 在随机对战分级中进行了评估，并指出该智能体难以进行长期规划；在第 1—4 世代更长的对战中，这一问题更加明显（图 [11(b)](#S5.F11.sf2)）。

<a id="S5.SS4.fig1"></a>

<!-- source:S5.SS4.fig1 -->

<a id="S5.F11.sf1"></a>

<!-- source:S5.F11.sf1 -->

![S5.F11.sf1.g1](/images/human-level-pokemon/vs_foul_play_final.svg)

（a）**Foul Play 评估。** 使用两种可用的搜索算法及 `poke-engine` v$0.31.0$。样本量为 $300$ 场对战。

<a id="S5.F11.sf2"></a>

<!-- source:S5.F11.sf2 -->

![S5.F11.sf2.g1](/images/human-level-pokemon/pokellmon_main.svg)

（b）**PokéLLMon**。采用 GPT-4o 后端，使用针对第 1—4 世代定制的提示词。样本量为 75 场对战。

<a id="S5.SS5"></a>

### 5.5 在 Pokémon Showdown 排位天梯上与人类对战

<a id="S5.F12"></a>

<!-- source:S5.F12 -->

![S5.F12.g1](/images/human-level-pokemon/offline_model_ladder_ratings_mar26.svg)

图 12：**与人类对战的评估。** 图中展示 Glicko-1 天梯评分及其评分偏差，柱状图标签表示 GXE 统计值。为便于跨世代比较，我们还绘制了一个启发式基线的表现，以及全球前 $500$ 名排行榜中末尾 $100$ 名玩家的平均 Glicko-1 评分。

<!-- source:S5.SS5.p1.1 -->

我们通过在公开 PS 天梯上排队参加排位对战，与人类玩家竞技。每次评估持续 $4$-$8$ 天；期间频繁切换世代，以接触更广泛的对手，并获得至少 $400$ 场对战的较大样本量。评估时间从 2024 年 12 月下旬持续至 2025 年 3 月下旬。图 [12](#S5.F12) 展示了各模型在最后一场对战结束时的 Glicko-1 和 GXE 统计值。我们也纳入了一个启发式智能体的结果，以提供更多参照。图 [14](#S5.F14) 将天梯统计值转换为模型在活跃账号中的百分位。对于缺乏宝可梦竞技单打背景的读者，百分位更容易理解；但计算百分位所需的玩家统计分布*并非*公开信息，PS 只显示排名前 $500$ 的活跃账号的评分。不过，我们的数据集重建了评估时期后半段的大部分对战，因此能够给出合理估计。我们恢复了所有具有足够活跃度、使 Glicko-1 评分偏差 $\leq\pm 100$ 的不同账号的评分。这一指标仍不理想，因为玩家经常使用多个用户名。顶尖玩家有明确的竞技理由创建新账号，但我们无法对此作出修正。SynRL-V1++ 和 SynRL-V2 在 Gen1OU 中的评估受到一场持续数周的锦标赛影响：该赛事要求参赛的顶尖玩家创建新账号，使我们所在的高水平段评分大幅缩水（原注：SynRL-V2 与人类进行了 $613$ 场对战，在超过 $100$ 场对战后，其 Gen1OU GXE 稳定在 $79.9\%$（Glicko-1 为 $1761\pm 35$）。但在接下来的 $100$ 场对战中，评分有所下降，因为我们不再避开这场顶尖玩家使用新注册、低评分账号参赛的赛事。图 [12](#S5.F12) 和图 [14](#S5.F14) 保守地报告了最终指标）。

<a id="S5.F13"></a>

<!-- source:S5.F13 -->

![S5.F13.g1](/images/human-level-pokemon/win_rate_by_context_length.svg)

图 13：**记忆。** SynRL-V1 与能够回顾整场对战的自身版本对战。

<!-- source:S5.SS5.p2.1 -->

Large-RL 模型达到了中级玩家水平，在第 1 和第 2 世代中，对随机抽取的对手具有胜算优势。在本研究推进过程中，高多样性的自我对弈数据带来了显著提升。SynRL-V2 已是一名水平相当高的玩家，估计在各世代均进入前 10%。虽然 ELO 评分存在噪声，SynRL-V1 和 SynRL-V2 在 Gen1OU 中的全球最高排名分别达到第 $46$ 和第 $31$，SynRL-V2 还两次进入 Gen3OU 的前 $300$ 名。所有 RL 模型均位列 Gen2OU 的前 $500$ 名。据我们所知，这是 AI 首次在早期世代 OU 的*任意*一个分级中达到 SynRL-V2 所取得的*任意*一项天梯评分；它在没有动力学模型、也不依赖宝可梦启发式策略的情况下实现了这一成绩，同时学习了 $16$ 套规则集（附录 [A](#A1)）。从定性观察来看，我们的模型展现出类似人类的对战方式。评估期间，我们在 PS 网站保存了一些回放样例，可在[此链接](https://replay.pokemonshowdown.com/)搜索模型的用户名（表 [6](#A6.T6)）查看。策略学会了合理开局、安全换人，并预判对手的招式。然而，正如我们对序列策略所预期的那样，智能体偶尔也会受到错误累积的影响，在长时间对战中开始作出不合逻辑的决策，尤其是在对手使用罕见队伍或不常见策略时。图 [13](#S5.F13) 评估了记忆对策略胜率的影响，其对手是具有完整上下文长度的自身版本。

<a id="S5.F14"></a>

<!-- source:S5.F14 -->

![S5.F14.g1](/images/human-level-pokemon/player_distributions.svg)

图 14：**天梯百分位。** 通过 2025 年 2—3 月下载的回放，我们识别出第 $1$-$4$ 世代中 $14022$ 个活跃账号。以第 1 世代为例，其中 $5095$ 个账号曾参加 Gen1OU 对战，而在结果最终确定时，$2661$ 个账号的活跃程度足以获得有效的 GXE 统计值。

<a id="S6"></a>

## 6 结论

<!-- source:S6.p1.1 -->

本研究为宝可梦竞技单打建立了可扩展的离线 RL 方法，并表明，在早期世代 OverUsed 这一富有挑战性的环境中，使用历史对战数据训练的序列模型能够与人类竞争。我们的 PS 轨迹数据集将随时间继续增长；它提供了一项复杂任务，可用于评估新研究，因此也可能引起离线 RL 领域更广泛的关注。我们希望这些数据集和基线模型能激发对宝可梦竞技对战的研究兴趣。其他训练方案和大规模自我对弈技术可能为超越人类水平的表现铺平道路。代码、预训练模型和数据集已在 GitHub 发布：[UT-Austin-RPL/metamon](https://github.com/UT-Austin-RPL/metamon/tree/main)。

<a id="S6.SSx1"></a>

### 致谢

<!-- source:S6.SSx1.p1.1 -->

我们特别感谢 Felix You 和 Emil Velasquez。他们是得克萨斯大学奥斯汀分校的本科生，也是本项目早期的重要贡献者，而这项研究后来持续了异乎寻常的长时间。我们也感谢 `poke-env` 和 Pokémon Showdown 项目，以及 Bulbagarden、Smogon 等宝可梦社区。没有爱好者制作的资源，本项目便无法实现。本研究得到了韩国政府科学技术信息通信部（MSIT）资助的信息通信技术规划评估院（IITP）项目经费（编号 RS-2024-00457882，国家人工智能研究实验室项目）、Sony Research Award 以及 JP Morgan 的支持。

<a id="bib"></a>

## 参考文献

<a id="bib.bib1"></a>

- Agarwal et al. (2020) Rishabh Agarwal, Dale Schuurmans, and Mohammad Norouzi. An optimistic perspective on offline reinforcement learning. In *International conference on machine learning*, pp. 104–114. PMLR, 2020.

<a id="bib.bib2"></a>

- Ba et al. (2016) Jimmy Lei Ba, Jamie Ryan Kiros, and Geoffrey E Hinton. Layer normalization. *arXiv preprint arXiv:1607.06450*, 2016.

<a id="bib.bib3"></a>

- Beck et al. (2023) Jacob Beck, Risto Vuorio, Evan Zheran Liu, Zheng Xiong, Luisa Zintgraf, Chelsea Finn, and Shimon Whiteson. A survey of meta-reinforcement learning. *arXiv preprint arXiv:2301.08028*, 2023.

<a id="bib.bib4"></a>

- Berner et al. (2019) Christopher Berner, Greg Brockman, Brooke Chan, Vicki Cheung, Przemysław Dębiak, Christy Dennison, David Farhi, Quirin Fischer, Shariq Hashme, Chris Hesse, et al. Dota 2 with large scale deep reinforcement learning. *arXiv preprint arXiv:1912.06680*, 2019.

<a id="bib.bib5"></a>

- Brohan et al. (2023) Anthony Brohan, Noah Brown, Justice Carbajal, Yevgen Chebotar, Xi Chen, Krzysztof Choromanski, Tianli Ding, Danny Driess, Avinava Dubey, Chelsea Finn, et al. Rt-2: Vision-language-action models transfer web knowledge to robotic control. *arXiv preprint arXiv:2307.15818*, 2023.

<a id="bib.bib6"></a>

- Brown & Sandholm (2018) Noam Brown and Tuomas Sandholm. Superhuman ai for heads-up no-limit poker: Libratus beats top professionals. *Science*, 359(6374):418–424, 2018.

<a id="bib.bib7"></a>

- Brown et al. (2020) Noam Brown, Anton Bakhtin, Adam Lerer, and Qucheng Gong. Combining deep reinforcement learning and search for imperfect-information games. *Advances in neural information processing systems*, 33:17057–17069, 2020.

<a id="bib.bib8"></a>

- Browne et al. (2012) Cameron B. Browne, Edward Powley, Daniel Whitehouse, Simon M. Lucas, Peter I. Cowling, Philipp Rohlfshagen, Stephen Tavener, Diego Perez, Spyridon Samothrakis, and Simon Colton. A survey of monte carlo tree search methods. *IEEE Transactions on Computational Intelligence and AI in Games*, 4(1):1–43, 2012. DOI: 10.1109/TCIAIG.2012.2186810.

<a id="bib.bib9"></a>

- Campbell et al. (2002) Murray Campbell, A.Joseph Hoane, and Feng hsiung Hsu. Deep blue. *Artificial Intelligence*, 134(1):57–83, 2002. ISSN 0004-3702. DOI: https://doi.org/10.1016/S0004-3702(01)00129-1. URL [https://www.sciencedirect.com/science/article/pii/S0004370201001291](https://www.sciencedirect.com/science/article/pii/S0004370201001291).

<a id="bib.bib10"></a>

- Chen et al. (2021) Xinyue Chen, Che Wang, Zijian Zhou, and Keith Ross. Randomized ensembled double q-learning: Learning fast without a model. *arXiv preprint arXiv:2101.05982*, 2021.

<a id="bib.bib11"></a>

- Cho et al. (2014) Kyunghyun Cho, Bart Van Merriënboer, Caglar Gulcehre, Dzmitry Bahdanau, Fethi Bougares, Holger Schwenk, and Yoshua Bengio. Learning phrase representations using rnn encoder-decoder for statistical machine translation. *arXiv preprint arXiv:1406.1078*, 2014.

<a id="bib.bib12"></a>

- Devlin et al. (2019) Jacob Devlin, Ming-Wei Chang, Kenton Lee, and Kristina Toutanova. Bert: Pre-training of deep bidirectional transformers for language understanding. In *Proceedings of the 2019 conference of the North American chapter of the association for computational linguistics: human language technologies, volume 1 (long and short papers)*, pp. 4171–4186, 2019.

<a id="bib.bib13"></a>

- Dorfman et al. (2020) Ron Dorfman, Idan Shenfeld, and Aviv Tamar. Offline meta learning of exploration. *arXiv preprint arXiv:2008.02598*, 2020.

<a id="bib.bib14"></a>

- Duan et al. (2016) Yan Duan, John Schulman, Xi Chen, Peter L Bartlett, Ilya Sutskever, and Pieter Abbeel. Rl <sup>2</sup>: Fast reinforcement learning via slow reinforcement learning. *arXiv preprint arXiv:1611.02779*, 2016.

<a id="bib.bib15"></a>

- FAIR Diplomacy Team et al. (2022) FAIR FAIR Diplomacy Team, Anton Bakhtin, Noam Brown, Emily Dinan, Gabriele Farina, Colin Flaherty, Daniel Fried, Andrew Goff, Jonathan Gray, Hengyuan Hu, et al. Human-level play in the game of diplomacy by combining language models with strategic reasoning. *Science*, 378(6624):1067–1074, 2022.

<a id="bib.bib16"></a>

- Farebrother et al. (2024) Jesse Farebrother, Jordi Orbay, Quan Vuong, Adrien Ali Taïga, Yevgen Chebotar, Ted Xiao, Alex Irpan, Sergey Levine, Pablo Samuel Castro, Aleksandra Faust, et al. Stop regressing: Training value functions via classification for scalable deep rl. *arXiv preprint arXiv:2403.03950*, 2024.

<a id="bib.bib17"></a>

- Fu et al. (2020) Justin Fu, Aviral Kumar, Ofir Nachum, George Tucker, and Sergey Levine. D4rl: Datasets for deep data-driven reinforcement learning. *arXiv preprint arXiv:2004.07219*, 2020.

<a id="bib.bib18"></a>

- Fujimoto & Gu (2021) Scott Fujimoto and Shixiang Shane Gu. A minimalist approach to offline reinforcement learning. *Advances in neural information processing systems*, 34:20132–20145, 2021.

<a id="bib.bib19"></a>

- Gallouédec et al. (2024) Quentin Gallouédec, Edward Beeching, Clément Romac, and Emmanuel Dellandréa. Jack of all trades, master of some, a multi-purpose transformer agent. *arXiv preprint arXiv:2402.09844*, 2024.

<a id="bib.bib20"></a>

- Gerstgrasser et al. (2022) Matthias Gerstgrasser, Rakshit Trivedi, and David C. Parkes. Crowdplay: Crowdsourcing human demonstrations for offline learning. In *International Conference on Learning Representations*, 2022. URL [https://openreview.net/forum?id=qyTBxTztIpQ](https://openreview.net/forum?id=qyTBxTztIpQ).

<a id="bib.bib21"></a>

- Ghavamzadeh et al. (2015) Mohammad Ghavamzadeh, Shie Mannor, Joelle Pineau, Aviv Tamar, et al. Bayesian reinforcement learning: A survey. *Foundations and Trends® in Machine Learning*, 8(5-6):359–483, 2015.

<a id="bib.bib22"></a>

- Grigsby et al. (2024a) Jake Grigsby, Linxi Fan, and Yuke Zhu. AMAGO: Scalable in-context reinforcement learning for adaptive agents. In *The Twelfth International Conference on Learning Representations*, 2024a. URL [https://openreview.net/forum?id=M6XWoEdmwf](https://openreview.net/forum?id=M6XWoEdmwf).

<a id="bib.bib23"></a>

- Grigsby et al. (2024b) Jake Grigsby, Justin Sasek, Samyak Parajuli, Ikechukwu D Adebi, Amy Zhang, and Yuke Zhu. Amago-2: Breaking the multi-task barrier in meta-reinforcement learning with transformers. *Advances in Neural Information Processing Systems*, 37:87473–87508, 2024b.

<a id="bib.bib24"></a>

- Gulcehre et al. (2020) Caglar Gulcehre, Ziyu Wang, Alexander Novikov, Thomas Paine, Sergio Gómez, Konrad Zolna, Rishabh Agarwal, Josh S Merel, Daniel J Mankowitz, Cosmin Paduraru, et al. Rl unplugged: A suite of benchmarks for offline reinforcement learning. *Advances in Neural Information Processing Systems*, 33:7248–7259, 2020.

<a id="bib.bib25"></a>

- Hafner et al. (2023) Danijar Hafner, Jurgis Pasukonis, Jimmy Ba, and Timothy Lillicrap. Mastering diverse domains through world models. *arXiv preprint arXiv:2301.04104*, 2023.

<a id="bib.bib26"></a>

- Harrison Ho (2014) Varun Ramesh Harrison Ho, 2014. URL [https://varunramesh.net/content/documents/cs221-final-report.pdf](https://varunramesh.net/content/documents/cs221-final-report.pdf).

<a id="bib.bib27"></a>

- Heinrich et al. (2015) Johannes Heinrich, Marc Lanctot, and David Silver. Fictitious self-play in extensive-form games. In *International conference on machine learning*, pp. 805–813. PMLR, 2015.

<a id="bib.bib28"></a>

- Hessel et al. (2019) Matteo Hessel, Hubert Soyer, Lasse Espeholt, Wojciech Czarnecki, Simon Schmitt, and Hado Van Hasselt. Multi-task deep reinforcement learning with popart. In *Proceedings of the AAAI Conference on Artificial Intelligence*, volume 33, pp. 3796–3803, 2019.

<a id="bib.bib29"></a>

- Hu et al. (2024) Sihao Hu, Tiansheng Huang, and Ling Liu. Pokéllmon: A human-parity agent for pokémon battles with large language models. *arXiv preprint arXiv:2402.01118*, 2024.

<a id="bib.bib30"></a>

- Huang & Lee (2019) Dan Huang and Scott Lee. A self-play policy optimization approach to battling pokémon. In *2019 IEEE Conference on Games (CoG)*, pp. 1–4, 2019. DOI: 10.1109/CIG.2019.8848014.

<a id="bib.bib31"></a>

- Humplik et al. (2019) Jan Humplik, Alexandre Galashov, Leonard Hasenclever, Pedro A Ortega, Yee Whye Teh, and Nicolas Heess. Meta reinforcement learning as task inference. *arXiv preprint arXiv:1905.06424*, 2019.

<a id="bib.bib32"></a>

- Jiang et al. (2022) Yunfan Jiang, Agrim Gupta, Zichen Zhang, Guanzhi Wang, Yongqiang Dou, Yanjun Chen, Li Fei-Fei, Anima Anandkumar, Yuke Zhu, and Linxi Fan. Vima: General robot manipulation with multimodal prompts. *arXiv preprint arXiv:2210.03094*, 2022.

<a id="bib.bib33"></a>

- Jing et al. (2024) Yuheng Jing, Kai Li, Bingyun Liu, Yifan Zang, Haobo Fu, QIANG FU, Junliang Xing, and Jian Cheng. Towards offline opponent modeling with in-context learning. In *The Twelfth International Conference on Learning Representations*, 2024. URL [https://openreview.net/forum?id=2SwHngthig](https://openreview.net/forum?id=2SwHngthig).

<a id="bib.bib34"></a>

- Kalose et al. (2018) Akshay Kalose, Kris Kaya, and Alvin Kim. Optimal battle strategy in pokemon using reinforcement learning. *Web: https://web. stanford. edu/class/aa228/reports/2018/final151. pdf*, 2018.

<a id="bib.bib35"></a>

- Karten et al. (2025) Seth Karten, Andy Luu Nguyen, and Chi Jin. Pok$\backslash$’echamp: an expert-level minimax language agent. *arXiv preprint arXiv:2503.04094*, 2025.

<a id="bib.bib36"></a>

- KGS (2025) KGS. Kgs go game archives, 2025. URL [https://www.gokgs.com/archives.jsp](https://www.gokgs.com/archives.jsp). Accessed: 2025-03-21.

<a id="bib.bib37"></a>

- Kiran et al. (2021) B Ravi Kiran, Ibrahim Sobh, Victor Talpaert, Patrick Mannion, Ahmad A Al Sallab, Senthil Yogamani, and Patrick Pérez. Deep reinforcement learning for autonomous driving: A survey. *IEEE transactions on intelligent transportation systems*, 23(6):4909–4926, 2021.

<a id="bib.bib38"></a>

- Kumar et al. (2019) Aviral Kumar, Justin Fu, George Tucker, and Sergey Levine. Stabilizing off-policy q-learning via bootstrapping error reduction, 2019.

<a id="bib.bib39"></a>

- Kumar et al. (2022) Aviral Kumar, Rishabh Agarwal, Xinyang Geng, George Tucker, and Sergey Levine. Offline q-learning on diverse multi-task data both scales and generalizes. In *The Eleventh International Conference on Learning Representations*, 2022.

<a id="bib.bib40"></a>

- Lampe et al. (2024) Thomas Lampe, Abbas Abdolmaleki, Sarah Bechtle, Sandy H Huang, Jost Tobias Springenberg, Michael Bloesch, Oliver Groth, Roland Hafner, Tim Hertweck, Michael Neunert, et al. Mastering stacking of diverse shapes with large-scale iterative reinforcement learning on real robots. In *2024 IEEE International Conference on Robotics and Automation (ICRA)*, pp. 7772–7779. IEEE, 2024.

<a id="bib.bib41"></a>

- Lange et al. (2012) Sascha Lange, Thomas Gabel, and Martin Riedmiller. Batch reinforcement learning. In *Reinforcement learning: State-of-the-art*, pp. 45–73. Springer, 2012.

<a id="bib.bib42"></a>

- Laroche & des Combes (2019) Romain Laroche and Rémi Tachet des Combes. Multi-batch reinforcement learning. *Proceedings of the 4th Reinforcement Learning and Decision Making (RLDM)*, 2019.

<a id="bib.bib43"></a>

- Lee et al. (2024) Dongsu Lee, Chanin Eom, and Minhae Kwon. Ad4rl: Autonomous driving benchmarks for offline reinforcement learning with value-based dataset. In *2024 IEEE International Conference on Robotics and Automation (ICRA)*, pp. 8239–8245. IEEE, 2024.

<a id="bib.bib44"></a>

- Lee & Togelius (2017) Scott Lee and Julian Togelius. Showdown ai competition. In *2017 IEEE Conference on Computational Intelligence and Games (CIG)*, pp. 191–198, 2017. DOI: 10.1109/CIG.2017.8080435.

<a id="bib.bib45"></a>

- Levine et al. (2020) Sergey Levine, Aviral Kumar, George Tucker, and Justin Fu. Offline reinforcement learning: Tutorial, review, and perspectives on open problems. *arXiv preprint arXiv:2005.01643*, 2020.

<a id="bib.bib46"></a>

- Li et al. (2024) Lanqing Li, Hai Zhang, Xinyu Zhang, Shatong Zhu, Yang Yu, Junqiao Zhao, and Pheng-Ann Heng. Towards an information theoretic framework of context-based offline meta-reinforcement learning. In A. Globerson, L. Mackey, D. Belgrave, A. Fan, U. Paquet, J. Tomczak, and C. Zhang (eds.), *Advances in Neural Information Processing Systems*, volume 37, pp. 75642–75667. Curran Associates, Inc., 2024. URL [https://proceedings.neurips.cc/paper_files/paper/2024/file/8a30aba6514b56d02976f49797f6338a-Paper-Conference.pdf](https://proceedings.neurips.cc/paper_files/paper/2024/file/8a30aba6514b56d02976f49797f6338a-Paper-Conference.pdf).

<a id="bib.bib47"></a>

- Lichess (2025) Lichess. Lichess game database, 2025. URL [https://database.lichess.org/](https://database.lichess.org/). Accessed: 2025-03-21.

<a id="bib.bib48"></a>

- Mariglia (2019) P. Mariglia. Foul play - a competitive pokémon ai research project. [https://github.com/pmariglia/foul-play](https://github.com/pmariglia/foul-play), 2019. Accessed: 2025-02-27.

<a id="bib.bib49"></a>

- Mathieu et al. (2023) Michaël Mathieu, Sherjil Ozair, Srivatsan Srinivasan, Caglar Gulcehre, Shangtong Zhang, Ray Jiang, Tom Le Paine, Richard Powell, Konrad Żołna, Julian Schrittwieser, et al. Alphastar unplugged: Large-scale offline reinforcement learning. *arXiv preprint arXiv:2308.03526*, 2023.

<a id="bib.bib50"></a>

- Mnih et al. (2015) Volodymyr Mnih, Koray Kavukcuoglu, David Silver, Andrei A Rusu, Joel Veness, Marc G Bellemare, Alex Graves, Martin Riedmiller, Andreas K Fidjeland, Georg Ostrovski, et al. Human-level control through deep reinforcement learning. *nature*, 518(7540):529–533, 2015.

<a id="bib.bib51"></a>

- Moravčík et al. (2017) Matej Moravčík, Martin Schmid, Neil Burch, Viliam Lisỳ, Dustin Morrill, Nolan Bard, Trevor Davis, Kevin Waugh, Michael Johanson, and Michael Bowling. Deepstack: Expert-level artificial intelligence in heads-up no-limit poker. *Science*, 356(6337):508–513, 2017.

<a id="bib.bib52"></a>

- Nair et al. (2020) Ashvin Nair, Abhishek Gupta, Murtaza Dalal, and Sergey Levine. Awac: Accelerating online reinforcement learning with offline datasets. *arXiv preprint arXiv:2006.09359*, 2020.

<a id="bib.bib53"></a>

- Najib et al. (2024,) Amna Najib, Stefan Depeweg, and Phillip Swazinna. Iterative batch reinforcement learning via safe diversified model-based policy search. In *CoRL Workshop on Safe and Robust Robot Learning for Operation in the Real World*, 2024,.

<a id="bib.bib54"></a>

- Nashed & Zilberstein (2022) Samer Nashed and Shlomo Zilberstein. A survey of opponent modeling in adversarial domains. *Journal of Artificial Intelligence Research*, 73:277–327, 2022.

<a id="bib.bib55"></a>

- O’Neill et al. (2024) Abby O’Neill, Abdul Rehman, Abhiram Maddukuri, Abhishek Gupta, Abhishek Padalkar, Abraham Lee, Acorn Pooley, Agrim Gupta, Ajay Mandlekar, Ajinkya Jain, et al. Open x-embodiment: Robotic learning datasets and rt-x models: Open x-embodiment collaboration 0. In *2024 IEEE International Conference on Robotics and Automation (ICRA)*, pp. 6892–6903. IEEE, 2024.

<a id="bib.bib56"></a>

- Perolat et al. (2022) Julien Perolat, Bart De Vylder, Daniel Hennes, Eugene Tarassov, Florian Strub, Vincent de Boer, Paul Muller, Jerome T Connor, Neil Burch, Thomas Anthony, et al. Mastering the game of stratego with model-free multiagent reinforcement learning. *Science*, 378(6623):990–996, 2022.

<a id="bib.bib57"></a>

- Prudencio et al. (2023) Rafael Figueiredo Prudencio, Marcos ROA Maximo, and Esther Luna Colombini. A survey on offline reinforcement learning: Taxonomy, review, and open problems. *IEEE Transactions on Neural Networks and Learning Systems*, 2023.

<a id="bib.bib58"></a>

- Raad et al. (2024) Maria Abi Raad, Arun Ahuja, Catarina Barros, Frederic Besse, Andrew Bolt, Adrian Bolton, Bethanie Brownfield, Gavin Buttimore, Max Cant, Sarah Chakera, et al. Scaling instructable agents across many simulated worlds. *arXiv preprint arXiv:2404.10179*, 2024.

<a id="bib.bib59"></a>

- Reed et al. (2022) Scott Reed, Konrad Zolna, Emilio Parisotto, Sergio Gomez Colmenarejo, Alexander Novikov, Gabriel Barth-Maron, Mai Gimenez, Yury Sulsky, Jackie Kay, Jost Tobias Springenberg, et al. A generalist agent. *arXiv preprint arXiv:2205.06175*, 2022.

<a id="bib.bib60"></a>

- Ross et al. (2007) Stephane Ross, Brahim Chaib-draa, and Joelle Pineau. Bayes-adaptive pomdps. In J. Platt, D. Koller, Y. Singer, and S. Roweis (eds.), *Advances in Neural Information Processing Systems*, volume 20. Curran Associates, Inc., 2007. URL [https://proceedings.neurips.cc/paper_files/paper/2007/file/3b3dbaf68507998acd6a5a5254ab2d76-Paper.pdf](https://proceedings.neurips.cc/paper_files/paper/2007/file/3b3dbaf68507998acd6a5a5254ab2d76-Paper.pdf).

<a id="bib.bib61"></a>

- Rudolph et al. (2025) Max Rudolph, Nathan Lichtle, Sobhan Mohammadpour, Alexandre Bayen, J Zico Kolter, Amy Zhang, Gabriele Farina, Eugene Vinitsky, and Samuel Sokota. Reevaluating policy gradient methods for imperfect-information games. *arXiv preprint arXiv:2502.08938*, 2025.

<a id="bib.bib62"></a>

- Sahovic (2020) H. Sahovic. poke-env: A python interface for training reinforcement learning agents in pokémon battles. [https://github.com/hsahovic/poke-env](https://github.com/hsahovic/poke-env), 2020. Accessed: 2025-02-27.

<a id="bib.bib63"></a>

- Saito et al. (2020) Yuta Saito, Shunsuke Aihara, Megumi Matsutani, and Yusuke Narita. Open bandit dataset and pipeline: Towards realistic and reproducible off-policy evaluation. *arXiv preprint arXiv:2008.07146*, 2020.

<a id="bib.bib64"></a>

- Sarantinos (2023) Nicholas R. Sarantinos. Teamwork under extreme uncertainty: Ai for pokemon ranks 33rd in the world, 2023. URL [https://arxiv.org/abs/2212.13338](https://arxiv.org/abs/2212.13338).

<a id="bib.bib65"></a>

- Schmid (2021) Martin Schmid. Search in imperfect information games. *arXiv preprint arXiv:2111.05884*, 2021.

<a id="bib.bib66"></a>

- Schmid et al. (2023) Martin Schmid, Matej Moravčík, Neil Burch, Rudolf Kadlec, Josh Davidson, Kevin Waugh, Nolan Bard, Finbarr Timbers, Marc Lanctot, G Zacharias Holland, et al. Student of games: A unified learning algorithm for both perfect and imperfect information games. *Science Advances*, 9(46):eadg3256, 2023.

<a id="bib.bib67"></a>

- Schrittwieser et al. (2020) Julian Schrittwieser, Ioannis Antonoglou, Thomas Hubert, Karen Simonyan, Laurent Sifre, Simon Schmitt, Arthur Guez, Edward Lockhart, Demis Hassabis, Thore Graepel, et al. Mastering atari, go, chess and shogi by planning with a learned model. *Nature*, 588(7839):604–609, 2020.

<a id="bib.bib68"></a>

- Schulman et al. (2017) John Schulman, Filip Wolski, Prafulla Dhariwal, Alec Radford, and Oleg Klimov. Proximal policy optimization algorithms. *arXiv preprint arXiv:1707.06347*, 2017.

<a id="bib.bib69"></a>

- Shleifer et al. (2021) Sam Shleifer, Jason Weston, and Myle Ott. Normformer: Improved transformer pretraining with extra normalization. *arXiv preprint arXiv:2110.09456*, 2021.

<a id="bib.bib70"></a>

- Silver et al. (2016) David Silver, Aja Huang, Chris J Maddison, Arthur Guez, Laurent Sifre, George Van Den Driessche, Julian Schrittwieser, Ioannis Antonoglou, Veda Panneershelvam, Marc Lanctot, et al. Mastering the game of go with deep neural networks and tree search. *nature*, 529(7587):484–489, 2016.

<a id="bib.bib71"></a>

- Silver et al. (2018) David Silver, Thomas Hubert, Julian Schrittwieser, Ioannis Antonoglou, Matthew Lai, Arthur Guez, Marc Lanctot, Laurent Sifre, Dharshan Kumaran, Thore Graepel, et al. A general reinforcement learning algorithm that masters chess, shogi, and go through self-play. *Science*, 362(6419):1140–1144, 2018.

<a id="bib.bib72"></a>

- Springenberg et al. (2024) Jost Tobias Springenberg, Abbas Abdolmaleki, Jingwei Zhang, Oliver Groth, Michael Bloesch, Thomas Lampe, Philemon Brakel, Sarah Bechtle, Steven Kapturowski, Roland Hafner, et al. Offline actor-critic reinforcement learning scales to large models. *arXiv preprint arXiv:2402.05546*, 2024.

<a id="bib.bib73"></a>

- Stone (2010) David Stone, 2010. URL [https://github.com/davidstone/technical-machine](https://github.com/davidstone/technical-machine).

<a id="bib.bib74"></a>

- Tesauro (1995) Gerald Tesauro. Temporal difference learning and td-gammon. *Commun. ACM*, 38(3):58–68, March 1995. ISSN 0001-0782. DOI: 10.1145/203330.203343. URL [https://doi.org/10.1145/203330.203343](https://doi.org/10.1145/203330.203343).

<a id="bib.bib75"></a>

- Tirumala et al. (2023) Dhruva Tirumala, Thomas Lampe, Jose Enrique Chen, Tuomas Haarnoja, Sandy Huang, Guy Lever, Ben Moran, Tim Hertweck, Leonard Hasenclever, Martin Riedmiller, et al. Replay across experiments: A natural extension of off-policy rl. *arXiv preprint arXiv:2311.15951*, 2023.

<a id="bib.bib76"></a>

- Vaswani et al. (2017) Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N Gomez, Łukasz Kaiser, and Illia Polosukhin. Attention is all you need. *Advances in neural information processing systems*, 30, 2017.

<a id="bib.bib77"></a>

- Vinyals et al. (2019) Oriol Vinyals, Igor Babuschkin, Wojciech M Czarnecki, Michaël Mathieu, Andrew Dudzik, Junyoung Chung, David H Choi, Richard Powell, Timo Ewalds, Petko Georgiev, et al. Grandmaster level in starcraft ii using multi-agent reinforcement learning. *Nature*, 575(7782):350–354, 2019.

<a id="bib.bib78"></a>

- Wang et al. (2016) Jane X Wang, Zeb Kurth-Nelson, Dhruva Tirumala, Hubert Soyer, Joel Z Leibo, Remi Munos, Charles Blundell, Dharshan Kumaran, and Matt Botvinick. Learning to reinforcement learn. *arXiv preprint arXiv:1611.05763*, 2016.

<a id="bib.bib79"></a>

- Wang (2024) Jett Wang. Winning at pokémon random battles using reinforcement learning. Master of engineering thesis, Massachusetts Institute of Technology, Cambridge, MA, February 2024. Submitted to the Department of Electrical Engineering and Computer Science.

<a id="bib.bib80"></a>

- Wang et al. (2020) Ziyu Wang, Alexander Novikov, Konrad Zolna, Josh S Merel, Jost Tobias Springenberg, Scott E Reed, Bobak Shahriari, Noah Siegel, Caglar Gulcehre, Nicolas Heess, et al. Critic regularized regression. *Advances in Neural Information Processing Systems*, 33:7768–7778, 2020.

<a id="bib.bib81"></a>

- Wu et al. (2019) Yifan Wu, George Tucker, and Ofir Nachum. Behavior regularized offline reinforcement learning. *arXiv preprint arXiv:1911.11361*, 2019.

<a id="bib.bib82"></a>

- Zhai et al. (2023) Shuangfei Zhai, Tatiana Likhomanenko, Etai Littwin, Dan Busbridge, Jason Ramapuram, Yizhe Zhang, Jiatao Gu, and Joshua M Susskind. Stabilizing transformer training by preventing attention entropy collapse. In *International Conference on Machine Learning*, pp. 40770–40803. PMLR, 2023.

<a id="bib.bib83"></a>

- Zhang et al. (2023) Alex Zhang, Ananya Parashar, and Dwaipayan Saha. A simple framework for intrinsic reward-shaping for rl using llm feedback. 2023. URL [https://alexzhang13.github.io/assets/pdfs/Reward_Shaping_LLM.pdf](https://alexzhang13.github.io/assets/pdfs/Reward_Shaping_LLM.pdf).

<a id="bib.bib84"></a>

- Zintgraf et al. (2021a) Luisa Zintgraf, Sam Devlin, Kamil Ciosek, Shimon Whiteson, and Katja Hofmann. Deep interactive bayesian reinforcement learning via meta-learning. In *Proceedings of the 20th International Conference on Autonomous Agents and MultiAgent Systems*, pp. 1712–1714, 2021a.

<a id="bib.bib85"></a>

- Zintgraf et al. (2021b) Luisa Zintgraf, Sebastian Schulze, Cong Lu, Leo Feng, Maximilian Igl, Kyriacos Shiarlis, Yarin Gal, Katja Hofmann, and Shimon Whiteson. Varibad: Variational bayes-adaptive deep rl via meta-learning. *Journal of Machine Learning Research*, 22(289):1–39, 2021b.

<a id="A1"></a>

## 附录 A 宝可梦竞技中的 AI

<a id="A1.SS1"></a>

### A.1 在线树搜索

<!-- source:A1.SS1.p1.1 -->

许多 CPS 人工智能方法依赖于基于模型的在线树搜索，并使用启发式价值近似，类似于国际象棋、围棋等游戏中早期取得成功的方法。[Harrison Ho（2014）](#bib.bib26) 使用浅层搜索，基本忽略不完全信息，在 Gen6RandomBattles 中达到了 55$\%$ GXE。最优秀的启发式宝可梦引擎利用 PS 的队伍配置统计数据，估计当前根节点处的私有信息，将 CPS 转化为完全信息下的深度受限搜索问题（[Stone，2010](#bib.bib73)）。[Sarantinos（2023）](#bib.bib64) 引入了更复杂的启发式价值函数、搜索剪枝和私有信息推断，在 Gen7RandomBattles 中最高达到第 $33$ 名。[Sarantinos（2023）](#bib.bib64) 与人类进行的对战数量，与我们每个主要模型相当（$600+$ 场）。不过，该研究只评估了单个规则集中的单个策略，因此有效样本量较大，清楚地展示了 PS 的 ELO 和世界排名指标的极大方差。该研究没有报告 Glicko-1 和 GXE，但这两项指标更为合适，我们鼓励未来的比较采用它们。依据早期论坛帖中的结果、多年来的持续开发，以及我们对其方法细节和功能覆盖范围相较于竞争对手的了解，Foul Play（[Mariglia，2019](#bib.bib48)）是目前最强的开源引擎。

<a id="A1.SS2"></a>

### A.2 强化学习与自我对弈

<!-- source:A1.SS2.p1.1 -->

[Kalose 等（2018）](#bib.bib34) 在简化版 CPS 中评估了小规模 Q 学习，让智能体与随机智能体和采用极小极大策略的启发式智能体对战，但成效有限。已有研究采用在线自我对弈流程，通过与自身策略对战来收集同策略数据（on-policy data）。[Huang 和 Lee（2019）](#bib.bib30) 训练了不使用树搜索的 PPO（[Schulman 等，2017](#bib.bib68)）自我对弈智能体，在 Gen7RandomBattle 的 Pokémon Showdown 天梯上达到了 1677 Glicko-1 和 72% GXE。[Wang（2024）](#bib.bib79) 在测试时为 PPO 引入 MCTS，在 Gen4RandomBattle 天梯上达到了 1756 Glicko-1 和 79.5% GXE。

<a id="A1.F15"></a>

<!-- source:A1.F15 -->

![A1.F15.g1](/images/human-level-pokemon/offline_metamon_diagram2.svg)

图 15：**创建离线 `poke-env` 数据集。** 我们的离线回放重建流程通过自定义实现来解析 PS 回放；该实现专为解析历史回放、提供比 PS 回放查看器更完善的队伍推断，以及诊断失败原因而设计。随后，生成的轨迹被转换为一种同样可以从在线 `poke-env` 接口中获得的表示。

<!-- source:A1.SS2.p2.1 -->

[Lee 和 Togelius（2017）](#bib.bib44) 提出，将 CPS 和 Pokémon Showdown 作为 AI 研究的重要基准。`poke-env`（[Sahovic，2020](#bib.bib62)）大幅降低了研究 PS 的门槛，已成为近期研究的默认选择，包括我们的工作，以及附录 [A.3](#A1.SS3) 中的研究。我们发布的 `Metamon` 旨在打通学术强化学习研究与 PS 之间的最后一环：我们采用面向早期世代定制的 `poke-env` 版本，并增加了 1）一组额外的基线对手，2）标准化队伍集，3）BC 实验模板，以及 4）对大规模强化学习训练的直接兼容（[Grigsby 等，2024a](#bib.bib22)）。第五项，也是最重要的一项，是通过复杂的重建流程创建 PS 回放数据集（第 [3](#S3) 节）。从用户的角度看，我们的数据集似乎提供了通过 `poke-env` 记录的人类对战离线轨迹。在测试时，则使用在线 `poke-env` 接口，与其他智能体以及公共天梯上的人类玩家对战。然而，这种兼容性只是表象，其实现依赖于弥合我们自己的回放解析器与 `poke-env` 之间的仿真系统差距（sim2sim gap；图 [15](#A1.F15)）。更多讨论见附录 [D](#A4)。

<a id="A1.SS3"></a>

### A.3 大语言模型智能体

<!-- source:A1.SS3.p1.1 -->

宝可梦在网络上积累的丰富信息，使大语言模型（LLM）能够根据宝可梦游戏状态采取行动；这些状态包含大量可用自然语言表示的类别变量。PokéLLMon（[Hu 等，2024](#bib.bib29)）以历史观测、动作及回合结果作为 LLM 的条件输入，以选择下一步动作。它还从宝可梦知识库中检索信息，采用检索增强生成（retrieval-augmented generation）来辅助 LLM 决策。PokéLLMon 在 Gen8RandomBattles 的 Pokémon Showdown 天梯上取得了 49% 的胜率，但没有报告能控制匹配偏差的 Glicko-1 或 GXE 统计值。需要注意，在现代世代的 Pokémon Showdown 天梯上，庞大的玩家群体使得实力相当的匹配成为可能；除非远低于人类水平，否则预期原始胜率为 $\approx\hskip-2.84526pt50\%$。[Karten 等（2025）](#bib.bib35) 扩展了 LLM 提示方案，对对手决策进行建模，并利用启发式价值函数实现深度受限搜索。提示中包含招式伤害计算等信息，让未来的结果预测能够指导动作选择。Pokéchamp 的规划能力使其在 Gen8RandomBattles 和 Gen9OU 中对战 PokéLLMon 时达到了 $76\%$ 的胜率。Pokéchamp 是同期工作，要将其基于模型的搜索适配到早期世代的游戏机制，需要进行相当多的修改。最后，[Zhang 等（2023）](#bib.bib83) 利用 LLM 设计奖励，提升了 DQN（[Mnih 等，2015](#bib.bib50)）对战启发式对手时的样本效率。

<a id="A2"></a>

## 附录 B 更广泛的相关工作

<!-- source:A2.p1.1 -->

**模仿学习与离线强化学习。** 复杂领域中的许多大规模智能体都通过模仿学习训练。这些方法重点在于利用大规模数据集训练可扩展的序列模型，同时避开强化学习面临的障碍（[Reed 等，2022](#bib.bib59)；[Gallouédec 等，2024](#bib.bib19)；[Jiang 等，2022](#bib.bib32)；[Raad 等，2024](#bib.bib58)；[Brohan 等，2023](#bib.bib5)）。离线强化学习（[Prudencio 等，2023](#bib.bib57)；[Levine 等，2020](#bib.bib45)）能够学到表现优于示范数据的策略，也已在大规模应用中取得成功（[Kumar 等，2022](#bib.bib39)；[Springenberg 等，2024](#bib.bib72)）。在实践中，离线强化学习可用于高度离策略（way-off-policy）或多批次场景（[Laroche 和 des Combes，2019](#bib.bib42)；[Najib 等，2024](#bib.bib53)）：随着数据不断积累，或发现更好的训练技术，模型可以反复重新训练或微调（[Lampe 等，2024](#bib.bib40)；[Tirumala 等，2023](#bib.bib75)）。从质量参差不齐的大规模数据集中学习稳定策略的能力，使工程流程更加灵活。许多方法会阻止学到的策略过度偏离离线数据集（[Wang 等，2020](#bib.bib80)；[Nair 等，2020](#bib.bib52)；[Fujimoto 和 Gu，2021](#bib.bib18)）。这些方法在不受约束的强化学习与行为克隆之间形成了一个连续谱，能够用单一目标替代“BC 预训练 $\rightarrow$ RL 微调”的两阶段流程。

<!-- source:A2.p2.1 -->

离线强化学习面向两类现实应用情境：（1）数据收集成本高昂；（2）部署要求达到某个最低性能标准，而这一标准远高于随机探索的表现。与人类进行宝可梦对战同时面临这两个问题：对战耗时较长，而且可并行进行的对战数量也有限；在所有宝可梦队伍和游戏模式中找到有效策略，又是一项艰巨的探索挑战。在强化学习仿真领域，一种常见做法是先训练在线强化学习智能体，再保存其运行轨迹供离线研究使用，以此模拟从已有数据中学习的过程（[Reed 等，2022](#bib.bib59)；[Fu 等，2020](#bib.bib17)；[Gulcehre 等，2020](#bib.bib24)；[Agarwal 等，2020](#bib.bib1)）。如果在线强化学习无法解决任务，也可以通过众包收集示范数据集（[O’Neill 等，2024](#bib.bib55)；[Gerstgrasser 等，2022](#bib.bib20)）。如果离线数据集原本就已存在，而且能够自然增长，无需研究者专门收集数据，那么这种情境会更贴近现实，也更方便。我们的宝可梦数据集就属于这一类，其他在互联网上进行的游戏也如此，包括国际象棋（[Lichess，2025](#bib.bib47)）、围棋（[KGS，2025](#bib.bib36)；[Silver 等，2016](#bib.bib70)）、Diplomacy（[FAIR Diplomacy Team 等，2022](#bib.bib15)）和 StarCraft II（[Vinyals 等，2019](#bib.bib77)；[Mathieu 等，2023](#bib.bib49)）。其他例子还包括自动驾驶（[Kiran 等，2021](#bib.bib37)；[Lee 等，2024](#bib.bib43)）和电子商务（[Saito 等，2020](#bib.bib63)）。

<!-- source:A2.p3.1 -->

**游戏智能体。** 游戏一直是人工智能与强化学习研究的重要基准（[Campbell 等，2002](#bib.bib9)；[Tesauro，1995](#bib.bib74)）。广受关注的成功案例包括国际象棋和围棋中的 AlphaZero（[Silver 等，2018](#bib.bib71)）、StarCraft II 中的 AlphaStar（[Vinyals 等，2019](#bib.bib77)）、DOTA 2 中的 OpenAI Five（[Berner 等，2019](#bib.bib4)），以及 Stratego 中的 DeepNash（[Perolat 等，2022](#bib.bib56)）。将基于模型的搜索用于扑克等不完全信息博弈（imperfect information games，IIG）（[Moravčík 等，2017](#bib.bib51)；[Brown 和 Sandholm，2018](#bib.bib6)；[Brown 等，2020](#bib.bib7)），催生了结合强化学习与博弈论的方法。感兴趣的读者可参考 [Schmid 等 （2023）](#bib.bib66) 中的详细综述。CPS 中的策略学习（第 [4](#S4) 节）也可以从因子化观测随机博弈（Factored Observation Stochastic Games）等 IIG 形式化框架的角度理解（[Schmid，2021](#bib.bib65)）。与混合对手智能体群体对战的无模型强化学习是一种可行的替代方案，尽管它缺乏收敛到最优（均衡）策略的理论保证（[Vinyals 等，2019](#bib.bib77)；[Rudolph 等，2025](#bib.bib61)；[Heinrich 等，2015](#bib.bib27)）。最后，长上下文序列模型也已被用于建模对手的决策（[Nashed 和 Zilberstein，2022](#bib.bib54)），应用场景包括多智能体环境（[Jing 等，2024](#bib.bib33)）。

<a id="A3"></a>

## 附录 C 启发式对手

<!-- source:A3.p1.1 -->

为了评估宝可梦对战中的多种基本能力，我们开发了一组启发式对手。这些策略不能通过获取对手队伍尚未公开的信息作弊，但除此之外，可以利用宝可梦机制的准确知识来选择动作。图 [17](#A3.F17)（**译注：这里对应的循环赛图注为图 16。**）汇总了这些启发式策略的相对表现。最终，我们发现很难从这个较大的策略集合中获得有意义的多样性，因此将重点放在以下六种启发式策略上：

- <!-- source:A3.I1.i1.p1.1 -->

  **RandomBaseline** 在合法招式（或换人选项）中均匀随机选择，用于衡量训练初期最基本的学习水平。

- <!-- source:A3.I2.i1.p1.1 -->

  **Gen1BossAI** 模仿最初的第一世代宝可梦游戏中对手的决策方式。它通常随机选择招式，但在第二回合会优先选择提升能力值的招式；如果有“效果绝佳”的招式，也会优先使用。

- <!-- source:A3.I2.i2.p1.1 -->

  **Grunt** 极度偏重进攻。它利用宝可梦的伤害公式和属性相克表，选择对当前敌方宝可梦造成伤害最大的招式；被迫换人时，则按属性关系选择对位最有利的宝可梦。这一策略相当于贪心的单层搜索，比相关工作中常见的“MaxBasePower”智能体有所改进。

- <!-- source:A3.I2.i3.p1.1 -->

  **GymLeader** 在 Grunt 的基础上进一步考虑生命值等因素。当前宝可梦生命值很高时，它优先提升能力值；生命值低时，则优先使用回复招式。

- <!-- source:A3.I2.i4.p1.1 -->

  **PokeEnv** 是 [Sahovic （2020）](#bib.bib62) 提供的 `SimpleHeuristicsPlayer` 基线。

- <!-- source:A3.I2.i5.p1.1 -->

  **EmeraldKaizo** 改编自一款宝可梦《绿宝石》ROM 改版中的 AI，该改版旨在尽可能提高游戏难度。由于它在网上广受欢迎，社区已对其决策方式进行了极为详尽的整理。我们根据这些文档重新实现了该策略。它按照一套规则为可选动作打分，再据此选择动作；这套规则针对游戏中的大量招式包含了手工编写的条件判断。

<!-- source:A3.p3.1 -->

图 [17](#A3.F17) 评估了 PokeEnv 启发式策略在天梯上对战人类的表现。我们选择 PokeEnv 进行这项评估，是因为其他研究也使用了它，不过它的优缺点与我们策略集合中的其他几种启发式策略相近。我们采用了与主要模型评估相同的竞技队伍集（Competitive Set），但每个规则集的评估对战样本更少。熟悉 PS 对战环境的人，可以预见图 [17](#A3.F17) 中对战赛制与启发式策略表现之间的关系。玩家在在线聊天中正确指出该启发式策略是机器人，我们认为已经说明了问题，便停止了评估。值得注意的是，玩家作出这一判断，并不是因为策略的反应速度超越人类，而是因为它缺乏招式选择的多样性和跨多个回合的策略，而且水平较低，符合人们对业余机器人项目和宝可梦电子游戏的惯常预期。我们基于学习的智能体没有这些问题，附录 [F](#A6) 会再次讨论这一点。我们预计，这一启发式策略在 Gen2OU 中的表现最差，也最不像人类，但我们不愿开展这项评估。当评分远低于平均水平时，Glicko-1 评分可能收敛缓慢，因此图 [17](#A3.F17) 可能高估了表现。不过，低评分使匹配机制对我们有利：我们会匹配到 ELO 最低的玩家。因此，这是少数可以用原始胜负记录来判断胜率上界的情形（表 [2](#A3.T2)）。

<a id="A3.F17"></a>

<!-- source:A3.F17 -->

<a id="A3.F17.fig1"></a>

<!-- source:A3.F17.fig1 -->

![A3.F17.g1](/images/human-level-pokemon/win_rate_heatmap-6.png)

图 16：**启发式策略循环赛。** 各单元格表示行对应的策略对战列对应的策略时的胜率，评估使用 Gen1-4OU 中的 $2$k 场多样化队伍集（Variety Set）对战。

<a id="A3.F17.fig2"></a>

<!-- source:A3.F17.fig2 -->

![A3.F17.g2](/images/human-level-pokemon/basic_heuristic_ratings.svg)

图 17：**PokeEnv 启发式策略对战人类。** 早期世代的 OU 分级具有独特的玩法，比起记忆宝可梦之间的伤害对位关系，它们更强调长跨度的队伍操控。

<a id="A3.T2"></a>

<!-- source:A3.T2 -->

| **对战赛制** | **胜场** | **负场** |
| --- | --- | --- |
| Gen1OU | 16 | 59 |
| Gen3OU | 16 | 54 |
| Gen4OU | 21 | 36 |
| Gen7RandomBattle | 24 | 32 |
| Gen9RandomBattle | 28 | 32 |

表 2：**PokeEnv 启发式策略在 PS 天梯上的胜负记录。**

<a id="A4"></a>

## 附录 D 回放重建

<!-- source:A4.p1.1 -->

如附录 [A.2](#A1.SS2) 所述，我们构建了一套定制的回放重建流程，用于解析多年前的人类对战记录，并从观战者视角（point-of-view，POV）识别队伍。生成的轨迹用于训练离线策略，随后可以通过 `poke-env` 在线部署（[Sahovic，2020](#bib.bib62)）。

<!-- source:A4.p2.1 -->

我们按照图 [18](#A4.F18) 中简化示例所展示的流程，提取完整的对战信息。每个回合，我们都把新公开的信息加入对初始队伍配置的持续估计中。对战结束时，某些细节可能仍然缺失，我们就利用 Pokémon Showdown 的统计数据进行推断。随后，我们沿轨迹回填推断出的队伍，同时考虑对战过程中队伍成员发生的任何变化。玩家 A 应当完全了解自己的队伍，却只能有限地了解玩家 B 的队伍，因此，我们将玩家 A 的私有状态推断结果，与玩家 B 状态的原始观战者视角相结合，保存一条玩家 A 视角的轨迹。

<a id="A4.F18"></a>

<!-- source:A4.F18 -->

![A4.F18.g1](/images/human-level-pokemon/replay_reconstruction_example.png)

图 18：**简化的回放重建。** 我们以双方队伍各有 $3$ 只宝可梦的 Gen1OU 对战为例，逐步展示如何重建玩家 A 的视角。

<!-- source:A4.p3.1 -->

重建过程中，我们会获得：（1）每位玩家的完整队伍配置；（2）某位玩家视角下逐回合的观测。我们可以用一场真实对战作为示例。你可以[通过此链接](https://replay.pokemonshowdown.com/gen4nu-776588848)查看回放。图 [21](#A4.F21) 展示了这场回放的原始 PS 日志样本，图 [22](#A4.F22) 展示了选定视角玩家的已观测队伍与推断队伍。最后，图 [23](#A4.F23) 展示了完整重建后的回放，其中包含模型训练所需的全部信息。

<a id="A4.SS1"></a>

### D.1 重建失败

<!-- source:A4.SS1.p1.1 -->

回放重建面临的一项挑战是，队伍推断不准确会导致人类决策记录失真：一位高手之所以选择回放中的那个动作，可能正是因为他*并没有*数据集中认定他拥有的招式或宝可梦。这是观战者视角带来的根本问题，不过，采用比从历史统计数据中采样更复杂的队伍推断策略，或许能够改善它。

<a id="A4.F19"></a>

<!-- source:A4.F19 -->

![A4.F19.g1](/images/human-level-pokemon/state_space_holes_png.png)

图 19：**回放解析器失败的状态。** 这一示意图展示了：除了离线强化学习通常固有的分布偏移，回放重建过程还会在数据集中造成空缺。

<!-- source:A4.SS1.p2.1 -->

离线强化学习始终要面对分布偏移问题，因为它从庞大的状态／动作空间中采样出的数据集是有限的（[Levine 等，2020](#bib.bib45)）。回放重建可能失败，而这些失败又带来了额外挑战：无论数据集有多大，某些特定的状态／动作都永远不会出现（图 [19](#A4.F19)）。有些失败源于尚未实现的罕见游戏机制，这部分可以改进。另一些则源于从观战者视角根本无法明确判断的情形，甚至 PS 的浏览器回放播放器也会处理错误，或提示数值可能不准确。重建流程各处设置了一长串检查，试图找出并丢弃包含这些状态的轨迹。这些情形很少见，丢弃它们可能过于谨慎。

<!-- source:A4.SS1.p3.1 -->

回放数据集中有两类空缺不容忽视。我们采取的解决方案会影响研究结果，值得详细讨论：

<!-- source:A4.SS1.p4.1 -->

**非法动作。** 宝可梦对战始终*最多*有 $9$ 个离散动作，但随着对战进行，其中某些动作会变得无效。人类玩家无法选择无效动作，因此这些动作从不出现在数据集中。离线强化学习应当能够处理这一问题。我们明确告知策略哪些动作无效，并让其犯错成为分布外（OOD）行为不断累积的指标（原注：作为参考，所有 RL 策略对战启发式策略时，平均有效动作比例为 $97$-$99\%$；对战人类时为 $95$-$98\%$。几乎所有无效动作都集中出现在策略已陷入败局，或遇到附录 [E.1](#A5.SS1)（**译注：相关观测空间及 PP 限制内容实际见 E.2。**）所讨论的观测空间局限之后，并且连续发生）。如果策略选中无效动作，我们就向 PS 发送一个随机有效动作。本文实验完成很久之后，我们才在开源版本中加入无效动作掩码。正如预期，仅在测试时启用它几乎没有影响，不过，在训练时使用它可能改善价值估计。

<a id="A4.F20"></a>

<!-- source:A4.F20 -->

![A4.F20.g1](/images/human-level-pokemon/heuristic_filled_action_comparison_fixed.svg)

图 20：**改进缺失动作标签对 $15$M 参数 Transformer IL 策略的影响。**

<!-- source:A4.SS1.p5.1 -->

**（因随机机制而）未公开的招式。** 在某些情形下，玩家选择的动作不会影响对战，也不会向观战者公开。它们出现得太频繁，无法直接丢弃对应轨迹，因此我们必须屏蔽或填补动作标签。BC-RNN 基线（附录 [F.1](#A6.SS1)）会*屏蔽*未公开的动作标签。沿完整轨迹序列并行训练离线强化学习时，如果某个时间步的策略网络或价值网络未经训练，再使用该时间步的 Q 值构造时序差分更新目标会有风险。因此，RL 模型会*填补*动作标签，主要的 Transformer BC 模型也采用同样做法，以便直接比较策略网络目标的不同变体（式（[2](#S4.E2)））。最初，我们用一个在很早版本的数据集上训练的小型 BC-RNN 模型填补缺失动作。由于这些招式没有影响对战，其准确程度似乎并不重要。不过，在某些随机游戏机制下，主要是睡眠和麻痹，它们本来*可能*影响对战。后来，我们开始认为，改用更准确的 BaseRNN 模型（图 [27](#A6.F27)）填补缺失动作，或许能够改善效果。我们在这个修订版数据集（“Filled Action”，即填补动作标签版）上重新训练了 $15$M 参数的 IL 和 RL Transformer 策略。离线强化学习本应已经能在动作选择确实有影响的情形下避免次优选择。事实上，我们没有发现新动作标签影响 RL 策略的证据。不过，Small IL 模型显著改善：无论对战启发式策略（图 [20](#A4.F20) 左）还是 BC-RNN（图 [20](#A4.F20) 右），它的评估得分现在都*介于* Large IL 和 RL 之间。虽然图中没有展示，但在对战 Large IL（图 [9](#S5.F9)）和 Foul Play 引擎（图 [11(a)](#S5.F11.sf1)）时，采用填补动作标签的 Small IL，其得分也介于 Large IL 与所有 RL 模型之间。

<!-- source:A4.SS1.p6.1 -->

我们由此得出结论：IL 与 RL 的比较仍然是同一架构在同一数据集上训练后的公平评估，但原始数据集无意中引入了一种挑战，类似于人为构造的基准——用糟糕决策掺杂高质量示范（[Fu 等，2020](#bib.bib17)）。出于谨慎，我们最后一批 RL 模型（SynRL-V1+SP、SynRL-V1++ 和 SynRL-V2）在人类对战轨迹中采用了改进后的标签。论文发布后，我们直接在 RL 训练流程中加入缺失动作掩码，结果相近。

<a id="A4.F21"></a>

<!-- source:A4.F21 -->

![A4.F21.g1](/images/human-level-pokemon/raw_replay_example.svg)

图 21：从 PS 服务器下载的第四世代 NeverUsed（NU）回放文件示例。

<a id="A4.F22"></a>

<!-- source:A4.F22 -->

![A4.F22.g1](/images/human-level-pokemon/reconstructed_team_example.png)

图 22：延续第四世代 NU 示例，列出回放重建后的已观测队伍和推断队伍。

<a id="A4.F23"></a>

<!-- source:A4.F23 -->

![A4.F23.g1](/images/human-level-pokemon/reconstructed_replay_example.svg)

图 23：以重建回放的节选结束第四世代 NU 示例。

<a id="A5"></a>

## 附录 E 训练细节

<a id="A5.SS1"></a>

### E.1 奖励函数

<!-- source:A5.SS1.p1.1 -->

奖励由三个塑形项和一个二值胜负指标（$r_{\text{win}}$）组合而成：

<!-- source:A5.EGx3 -->

<a id="A5.Ex1"></a>

$$
\displaystyle R(s_{t},a_{t})=r_{\text{hp}}+\frac{1}{2}r_{\text{{stat}}}+r_{\text{faint}}+100r_{\text{win}}
$$

<!-- source:A5.SS1.p3.1 -->

以下从智能体所控制玩家的视角描述各塑形项：

- <!-- source:A5.I1.i1.p1.1 -->

  **生命值奖励 $r_{\text{hp}}$：** 鼓励造成比对手更多的伤害，和／或回复比对手更多的生命值。通过比较我方当前宝可梦与敌方当前宝可梦的生命值净增减量计算，所有生命值都归一化到 $0-1$。

- <!-- source:A5.I1.i2.p1.1 -->

  **异常状态奖励 $r_{\text{stat}}$：** 鼓励给对手施加异常状态，同时避免我方陷入异常状态。异常状态是衡量中盘进展的重要指标。根据场上两只宝可梦是否处于异常状态的二值指标净变化计算。

- <!-- source:A5.I1.i3.p1.1 -->

  **击倒奖励 $r_{\text{faint}}$：** 鼓励击倒敌方宝可梦，同时保全我方宝可梦。计算方式为本回合使对手无法再使用的宝可梦数量，减去我方失去的宝可梦数量。

<!-- source:A5.SS1.p5.1 -->

奖励函数提供一定程度的塑形，帮助离线筛选机制 $w$（式（[2](#S4.E2)））学会在短跨度内分配有区分度的权重，但最终起主导作用的仍是我们真正关注的二值胜负结果。我们确实观察到了一些模型利用塑形项的定性迹象。例如，我们的智能体在明显的败局中往往仍会使用回复招式，尽力维持存活。

<a id="A5.SS2"></a>

### E.2 观测空间

<!-- source:A5.SS2.p1.1 -->

观测包括一段语言描述（如图 [5](#S4.F5) 所示）和 $48$ 个数值特征。数值特征包括招式的基础威力与命中率，以及宝可梦的生命值、能力值和能力提升。完整说明请参阅开源版本。在具体实现中，我们还将上一动作和奖励加入策略输入。奖励可能有助于消除对上一回合结果的某些歧义，例如招式是否命中并造成伤害。玩家的上一动作表示为独热向量，其大部分内容与文本观测中的信息重复，但它有助于记录那些未向对手公开的动作选择历史。

<!-- source:A5.SS2.p2.1 -->

我们的观测空间依靠长期记忆跟踪对战的真实状态。第 [4](#S4) 节指出，我们只包含敌方当前宝可梦的可见属性，这样可以降低维度，也减少对手队伍带来的分布偏移。记住先前回合中出场的宝可梦及其招式选择，就可以推断对手队伍的公开状态。文本词元包含场上双方宝可梦最近使用的招式。总体而言，我们模型的长期记忆十分有效。例如，PS 强制执行一条称为“催眠条款”（Sleep Clause）的规则：尝试让对手第二只宝可梦陷入睡眠不会产生效果，只会白白浪费一回合。我们的策略遵守这条规则的能力相当出色，尽管它们唯一的跟踪方式，就是记住自己曾让一只宝可梦陷入睡眠，而且这只宝可梦此后还未再次出场并醒来。

<!-- source:A5.SS2.p3.1 -->

宝可梦在一场对战中使用每个招式的次数都有上限。这些“招式点数”（Power Points，PP）限制能够打破 CPS 中长时间的僵局，但回放中的 PP 计数不可靠，而且存在许多边界情况。虽然重建时会跟踪 PP 计数，以帮助筛除回放，但我们最终没有将其纳入观测空间。我们决定防范仿真系统之间的差距，因为当时认为，智能体必须强到不现实的程度，才能坚持足够久，让 PP 限制变得重要。事实上，最终策略已经足够强，因 PP 消耗战而落败成了它们最明显的缺点，也是选出无效动作的首要原因（附录 [D.1](#A4.SS1)）。根据招式使用历史的记忆，可以推断 PP 计数，但实践中很难做到，尤其是自我对弈中缺乏会迫使其进入 PP 消耗战的对手策略时。SynRL-V2 确实展现出了一定的应对 PP 限制的能力。

<!-- source:A5.SS2.p4.1 -->

观测空间可以针对具体游戏机制加以改进，后续也会通过版本控制便于比较。不过，像 CPS 这样复杂的环境总会存在细微的部分可观测性问题，而序列模型策略的灵活性有助于应对这些问题。

<a id="A5.SS3"></a>

### E.3 动作空间

<!-- source:A5.SS3.p1.1 -->

智能体使用 $9$ 个离散动作进行对战。前四个索引对应当前宝可梦的招式，其余索引对应换上玩家队伍中的其他宝可梦。文本观测和数值观测都会标明动作索引与招式／换人选项之间的对应关系，两者的特征都按一致的字母顺序排列。如附录 [D.1](#A4.SS1) 所述，随着对战进行，一些动作会变得无效。观测中也会标明无效动作。如果智能体选择无效动作，环境的转移动态就会将其替换为一个随机有效动作。

<a id="A5.SS4"></a>

### E.4 模型与超参数

<!-- source:A5.SS4.p1.1 -->

表 [3](#A5.T3) 详细列出了小型（Small，$15$M）、中型（Medium，$50$M）和大型（Large，$200$M）模型的默认训练配置。表 [4](#A5.T4) 列出了本文提及并在开源代码中发布的所有模型与消融实验相对于默认配置的改动。

<a id="A5.T3"></a>

<!-- source:A5.T3 -->

|  | **小型（Small）** | **中型（Medium）** | **大型（Large）** |
| --- | --- | --- | --- |
| 学习率 | 1e-4 | 1e-4 | 1e-4 |
| 学习率线性预热步数 | 1000 | 1000 | 1000 |
| 目标价值网络 $\tau$ | 0.004 | 0.004 | 0.004 |
| TD 损失系数 | 10 | 10 | 10 |
| 梯度裁剪阈值 | 1.5 | 1.5 | 1.5 |
| L2 系数 | 1e-4 | 1e-4 | 1e-4 |
| 批大小 | 32 | 40 | 48 |
| 策略网络激活函数 | Leaky ReLU | Leaky ReLU | Leaky ReLU |
| 策略网络层数 | 2 | 2 | 2 |
| 策略网络隐藏维度 | 300 | 400 | 512 |
| 智能体 Popart（[Hessel 等，2019](#bib.bib28)） | True | True | True |
| 价值网络集成规模（[Chen 等，2021](#bib.bib10)） | 4 | 4 | 4 |
| 价值网络层数 | 2 | 2 | 2 |
| 价值网络激活函数 | Leaky ReLU | Leaky ReLU | Leaky ReLU |
| 价值网络隐藏维度 | 300 | 400 | 512 |
| 回合编码器 词元 维度 | 100 | 100 | 160 |
| 回合编码器层数 | 3 | 3 | 5 |
| 回合编码器汇总词元 数量 | 4 | 6 | 11 |
| 回合编码器注意力头数 | 5 | 5 | 8 |
| 回合编码器数值 词元 数量 | 6 | 6 | 6 |
| 因果 Transformer 层数 | 3 | 6 | 9 |
| 因果 Transformer 注意力头数 | 8 | 8 | 20 |
| 因果 Transformer 前馈层维度 | 2048 | 3072 | 5120 |
| 因果 Transformer 模型维度 | 512 | 768 | 1280 |
| NormFormer（[Shleifer 等，2021](#bib.bib69)） | True | True | True |
| $\sigma$Reparam（[Zhai 等，2023](#bib.bib82)） | True | True | True |
| 因果 Transformer 归一化 | LayerNorm ([Ba 等，2016](#bib.bib2)) | LayerNorm ([Ba 等，2016](#bib.bib2)) | LayerNorm ([Ba 等，2016](#bib.bib2)) |
| 最大上下文长度 | 200 | 200 | 128 |
| 因果 Transformer 激活函数 | Leaky ReLU | Leaky ReLU | Leaky ReLU |

表 3：**不同模型规模的基础训练超参数。** 对应图 [4](#S4.F4) 中的架构及 AMAGO 的训练配置（[Grigsby 等，2024a](#bib.bib22)）。

<a id="A5.T4"></a>

<!-- source:A5.T4 -->

| **模型名称** | **数据集** | **架构**<br>**（表 [3](#A5.T3)）** | **损失**<br>**（公式（[2](#S4.E2)））** | **备注** |
| --- | --- | --- | --- | --- |
| **Small IL** | RPS 950k | Small | 行为克隆 |  |
| **Small IL (Filled Actions)** | RPS 950k | Small | 行为克隆 | 后期进行的消融实验，将<br>缺失动作替换为改进后的<br>估计值（附录 [D.1](#A4.SS1)）。 |
| **Small RL** | RPS 950k | Small | 指数型 $w$ | 指数型 $w$ 默认使用 $\beta=.5$，<br>并将权重值裁剪至 $[1e$-$5$, 50]。 |
| **Small RL (Binary)** | RPS 950k | Small | 二值型 $w$ |  |
| **Small RL (Exp Extreme)** | RPS 950k | Small | 指数型 $w$ | $\beta=1$，裁剪至 $[-1e$-$5,100]$。<br>（测试对 $w$ 超参数的敏感性。） |
| **Small RL (Aug)** | RPS 950k | Small | 指数型 $w$ | 在每个时间步随机将 词元<br>设为 `<unknown>`。 |
| **Small RL (Filled Actions)** | RPS 950k | Small | 二值型 $w$ | 将缺失动作替换为改进后<br>估计值的消融实验<br>（附录 [D.1](#A4.SS1)）。 |
| **Small RL (Binary+MaxQ)** | RPS 950k | Small | 二值型 $w$，$\lambda=1$ | 在扩大规模之前，测试回放<br>数据集上的 Q 值高估问题。 |
| **Medium IL** | RPS 950k | Medium | 行为克隆 |  |
| **Medium RL** | RPS 950k | Medium | 指数型 $w$ |  |
| **Medium RL (Aug)** | RPS 950k | Medium | 指数型 $w$ |  |
| **Medium RL (Binary+MaxQ)** | RPS 950k | Medium | 二值型 $w$，$\lambda=1$ |  |
| **Large IL** | RPS 950k | Large | 行为克隆 | 所有采用 Large 架构的模型默认<br>使用“Aug” dropout 方案。 |
| **Large RL** | RPS 950k | Large | 指数型 $w$ |  |
| **Large RL (Binary+MaxQ)** | RPS 950k | Large | 二值型 $w$，$\lambda=1$ |  |
| **SyntheticRL-V0** | RPS 950k<br>+ 1M Gen1&3<br>多样化队伍集上模型之间<br>对战的轨迹，临时混合使用<br>以上所有策略。<br>共 2M 条轨迹。 | Large | 二值型 $w$，$\lambda=10$ |  |
| **SyntheticRL-V1** | SyntheticRL-V0<br>+ 1M Gen2 & Gen4<br>多样化队伍集上模型之间<br>的对战。共 3M 条轨迹。 | Large | 二值型 $w$，$\lambda=10$ |  |
| **SyntheticRL-V1+SelfPlay** | SyntheticRL-V1<br>+ 2M Gen1-4 SynRL-V1<br>自我对弈轨迹。从本行<br>到表末的所有模型，均在<br>其 RPS 数据集中使用<br>改进后的动作标签<br>（附录 [D.1](#A4.SS1)）。<br>共 5M 条轨迹。 | Large | 二值型 $w$，$\lambda=10$ |  |
| **SyntheticRL-V1++** | SyntheticRL-V1<br>+ 额外 2M 条<br>多样化队伍集上模型之间<br>对战的轨迹（共 5M 条）。 | Large | 二值型 $w$，$\lambda=10$ |  |
| **SyntheticRL-V2** | 在 SyntheticRL-V1++ 中加入<br>$2025$ 年 1–3 月 50k 场<br>人类对战的 100k 条轨迹<br>（RPS 1.05M）——<br>其中包括我们自己参与的<br>许多公开对战。<br>共 5M 条轨迹。 | Large | 二值型 $w$ | 按照（[Grigsby 等，2024b](#bib.bib23)）<br>的方法，将价值预测转换为<br>two-hot 分类，使用 $96$ 个<br>在 $[-110,110]$ 之间*均匀*<br>分布的输出分箱。 |

表 4：**模型变体。** 本文训练的 20 个主要 Transformer 模型所使用的数据集、架构，以及相对于表 [3](#A5.T3) 基础配置的超参数改动。“RPS 950k”指原始的回放重建数据集（附录 [D](#A4)）。“指数型”权重函数（$w$）按照 AWAC（[Nair 等，2020](#bib.bib52)）实现。“二值型”权重函数按照 CRR（[Wang 等，2020](#bib.bib80)）实现。两种情况下，优势估计都以价值网络集成的均值近似 $V(s)$。“Synthetic”模型增大了批大小（$48\rightarrow 96$ 条序列）。

（**译注：原文表格将科学计数法拆开排版；两处裁剪区间分别写为 [1e-5, 50] 和 [-1e-5, 100]。此处保留原文数值与正负号。**）

<!-- source:A5.SS4.p2.1 -->

我们在一台配有 $8\times$ NVIDIA A$5000$ GPU 的机器上训练所有模型，训练均至少进行 $1$M 次梯度更新。默认使用 $1$M 步处的检查点；根据我们的评估，此时性能早已收敛。在开源代码与权重中，一个“epoch”被人为定义为 $25$k 次梯度更新的间隔，我们每 $2$ 个 epoch 保存一次检查点。因此，除非另有说明，实验结果默认使用检查点 $40$。SyntheticRL-V1+SelfPlay 从 epoch $40\rightarrow 48$ 进行微调，默认使用 48；SyntheticRL-V2 则是另一个例外，我们能确认它在 $1$M 步时仍在提升，因此使用最后一个可用检查点（$48$）。表 [6](#A6.T6) 标明了这些例外，附录 [F.3](#A6.SS3) 中还有更多讨论。

<!-- source:A5.SS4.p3.1 -->

图 [25](#A5.F25)（**译注：此处对应图 24。**）展示了在回放数据集上，行为克隆模型的规模与动作预测准确率之间的关系。图 [25](#A5.F25) 展示了使用标量回归和 two-hot 分类进行价值预测时的差异。

<a id="A5.F25"></a>

<!-- source:A5.F25 -->

<a id="A5.F25.fig1"></a>

<!-- source:A5.F25.fig1 -->

![A5.F25.g1](/images/human-level-pokemon/il_loss_by_model_size_v1.svg)

图 24：**Transformer 模仿学习训练损失曲线。** 使用标准 BC 目标时，宝可梦人类对战回放数据集上的训练损失与模型规模之间呈现出可预测的关系。

<a id="A5.F25.fig2"></a>

<!-- source:A5.F25.fig2 -->

![A5.F25.g2](/images/human-level-pokemon/binary_filter_approval.svg)

图 25：**价值网络筛选的悲观程度。** 我们在整个训练过程中跟踪离线数据集中被赋予权重 $w(h,a)>0$ 的数据占比（公式（[2](#S4.E2)））。two-hot 分类筛选器的准确性显著影响 BC 过程的悲观程度。曲线噪声较大，是因为它们记录的是单个 GPU 上一个小批次（包含 $12$ 场对战）的平均值。

<a id="A6"></a>

## 附录 F 实验细节与补充图表

<!-- source:A6.p1.1 -->

本节提供了支持正文第 [5](#S5) 节的图表与实验细节。

<a id="A6.SS1"></a>

### F.1 早期模仿学习模型

<!-- source:A6.SS1.p1.1 -->

在研究之初，我们尚未意识到，宝可梦回放数据集需要的网络规模会超出常见 RL 问题的规模。我们先搭建了一套小规模的行为克隆流程（目前仍可在发布的 `Metamon` 代码中找到）。图 [27](#A6.F27)（**译注：此处对应图 26。**）显示，这些模型在重建的对战回放数据集上存在明显的欠拟合。早期开发最终形成了回合编码器 Transformer 架构（图 [4](#S4.F4)），并使用基于 GRU（[Cho 等，2014](#bib.bib11)）的轨迹模型（代替图 [4](#S4.F4) 中的 Transformer），构建出“BaseRNN”对手。BaseRNN 在早期的启发式综合得分排名中居首（图 [6](#S5.F6)），后来也用作速度较快、仅需 CPU 的对手，以及填补缺失动作标签的工具（附录 [D.1](#A4.SS1)）。图 [27](#A6.F27) 记录了 BaseRNN 与两个消融版本的预测准确率。“WinsOnlyRNN”采用一种常见的离线 RL 消融方式：从失败玩家的视角出发，手动剔除低回报轨迹，以测试这样做能否提升性能。

<a id="A6.F27"></a>

<!-- source:A6.F27 -->

<a id="A6.F27.fig1"></a>

<!-- source:A6.F27.fig1 -->

![A6.F27.g1](/images/human-level-pokemon/metamon_underfitting_fig.svg)

图 26：**PS 回放数据上的欠拟合。** 我们报告了（小型）循环 BC 策略在规模逐渐增大的人类对战数据集上的训练集准确率。误差条表示四个随机子集上的最大值与最小值。模型规模以隐藏状态维度和循环层数表示。

<a id="A6.F27.fig2"></a>

<!-- source:A6.F27.fig2 -->

![A6.F27.g2](/images/human-level-pokemon/il_acc_by_model_v1.svg)

图 27：**BC-RNN 准确率。** 动作标签的熵很高，我们发现 Top-2 准确率是更适合调参的指标。“BaseRNN”包含 3.5M 个参数，“MiniRNN”将参数规模缩减至 $800$k；“WinsOnlyRNN”采用筛选后的 BC 方法，仅模仿获胜玩家视角下的决策（使训练集与验证集的规模都减半）。

<a id="A6.SS2"></a>

### F.2 启发式评估

<!-- source:A6.SS2.p1.1 -->

图 [28](#A6.F28) 记录了各个模型（表 [4](#A5.T4)）在整个训练过程中的启发式综合得分（第 [5.1](#S5.SS1) 节）。我们早期投入了大量精力，构建实力较强但计算成本较低的启发式对手来监控训练进展；然而，模型性能在不到 $250$k 个训练步内便已收敛。模型对手评估的运行速度足够快，能够在训练结束后补绘学习曲线，从而更清楚地揭示训练预算与性能之间的关系（附录 [F.3](#A6.SS3)）。

<a id="A6.F28"></a>

<!-- source:A6.F28 -->

![A6.F28.g1](/images/human-level-pokemon/hc_over_grad_steps_vs_gen.svg)

图 28：**启发式综合得分学习曲线。** 性能迅速收敛，且在长时间训练中未表现出退化迹象。BC 与离线 RL 形成两个明显的簇，而 $\mathcal{L}_{\text{actor}}$ 的改动和模型规模均未显示出明显影响。

<a id="A6.SS3"></a>

### F.3 模型对手评估

<!-- source:A6.SS3.p1.1 -->

图 [30](#A6.F30)（**译注：此处对应图 29。**）评估了多个模型对抗 BaseRNN 行为克隆模型的表现。与图 [28](#A6.F28) 中的启发式学习曲线一样，模型对抗这一对手时的性能在训练结束前很久就已收敛。图 [30](#A6.F30) 展示了最终模型（“SyntheticRL-V2”）对抗此前某一版本时的持续进步；此前的版本曾在 Gen1OU 中跻身全球前 $50$ 名。SyntheticRL-V2 在 $1.2$M 步后可能仍未收敛，但由于时间限制，我们提前终止了训练。表 [5](#A6.T5) 评估了使用真实队伍的、覆盖范围较窄的自我对弈数据所带来的影响，并通过与在原始数据集上继续训练的模型比较，控制了在这类数据集上微调所增加的训练预算。

<a id="A6.F30"></a>

<!-- source:A6.F30 -->

<a id="A6.F30.fig1"></a>

<!-- source:A6.F30.fig1 -->

![A6.F30.g1](/images/human-level-pokemon/offline_only_models_vs_basernn_fixed.svg)

图 29：**Transformer IL 与 RL 对抗 RNN BC。** 我们评估了在离线回放数据集上训练的 Transformer 策略，对抗一个专为仅使用 CPU 推理而设计的小型 RNN 模型时的性能。不同 RL 更新方法的性能没有显著差异，但在所有模型规模下均优于 BC。

<a id="A6.F30.fig2"></a>

<!-- source:A6.F30.fig2 -->

![A6.F30.g2](/images/human-level-pokemon/synv2_vs_synv1_by_gen.svg)

图 30：**高水平策略的进步。** 我们记录了最强模型（“SyntheticRL-V2”）对抗此前某一版本时的进步；此前的版本曾在 Gen1OU 中跻身前 $50$ 名。

<a id="A6.T5"></a>

<!-- source:A6.T5 -->

|  | Gen1OU | Gen2OU | Gen3OU | Gen4OU |
| --- | --- | --- | --- | --- |
| SyntheticRL-V1+SelfPlay @ 1.2M 步 | 63.6% | 59.6% | 61.4% | 59% |
| Synthetic-V1 @ 1.2M 步 | 50% | 53.8% | 48.4% | 48.2% |

表 5：**对抗 SyntheticRL-V1 的胜率。** 我们评估了在自我对弈数据集上微调所得的检查点，对抗原始版本（经过 $1$M 个训练步）时的表现。为了控制额外训练步数的影响，我们另设一个版本，在原始数据集上继续训练。样本量为 $500$ 场对战。

<a id="A6.SS4"></a>

### F.4 人类对手评估

<!-- source:A6.SS4.p1.1 -->

我们的模型在与人类玩家相同的条件下对战。我们为每个模型分配了独立的用户名（表 [6](#A6.T6)）。对手可以看到用户名，因此在重复交手时，人类玩家可以针对模型调整策略（就像他们可能会利用其他玩家的弱点一样）。图 [12](#S5.F12) 与图 [14](#S5.F14) 使用了 PS 上每个用户名的统计数据。请注意，ELO 和 Glicko-1 置信区间等评分指标每 $24$ 小时会发生衰减，因此，你阅读时看到的 PS 统计数据将不再与图中一致。为了完整呈现结果，表 [7](#A6.T7) 记录了每个模型的总胜负场数；不过，我们再次提醒，这类记录的意义有限，因为 PS 会将更强的模型匹配给更强的玩家。

<!-- source:A6.SS4.p2.1 -->

PS 天梯采用带有加时的计时规则（类似于国际象棋），任一玩家提出请求即可启用。我们总会请求开启计时器，以防对手长时间断线导致评估停滞。请注意，多数玩家也会请求启用限时，因为早期世代的对战即便开启计时器，也可能持续 $20$ 多分钟。对于采用搜索或 LLM 的 CPS AI 方法，时间限制可能是一个关键约束（[Karten 等，2025](#bib.bib35)）。然而，我们的智能体以参数量 $\leq 200$M 的 Transformer 的推理速度选择动作，因此时间限制并不构成问题。实际上，我们的出招速度快得可疑。不过，只有当对手也行动得非常快时，这一点才会显现，因为双方同时决策，对战按较慢一方的节奏推进。随着我们达到高 ELO，我们开始遇到少数既能击败模型、又能快速决策的玩家。最终，我们加入了随机延迟来掩饰推理速度（但在大多数回合中仍比对手更快）。除超人的速度之外，我们所有策略的对战风格都十分接近人类。我们在 PS 网站上保存了数百场对战回放，你可以通过表 [6](#A6.T6) 中的链接浏览，也可以在 [https://replay.pokemonshowdown.com/](https://replay.pokemonshowdown.com/) 上搜索。这些回放是第一作者监测天梯评估期间，所有公开对战（可供观战者观看）的样本，总体上没有明显的选择偏差。

<a id="A6.T6"></a>

<!-- source:A6.T6 -->

| **模型名称** | **PS 用户名** | **检查点** |
| --- | --- | --- |
| Small-IL | [SmallSparks](https://replay.pokemonshowdown.com/?user=SmallSparks) | 40 |
| Large-IL | [DittoIsAllYouNeed](https://replay.pokemonshowdown.com/?user=DittoIsAllYouNeed) | 40 |
| Large-RL | [Montezuma2600](https://replay.pokemonshowdown.com/?user=Montezuma2600) | 40 |
| SyntheticRL-V0 | [Metamon1](https://replay.pokemonshowdown.com/?user=Metamon1) | 40 |
| SyntheticRL-V1 | [TheDeadlyTriad](https://replay.pokemonshowdown.com/?user=TheDeadlyTriad) | 40 |
| SyntheticRL-V1<br>+ Self-Play | [ABitterLesson](https://replay.pokemonshowdown.com/?user=ABitterLesson) | 48 |
| SyntheticRL-V1++ | [QPrime](https://replay.pokemonshowdown.com/?user=QPrime) | 40 |
| SyntheticRL-V2 | [MetamonII](https://replay.pokemonshowdown.com/?user=MetamonII) | 48 |

表 6：**公开天梯用户名。** 每个模型在整个评估过程中均绑定唯一的用户名。链接指向各模型的回放页面。我们也会使用“NotableWalrus”和“PsyduckIsUbers”这两个用户名进行各种测试对战；它们并非始终对应同一个模型，也未计入实验结果，但可能出现在发布材料所包含的回放或视频中。

<!-- source:A6.SS4.p3.1 -->

我们认为，这些模型能够接受任意队伍配置作为输入，以很快的推理速度呈现接近人类的对战表现，可以成为人类玩家既有趣又实用的练习工具。不过，与这些模型对战也可能令人烦躁，因为它们的奖励函数鼓励延缓败局，而且它们不会认输。图 [31](#A6.F31) 以 Large RL 模型为例，表明 Q 值预测的校准程度已足以识别必败局面，并实现自动认输。

<a id="A6.F31"></a>

<!-- source:A6.F31 -->

![A6.F31.g1](/images/human-level-pokemon/win_probability_sample_full_day.png)

图 31：**以 $Q$ 函数估计胜率。** 我们在 Large-RL 模型进行 PS 天梯对战的 $24$ 小时内，跟踪了对战中的价值网络预测（$\gamma=.999$）。若忽略奖励函数中数值较小的塑形项与折扣因子，我们便可将这些值绘制为更便于理解的胜率估计。我们按真实结果标注这些数值序列。较小的误差条表示 $4$ 个价值网络预测值的两倍标准差。

<a id="A6.T7"></a>

<!-- source:A6.T7 -->

| 模型 | 用户名 | Gen1 OU | Gen2 OU | Gen3 OU | Gen4 OU |
| --- | --- | --- | --- | --- | --- |
| PokeEnv Heuristic | WinningIsOptional | 16 - 59 | N/A | 16 - 54 | 21 - 36 |
| Small IL | SmallSparks | 54 - 66 | 20 - 63 | 25 - 50 | 41 - 59 |
| Large RL | Montezuma2600 | 72 - 60 | 49 - 56 | 68 - 67 | 32 - 42 |
| SynRL-V0 | Metamon1 | 57 - 42 | 42 - 35 | 61 - 52 | 49 - 51 |
| SynRL-V1 | TheDeadlyTriad | 107 - 64 | 76 - 52 | 82 - 74 | 83 - 61 |
| SynRL-V1+SP | ABitterLesson | 65 - 38 | 51 - 30 | 80 - 71 | 64 - 56 |
| SynRL-V1++ | QPrime | 72 - 52 | 37 - 24 | 48 - 32 | 68 - 53 |
| SynRL-V2 | MetamonII | 148 - 95 | 75 - 40 | 76 - 53 | 68 - 48 |

表 7：**PS 用户名与胜—负记录。**
