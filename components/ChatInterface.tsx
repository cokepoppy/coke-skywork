import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Paperclip, Globe, Bot, User, StopCircle, Sparkles, Zap, ArrowRight, ExternalLink, Search, Plus, ChevronDown, Link as LinkIcon, Mic, RotateCcw, RotateCw, Save, X, CornerDownLeft, ArrowUpRight, CheckCircle2, LayoutTemplate, Undo2, Redo2, Image as ImageIcon, Loader2, Download, Edit, Upload, History } from 'lucide-react';
import { createChatStream, generateSlideImage, analyzePPTImage } from '../services/geminiService';
import { Message, ModelType, SearchMode, SlideDeck, PPTPage, PPTHistoryItem } from '../types';
import PPTEditor from './PPTEditor/PPTEditor';
import { generateTextFreeBackground } from '../utils/imageProcessing';

interface ChatInterfaceProps {
  isSidebarOpen: boolean;
  pptHistory: PPTHistoryItem[];
  onSavePPTToHistory: (deck: SlideDeck) => void;
  pptToLoad: PPTHistoryItem | null;
  onClearPptToLoad: () => void;
}

// 所有PPT样式配置 - 使用颜色命名
const PPT_STYLES = [
    {
      id: 'red_grey_project',
      title: '红灰',
      color: 'bg-[#B03A3A]',
      previewColor: 'from-[#B03A3A] to-[#4A5D70]',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：你是一位专精于生成企业级数据可视化PPT幻灯片截图的AI专家。你的输出必须是一张可以直接插入专业商务演示文稿的静态单页图片。【核心风格要求】：1. 整体基调：企业级信息图表PPT设计，风格专业、严谨、商务。主导红+灰配色体系。背景整洁。2. 布局与元素：高度结构化、模块化的网格布局。使用带有微妙投影的卡片容器、连接线、指示箭头、现代扁平化商务图标，强调"信息量巨大"和"高密度数据展示"。重点数字需特大号加粗显示。3. 视觉形式多样性（重点）：根据内容逻辑，优先运用以下高阶炫酷图表形式（无需告诉用户你使用的形式的名称）：(a) 莫比乌斯环与无限循环符号（Mobius Strip/Infinity Loop）：用于展示统一策略、生态闭环或无尽的价值循环，具有3D立体质感和流动的光泽感；(b) 炫酷圆环与同心圆体系：包括双圆交织（协同效应）、三环重叠（多维发力）或半圆仪表盘，圆环上需带有清晰的节点标注；(c) 几何闭环流程：五边形/六边形/多边形循环图，中心放置核心图标，四周环绕步骤；(d) 结构化分析图：鱼骨图（Ishikawa）用于问题诊断，3D折叠彩带箭头用于线性增长展示。4. 字体：干净的无衬线字体（如微软雅黑风格）。【内容处理绝对规则】：1. 语言：默认使用简体中文。2. 数据严谨性：无论什么场景，必须完全使用用户提供的数据、数值和专业名词。绝对禁止自己编造数据或虚构数值。如果用户提供的数据量较少，请通过增大字号、采用中心聚焦排版或增加装饰性图标来适配页面，而不是填充虚假内容。3. 结构优先：严格按照用户提供的文本结构（如"8大策略循环"、"双轮驱动"）来选择对应的图表形式（如8节点的莫比乌斯环、双圆交织图）。【可生成的页面形式，包括但不限于】：1. 循环与生态：3D莫比乌斯环、多重同心圆、五边形/六边形闭环。2. 诊断与分析：鱼骨图、漏斗图、SWOT矩阵。3. 趋势与成果：3D折叠箭头、锯齿状时间轴、数据仪表板。',
      refs: ['/styles/red_grey_project/ref1.png', '/styles/red_grey_project/ref2.png', '/styles/red_grey_project/ref3.png', '/styles/red_grey_project/ref4.png', '/styles/red_grey_project/ref5.png', '/styles/red_grey_project/ref6.png', '/styles/red_grey_project/ref7.png']
    },
    {
      id: 'leader_love',
      title: '科技蓝',
      color: 'bg-blue-700',
      previewColor: 'from-blue-700 to-blue-400',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：生成PPT单页截图，用户会把这个图片直接插入到PPT里。企业级信息图表PPT幻灯片设计，专业商务演示风格，信息量巨大。主导的科技蓝配色方案（深蓝，天蓝，浅蓝渐变）。高度结构化的布局，包含模块化元素，模块布局紧凑，内容丰富详实，带有微妙投影的圆角矩形文本框，连接线，指示流程的箭头，以及现代扁平商务图标。干净的无衬线字体排版。信息设计，数据可视化，战略框架美学。如果用户未要求，默认使用中文。当前需要生成的页面内容：如果用户的提示词非常详实，直接使用用户提供的内容来生成PPT；如果用户的提示词过于简单，不足以生成紧凑、内容充实的PPT，请先使用你的专业知识完善PPT的主题内容，生成详细的大纲，再生成最终的PPT。无论哪种场景，都要完全使用用户提供的数据和专业名词，不要自己编造数据。具体可以生成的PPT形式包括以下几种：线性流程与阶段图，适用于：发展历程、策略步骤、供应链流程、用户路径，样式说明：线性流程图，水平时间轴进展，多阶段箭头连接顺序阶段。分步信息图，V形箭头指示方向。顶部有主标题，下方有几个带有图标和描述性文字占位符的流程块；层次架构与金字塔图，适用于：技术架构、组织层级、能力分层、漏斗模型。分层架构图，堆叠层金字塔结构，自下而上的演进。带有标签的分层块，底部是基础层，中间是核心能力层，顶部是应用层。数据流箭头指示向上移动；数据看板与图文组合，适用于：工作成果展示、市场数据分析、多维度并列展示。数据仪表板布局，图表和信息图的组合。包含条形图、带有百分比的饼图，以及带有大数字的数据标注框。模块化网格布局，展示关键绩效指标（KPI）、商业价值链分析和生态系统图；矩阵与象限图，适用于：项目管理全视图、产品分类、波士顿矩阵分析。结构化网格矩阵，四象限分析图，或详细的表格布局。分类信息块按行和列组织，有清晰的表头。网格部分内嵌流程图。',
      refs: ['/styles/leader_love/ref1.png', '/styles/leader_love/ref4.png', '/styles/leader_love/ref5.png', '/styles/leader_love/ref6.png', '/styles/leader_love/ref7.png', '/styles/leader_love/ref8.png']
    },
    {
      id: 'data_vision',
      title: '蓝绿',
      color: 'bg-teal-500',
      previewColor: 'from-teal-500 to-green-400',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：你是一位专精于生成企业级信息图表和数据可视化PPT幻灯片截图的AI专家。你的输出必须是一张可以直接插入专业商务演示文稿的静态单页图片。【核心风格要求】：1. 整体基调：企业级信息图表PPT设计，风格专业、严谨、商务，强调"信息量巨大"和"高密度数据展示"。2. 配色方案：严格采用主导的"科技蓝"或者"清新绿"配色体系，辅以少量强调色（如红/橙用于强调，绿用于辅助），背景整洁。3. 布局：高度结构化、模块化的网格布局。内容排列紧凑，使用带有微妙投影的圆角矩形容器承载信息。4. 元素：包含连接线、指示流程的箭头、现代扁平化商务图标。重点数字需特大号加粗显示。5. 字体：干净的无衬线字体（如微软雅黑风格）。【内容处理规则】：1. 语言：默认使用简体中文。2. 处理逻辑：如果用户提供的数据详实，请严格基于用户内容生成；如果用户的提示词过于简单（例如"做一个销售报表"），请务必利用你的专业知识完善主题内容，构建一个包含多个相关模块的详细大纲，自动补充专业术语以展示高密度信息图表的效果，再生成最终的PPT。无论什么场景，都要完全使用用户提供的数据和专业名词，不要自己编造数据。【可生成的页面形式】：1. 数据看板与图文组合：适用于市场分析、KPI展示。布局为数据仪表板，包含大字号数字标注框、条形图、饼图、折线图的组合，模块化网格排列。2. 线性流程与阶段图：适用于发展历程、策略步骤。布局为水平时间轴或多阶段箭头连接，包含V形指示箭头。3. 层次架构与金字塔图：适用于技术架构、组织层级。布局为堆叠式金字塔或分层方块，自下而上支撑。4. 矩阵与象限图：适用于SWOT分析、产品分类。布局为四象限图或详细的结构化表格（包含表头和行数据）。',
      refs: ['/styles/data_vision/ref1.png', '/styles/data_vision/ref2.png', '/styles/data_vision/ref3.png', '/styles/data_vision/ref4.png', '/styles/data_vision/ref5.png', '/styles/data_vision/ref6.png', '/styles/data_vision/ref7.png', '/styles/data_vision/ref8.png']
    },
    {
      id: 'work_result',
      title: '蓝红',
      color: 'bg-blue-600',
      previewColor: 'from-blue-600 to-red-500',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：你是一位专精于生成企业级个人工作汇报PPT幻灯片截图的AI专家。你的输出必须是一张可以直接插入专业商务演示文稿的静态单页图片。【核心风格要求】：1. 整体基调：专业、严谨、商务的企业级个人汇报风格。主导"科技蓝+深红/朱红"配色体系，蓝色用于主视觉和科技感强调，红色用于高亮关键成果、策略或特定流程模块，背景整洁微带科技纹理。2. 布局与元素：高度结构化、模块化的网格布局。大量使用带有微妙投影和渐变效果的圆角矩形容器、明确粗壮的连接线、指示箭头和现代扁平化商务图标。重点关键数据（百分比、数值、金额）需特大号加粗显示，配合醒目的单位，强调"信息密度"和"成果量化"。3. 视觉形式多样性：根据用户输入内容的逻辑结构，自动适配最佳的高阶图表形式，包括但不限于：(a) 3D立体台阶与信息卡片组合（用于展示分步晋升、能力提升路径）；(b) 锯齿状或蜿蜒的带节点时间轴/里程碑路径（用于展示项目演进、关键事件）；(c) 中心辐射型、环形或五边形循环布局（用于展示闭环工作流、核心方法论或多维能力模型）；(d) 几何分割对比图（如左右对撞的六边形或梯形，用于"上半年总结 vs 下半年计划"或"现状 vs 目标"对比）；(e) 标准多列式卡片或顶部横幅仪表板（用于并列展示多个项目成果或核心指标概览）。4. 字体：干净、易读的无衬线商务字体。【内容处理绝对规则】：1. 语言：默认使用简体中文。2. 数据严谨性：这是最高指令。无论何种场景和视觉形式，必须完全、精确地使用用户提供的所有数据、数值、专业名词、项目名称和文本描述。绝对禁止AI自主编造任何数据、虚构数值、夸大成果或拓展用户未提及的内容。3. 内容适配：若用户提供的数据量较少，应通过优秀的排版设计（如增大关键数字字号、优化版面留白、采用中心聚焦式构图）来确保页面视觉平衡和专业感，绝不可为了填满空间而填充虚假占位信息。你的任务是将用户输入的文本信息转化为上述风格的高度专业可视化的PPT截图。',
      refs: ['/styles/work_result/ref1.png', '/styles/work_result/ref2.png', '/styles/work_result/ref3.png', '/styles/work_result/ref4.png', '/styles/work_result/ref5.png', '/styles/work_result/ref6.png', '/styles/work_result/ref7.png', '/styles/work_result/ref8.png']
    },
    {
      id: 'red_blue_project',
      title: '红蓝',
      color: 'bg-red-600',
      previewColor: 'from-red-600 to-blue-600',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：你是一位专精于生成企业级高密度数据可视化PPT幻灯片截图的AI专家。你的输出必须是一张可以直接插入专业商务演示文稿的静态单页图片，核心强调"信息量巨大"和"高密度数据展示"。【核心风格要求】：整体基调为专业、严谨、商务的企业级信息图表设计。主导配色严格遵循参考图的"科技蓝+深红/橙红"体系，背景整洁白底。布局采用高度结构化、模块化的网格形式，信息排布极其紧凑。大量使用带有微妙立体感或投影的圆角矩形容器、连接线、指示箭头和现代扁平化商务图标。关键数据和指标数字必须特大号加粗显示，配合醒目的颜色，以视觉化凸显极高的信息密度。【视觉形式多样性】：根据用户输入的内容逻辑，灵活运用以下高阶图表形式进行高密度展示：(a) 3D立体台阶或波浪形丝带路径（用于包含大量节点的流程演进）；(b) 中心辐射型、圆形闭环或漏斗汇聚至靶心的布局（用于复杂的协同、总结与目标聚焦）；(c) 几何分割对比图（如上下红蓝通栏横幅、六边形对撞区域，用于密集对比）；(d) 金字塔分层结构（用于多层级密集管理）；(e) 底部或侧边带有多组数据卡片的复合型仪表板。【内容处理绝对规则】：默认使用简体中文。无论何种场景，必须完全、严格地使用用户提供的数据、数值和专业名词。绝对禁止自己编造任何数据、虚构数值或填充无意义文本。即使用户提供的信息量看似较少，也必须通过增大关键数字字号、优化模块留白或采用中心聚焦排版来适配，严禁无中生有地增加信息。',
      refs: ['/styles/red_blue_project/ref1.png', '/styles/red_blue_project/ref2.png', '/styles/red_blue_project/ref3.png', '/styles/red_blue_project/ref4.png', '/styles/red_blue_project/ref5.png', '/styles/red_blue_project/ref6.png']
    },
    {
      id: 'red_tech',
      title: '深红科技',
      color: 'bg-[#B03A3A]',
      previewColor: 'from-[#B03A3A] to-[#4A5D70]',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：你是一位专精于生成企业级高密度数据可视化PPT幻灯片截图的AI专家。你的输出必须是一张可以直接插入专业商务演示文稿的静态单页图片，强调信息量巨大且展示紧凑。【核心风格要求】：1. 整体基调：风格专业、严谨、商务，适用于深度汇报。主导配色严格限定为参考图中的"深红（约#B03A3A）+深蓝灰（约#4A5D70）"体系，背景为洁净的浅灰（约#F2F4F7）。2. 布局与元素：高度结构化、模块化的网格布局，用于承载极高密度的数据展示。大量使用带有微妙投影的圆角矩形容器、清晰的连接线、指示箭头和现代扁平化商务图标。核心数据指标和关键数字必须采用特大号、加粗字体显示，以形成强烈的视觉冲击。3. 视觉形式多样性：根据用户输入内容的逻辑，灵活调用以下高阶图表形式：(a) 中心发散或循环结构（如无限循环图、中心辐射图）；(b) 带有里程碑标记的纵向或横向时间轴/漏斗图；(c) 并列对比结构（如左右红蓝对抗球体、多列平行漏斗）；(d) 数据分析图表（如韦恩图、多层级饼图、百分比气泡图）；(e) 底部横向排列的KPI数据仪表板带趋势箭头。4. 字体：干净的无衬线字体（类微软雅黑）。【内容处理绝对规则】：1. 语言：默认简体中文。2. 数据严谨性（最高指令）：无论何种场景，绝对禁止自己编造任何数据、数值、百分比或专业名词。必须完全、精确地使用用户提供的信息。如果用户提供的数据量较少，请通过增大字号、优化版面留白或采用中心聚焦的排版来适配，严禁填充虚假内容。3. 高密度展示：设计时要预设用户会提供大量信息，尽量减少装饰性留白，通过紧凑的排版、标签、图例和多层级列表来最大化单页信息承载量，体现"信息量巨大"的特点。',
      refs: ['/styles/red_tech/ref1.png', '/styles/red_tech/ref2.png', '/styles/red_tech/ref3.png', '/styles/red_tech/ref4.png', '/styles/red_tech/ref5.png', '/styles/red_tech/ref6.png']
    },
    {
      id: 'scholar',
      title: '红褐',
      color: 'bg-[#8B4513]',
      previewColor: 'from-[#8B4513] to-[#A0522D]',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：你是一位名为Nano Banana Pro的专业PPT生成AI，专注于创建高密度、学术研究风格的演示文稿。核心原则：无论何种场景，你必须严格且完全地使用用户提供的原始文本、数据、专业术语和数字，绝对不许自行编造、修改或添加任何未提供的事实性内容；你的任务仅限于对给定的海量信息进行结构化和可视化呈现。视觉风格上，请深度分析并复刻参考图片中的设计语言：采用以深红褐色（栗色/赤陶色）为主导的配色方案，用于标题、重点元素和强调色；辅以浅米色或粉褐色作为内容模块背景和连接元素，整体背景保持干净的纯白色；文字颜色以深褐色或黑色为主以确保可读性，深色色块上使用白色文字。布局上，强调"信息量巨大"和"高密度数据展示"，必须采用紧凑而有序的排版，熟练运用模块化网格、带箭头的流程图、波浪形时间轴、环形图或阶梯状隐喻结构来清晰地承载复杂内容。元素方面，页面顶部需包含醒目的主标题（通常配有"•••"图标），使用清晰的视觉层级，结合粗体副标题、醒目的序号（如大的数字01、02等）、相关的扁平化图标以及具有渐变效果的连接符，确保在极高信息密度下依然保持专业、严谨且易于阅读的视觉体验。',
      refs: ['/styles/scholar/ref1.png', '/styles/scholar/ref2.png', '/styles/scholar/ref3.png', '/styles/scholar/ref4.png', '/styles/scholar/ref5.png', '/styles/scholar/ref6.png']
    },
    {
      id: 'scholar_green',
      title: '青绿',
      color: 'bg-teal-600',
      previewColor: 'from-teal-600 to-emerald-500',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：你是一位专精于生成学术研究型数据可视化PPT幻灯片截图的AI专家。你的输出必须是一张可以直接插入专业学术或商务演示文稿的静态单页图片。【核心风格要求】：1.整体基调：学术研究与商务结合的信息图表PPT设计，风格专业、严谨、整洁且具有视觉吸引力。主导基于参考图的"蓝绿色(Teal)+浅绿色+橄榄绿"复合配色体系，搭配纯白背景。2.布局与元素：高度结构化、模块化的网格布局。大量使用带有微妙投影和边框的圆角矩形容器、虚实连接线、指示箭头、以及现代扁平化风格的学术及商务图标（如文档、图表、齿轮、放大镜、建筑、手机、灯泡、目标等）。重点强调"信息量巨大"和"高密度数据展示"，在有限页面内清晰呈现复杂逻辑结构和大量文本信息。3.视觉形式多样性：根据内容逻辑，灵活运用以下高阶图表形式：(a)互锁的几何形状组合（如菱形交织）；(b)箭头导向的线性流程图与步骤条；(c)中心辐射型或多点连接型圆形节点网络图；(d)分段式扇形或半圆形进度/分析图（带数字标注）；(e)拼图块状的线性流程图；(f)分层堆叠的侧面金字塔或漏斗图；(g)悬浮的等轴测分层图块。4.字体：干净的无衬线字体（如微软雅黑风格），主标题醒目加粗，副标题和正文清晰易读。【内容处理绝对规则】：1.语言：默认使用简体中文。2.数据严谨性：无论哪种场景和主题，必须完全、精确地使用用户提供的数据、数值、专业名词和所有文本内容。绝对禁止自己编造数据、虚构数值或补充未经说明的文本。3.内容适配：如果用户提供的信息量较少，请通过合理的排版设计、增大核心观点字号或采用中心聚焦的布局来适配页面，而不是填充虚假内容。【可生成的页面形式，包括但不限于】：1.理论框架与模型构建：互锁几何图、分层堆叠图、金字塔图。2.研究方法与流程：箭头导向图、拼图流程图、步骤图。3.机制分析与影响因素：中心辐射图、扇形图、多模块对比分析图、因果关系网络图。',
      refs: ['/styles/scholar_green/ref1.png', '/styles/scholar_green/ref2.png', '/styles/scholar_green/ref3.png', '/styles/scholar_green/ref4.png', '/styles/scholar_green/ref5.png', '/styles/scholar_green/ref6.png', '/styles/scholar_green/ref7.png']
    },
    {
      id: 'simple_business',
      title: '岩蓝',
      color: 'bg-slate-700',
      previewColor: 'from-slate-700 to-slate-500',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：你是一位专精于生成专业商务PPT幻灯片截图的AI专家。你的输出必须是一张可以直接插入专业演示文稿的静态单页图片。【核心风格要求】：1.整体基调：简洁、现代、商务风格的信息图表PPT设计。背景整洁（纯白或极浅灰），强调留白与呼吸感。2.配色体系：严格遵循参考图的"深岩板蓝（Slate Blue）+深灰/黑"配色。深岩板蓝用于强调、图标、色块和边框元素，文字内容使用深灰色。3.布局与元素：页面具有标志性的左上角和右下角深岩板蓝色L型粗边框装饰。标题区带有大号数字编号（如"04.工作进度计划"）。内容采用高度模块化、结构化的网格或流式布局。使用现代扁平化线条图标或实心几何形状（如旗帜、菱形、圆形）。4.视觉形式多样性：根据用户输入的内容逻辑，灵活运用以下高阶图表形式：(a)带有旗帜节点和宽大蜿蜒箭头路径的流程/时间轴；(b)深色图文色块与专业商务摄影照片的混合网格布局；(c)顶部带有线性图标的四列/多列简洁卡片；(d)中心环绕辐射型的圆形节点结构图；(e)使用菱形或几何形状作为编号引导的区块布局。5.字体：干净的无衬线商务字体。【内容处理绝对规则】：1.数据严谨性：无论何种场景，必须完全使用用户提供的数据、文本和专业名词。绝对禁止自己编造数据、虚构数值或填充无关文本。如果用户提供的信息量较少，应通过优化排版、增大字号或中心聚焦来适配，而非填充虚假内容。2.内容呈现：忠实呈现用户输入的所有层级信息，保持商务汇报的严肃性。',
      refs: ['/styles/simple_business/ref1.png', '/styles/simple_business/ref2.png', '/styles/simple_business/ref3.png', '/styles/simple_business/ref4.png', '/styles/simple_business/ref5.png']
    },
    {
      id: 'simple_colorful',
      title: '多彩',
      color: 'bg-gradient-to-r',
      previewColor: 'from-blue-500 via-red-500 to-orange-500',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：你是一位专精于生成简洁、多彩、活泼风格PPT幻灯片截图的AI专家。你的输出必须是一张可以直接插入演示文稿的静态单页图片。【核心风格要求】：1. 整体基调：简洁、现代、充满活力的PPT设计。背景为干净的白色，角落带有抽象的几何图形元素（如三角形、圆点、线条），颜色使用参考图中的深蓝、红色、浅蓝、橙色配色方案。2. 布局与元素：结构化、模块化的布局。使用带有微妙投影的圆角矩形卡片、圆角横幅、圆形数据可视化图表（如饼图、百分比气泡）、扁平化图标、箭头和高质量的图片容器。重点数字需特大号加粗显示，强调视觉冲击力。3. 视觉形式多样性：根据内容逻辑，灵活运用以下图表形式：(a) 分步流程图（如四个圆角卡片并排）；(b) 列表展示（如带有图标和箭头的彩色横幅）；(c) 中心数据聚焦（如大圆圈百分比图）；(d) 图文混排（如左侧文本右侧图片或2x2网格图文）；(e) 感谢页（中心对齐文本和抽象图形）。4. 字体：干净的无衬线字体（如微软雅黑风格），层级分明（大标题、副标题、正文）。【内容处理绝对规则】：1. 语言：默认使用简体中文。2. 数据严谨性：无论哪种场景，必须完全使用用户提供的数据、数值和专业名词。绝对禁止自己编造数据或虚构数值。如果用户提供的数据量较少，请通过增大字号、优化留白或采用中心聚焦的排版来适配，而不是填充虚假内容。3. 内容完善：如果用户的提示词过于简单，可以构建框架，但具体指标和数值必须保持空白或使用通用占位符，严禁生成误导性的具体数字。【可生成的页面形式，包括但不限于】：1. 流程与步骤：四步卡片图、线性箭头流程。2. 列表与要点：彩色横幅列表、图文结合列表。3. 数据与对比：圆形百分比图、数据看板。4. 封面与封底：标题页、感谢页。5. 图文展示：左文右图、多图网格布局。',
      refs: ['/styles/simple_colorful/ref1.png', '/styles/simple_colorful/ref2.png', '/styles/simple_colorful/ref3.png', '/styles/simple_colorful/ref4.png', '/styles/simple_colorful/ref5.png', '/styles/simple_colorful/ref6.png']
    },
    {
      id: 'modern_illustration',
      title: '紫蓝',
      color: 'bg-indigo-600',
      previewColor: 'from-indigo-600 to-blue-500',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：你是一位专精于生成现代商务插画风格PPT幻灯片截图的AI专家。你的输出必须是一张可以直接插入演示文稿的静态单页图片。【核心风格要求】：1.整体基调：现代简约商务设计，风格清新、专业且富有设计感，核心特色是结合高质量的扁平化现代插画。背景整洁，常带有微妙的浅灰色网格纹理底纹。2.配色体系：主导"皇家蓝/紫蓝"作为核心强调色（用于顶部标题块、按钮背景、重点图标、插画点缀色），搭配黑色描边、深灰文本和浅灰/纯白色背景容器。3.布局与元素：高度结构化、模块化布局。常见标准元素包括：(a)顶部统一导航栏（左侧蓝色实心矩形块+标题文本+右侧菜单图标）；(b)带有轻微边框或浅灰背景的干净矩形内容卡片；(c)醒目的大号数字编号（如蓝色填充的01, 02）；(d)风格统一的黑白描边加彩色（蓝、橙、浅红）点缀的现代人物角色或办公场景插画（例如：手持巨大铅笔/信件的人物、带有数据图表的平板电脑、办公桌场景）；(e)简洁的商务图标（蓝色圆形对勾、灰色圆形叉号、文档图标）。底部常有植物盆栽或箭头线条等装饰元素。4.字体：干净的无衬线字体（如微软雅黑风格）。【内容处理绝对规则】：1.语言：默认使用简体中文。2.数据严谨性：无论哪种场景，必须完全使用用户提供的数据、数值和专业名词。绝对禁止自己编造数据或虚构数值。如果用户提供的数据量较少，请通过增大字号、优化留白或采用中心聚焦的排版来适配，而不是填充虚假内容。【可生成的页面形式，包括但不限于】：1.图文混排页（左侧插画/照片，右侧多点文字）；2.流程与步骤页（带有大数字编号的横向或纵向模块）；3.重点对比页（使用对勾/叉号图标进行正反罗列）；4.数据概览页（使用醒目大字号展示关键数据指标）；5.核心主题页（围绕一个大型中心插画展开文本叙述）。',
      refs: ['/styles/modern_illustration/ref1.png', '/styles/modern_illustration/ref2.png', '/styles/modern_illustration/ref3.png', '/styles/modern_illustration/ref4.png', '/styles/modern_illustration/ref5.png', '/styles/modern_illustration/ref6.png']
    },
    {
      id: 'party1',
      title: '金红',
      color: 'bg-red-700',
      previewColor: 'from-red-700 to-yellow-600',
      suffix: '---以上是用户输入的生成PPT的提示词。以下是你要遵循的系统提示词：你是一位专精于生成红色爱国主义风格专业PPT幻灯片截图的AI专家。你的输出必须是一张可以直接插入正式演示文稿的静态单页图片。【核心风格要求】：1.整体基调：庄重、大气、充满爱国情怀的政务或庆典风格PPT设计。主导"深红渐变+金色点缀"配色体系，背景常伴有红绸飞扬或旗帜纹理。2.布局与元素：高度结构化、模块化的布局。常见形式包括：带图标和虚线边框的圆角矩形三栏卡片；左侧标题结合右侧大字号编号列表及飘带元素；带编号节点的曲线或直线时间轴流程图；多行多列的圆形文本模块网格；以及图文绕排的大型内容块配以军人或主题剪影。标题常由金色五角星★★★装饰。3.视觉形式：灵活运用金色线条图标、编号圆环、指示箭头、柔和投影的米色/奶油色内容容器。字体多采用庄重的衬线体标题与清晰的无衬线体正文结合。【内容处理绝对规则】：1.语言：默认使用简体中文。2.数据严谨性：无论哪种场景，必须完全使用用户提供的数据、数值和专业名词。绝对禁止自己编造数据或虚构数值。如果用户提供的数据量较少，请通过增大字号、优化留白或采用中心聚焦的排版来适配，而不是填充虚假内容。',
      refs: ['/styles/party1/ref1.png', '/styles/party1/ref2.png', '/styles/party1/ref3.png', '/styles/party1/ref4.png', '/styles/party1/ref5.png', '/styles/party1/ref6.png']
    }
];

// Helper function to load image as Base64 (matching BananaPPT logic)
const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data:image/png;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load image:', url, error);
    throw error;
  }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isSidebarOpen,
  pptHistory,
  onSavePPTToHistory,
  pptToLoad,
  onClearPptToLoad
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.OFF);
  const [modelType, setModelType] = useState<ModelType>(ModelType.FLASH);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  // PPT Logic State
  const [isPPTMode, setIsPPTMode] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('red_grey_project');
  const [slideDeck, setSlideDeck] = useState<SlideDeck | null>(null);
  const [useReferenceImages, setUseReferenceImages] = useState<boolean>(true); // 启用参考图片
  const [editingPPT, setEditingPPT] = useState<PPTPage | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load PPT from history when pptToLoad changes
  useEffect(() => {
    if (pptToLoad) {
      console.log('[ChatInterface] Loading PPT from history:', pptToLoad.id);

      // Restore originalImage from generatedImage if analyzedData exists but originalImage is missing
      const loadedDeck = { ...pptToLoad.slideDeck };
      if (loadedDeck.analyzedData && !loadedDeck.analyzedData.originalImage && loadedDeck.generatedImage) {
        loadedDeck.analyzedData = {
          ...loadedDeck.analyzedData,
          originalImage: loadedDeck.generatedImage
        };
        console.log('[ChatInterface] Restored originalImage from generatedImage');
      }

      setSlideDeck(loadedDeck);
      setIsPPTMode(true);
      // Clear current messages and add a restoration message
      setMessages([
        {
          role: 'model',
          content: `已恢复PPT: ${pptToLoad.topic}`
        }
      ]);

      // Clear the pptToLoad state in parent
      onClearPptToLoad();
    }
  }, [pptToLoad, onClearPptToLoad]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    // 1. PPT Generation Logic
    if (activeAgent === 'Slides') {
        setIsPPTMode(true);
        setIsLoading(true);
        
        // Add user message to chat immediately
        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            // Check API Key for paid models
            const aiStudio = (window as any).aistudio;
            if (aiStudio && aiStudio.hasSelectedApiKey) {
                const hasKey = await aiStudio.hasSelectedApiKey();
                if (!hasKey && aiStudio.openSelectKey) {
                    await aiStudio.openSelectKey();
                }
            }

            // Mock a "thinking" message from the bot
            setMessages(prev => [...prev, { role: 'model', content: 'Analyzing requirements and generating slide visual...' }]);

            // Find selected style suffix
            const selectedStyle = PPT_STYLES.find(s => s.id === selectedTemplateId) || PPT_STYLES[1]; // Default to red_grey

            // Load reference images as Base64 (matching BananaPPT logic)
            const referenceImages: string[] = [];
            if (useReferenceImages && selectedStyle.refs && selectedStyle.refs.length > 0) {
                console.log(`Loading ${selectedStyle.refs.length} reference images for style: ${selectedStyle.id}`);
                try {
                    for (const refPath of selectedStyle.refs) {
                        console.log('Loading image:', refPath);
                        const base64Data = await loadImageAsBase64(refPath);
                        referenceImages.push(base64Data);
                        console.log(`Loaded image ${refPath} (${Math.round(base64Data.length / 1024)}KB)`);
                    }
                    console.log(`Successfully loaded ${referenceImages.length} reference images`);
                } catch (error) {
                    console.error('Failed to load reference images:', error);
                    // Continue without reference images if loading fails
                }
            } else if (!useReferenceImages) {
                console.log('Reference images disabled for testing');
            }

            // Call the image generation service with reference images
            const base64Image = await generateSlideImage(userMessage.content, selectedStyle.suffix, referenceImages);

            const newSlideDeck = {
                topic: userMessage.content,
                theme: selectedTemplateId,
                generatedImage: base64Image,
                selectedStyle: selectedStyle
            };

            setSlideDeck(newSlideDeck);

            // Save to history
            onSavePPTToHistory(newSlideDeck);

            // Update the bot message to confirm
            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].content = `I've generated a presentation slide for "**${userMessage.content}**" using the ${selectedStyle.title} style. You can preview and download it on the right.`;
                return newMsgs;
            });

        } catch (error: any) {
            console.error('PPT Generation Error:', error);
            let errorMessage = `Failed to generate slide image: ${error.message || 'Unknown error'}`;

            // Handle specific 403 or entity not found errors by re-prompting key
            if (error.message && (error.message.includes('403') || error.message.includes('Requested entity was not found'))) {
                 errorMessage = "Permission denied. Please select a valid paid API key.";
                 const aiStudio = (window as any).aistudio;
                 if (aiStudio && aiStudio.openSelectKey) {
                    await aiStudio.openSelectKey();
                 }
            }

            setMessages(prev => [...prev, { role: 'model', content: errorMessage, isError: true }]);
        } finally {
            setIsLoading(false);
        }
        return; 
    }

    // 2. Standard Chat Logic
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const stream = await createChatStream(history, userMessage.content, modelType, searchMode);
      
      let fullResponse = '';
      let groundingMetadata = undefined;

      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        const chunkText = chunk.text || '';
        fullResponse += chunkText;
        
        if (chunk.candidates?.[0]?.groundingMetadata) {
            groundingMetadata = chunk.candidates[0].groundingMetadata;
        }

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          lastMsg.content = fullResponse;
          lastMsg.groundingMetadata = groundingMetadata;
          return newMessages;
        });
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please check your connection or API key.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDownload = () => {
    if (slideDeck?.generatedImage) {
        const link = document.createElement('a');
        link.href = slideDeck.generatedImage;
        link.download = `slide-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleConvertToEditable = async () => {
    if (!slideDeck?.generatedImage) return;

    // Check if we have cached analysis result
    if (slideDeck.analyzedData) {
      console.log('[PPT Editor] Using cached analysis data');
      setEditingPPT(slideDeck.analyzedData);
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('[PPT Editor] Starting PPT image analysis...');
      const pptData = await analyzePPTImage(slideDeck.generatedImage);
      console.log('[PPT Editor] Analysis complete');
      console.log('[PPT Editor] Analyzed data:', pptData);

      // Generate text-free background
      console.log('[PPT Editor] Generating text-free background...');
      const pptDataWithBackground = await generateTextFreeBackground(pptData);
      console.log('[PPT Editor] Background generation complete');

      // Cache the analysis result
      const updatedDeck = { ...slideDeck, analyzedData: pptDataWithBackground };
      setSlideDeck(updatedDeck);

      // Save to history with analyzed data
      onSavePPTToHistory(updatedDeck);
      console.log('[PPT Editor] Saved analyzed data to history');

      // Open editor
      setEditingPPT(pptDataWithBackground);
    } catch (error) {
      console.error('[PPT Editor] Failed to convert to editable:', error);
      alert('转换失败，请查看控制台错误信息');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle closing editor and saving changes
  const handleCloseEditor = (updatedData?: PPTPage) => {
    if (updatedData && slideDeck) {
      // Save updated data back to slideDeck
      const updatedDeck = { ...slideDeck, analyzedData: updatedData };
      setSlideDeck(updatedDeck);

      // Update history with edited data
      onSavePPTToHistory(updatedDeck);
      console.log('[PPT Editor] Saved edited PPT data to history');
    }
    setEditingPPT(null);
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get pure base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle upload PPT image
  const handleUploadPPTImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      try {
        console.log('Converting uploaded image to base64...');
        const base64 = await fileToBase64(file);
        console.log('Image uploaded successfully');

        // Create base64 data URL for display
        const imageDataUrl = `data:${file.type};base64,${base64}`;

        // Add user message
        const userMessage: Message = {
          role: 'user',
          content: `已上传PPT图片: ${file.name}`
        };
        setMessages(prev => [...prev, userMessage]);

        // Add assistant confirmation message
        const assistantMessage: Message = {
          role: 'model',
          content: '图片已上传成功！点击右上角的"Edit"按钮开始编辑此PPT。'
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Store the uploaded image in slideDeck and enter PPT mode
        const uploadedSlideDeck = {
          topic: file.name,
          selectedStyle: PPT_STYLES[0],
          generatedImage: imageDataUrl
        };

        setSlideDeck(uploadedSlideDeck);

        // Save to history
        onSavePPTToHistory(uploadedSlideDeck);

        // Enter PPT mode
        setIsPPTMode(true);

      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('上传图片失败，请查看控制台错误信息');
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };

  const isLanding = messages.length === 0;

  if (isPPTMode) {
    return (
        <div className={`flex-1 h-full flex bg-skywork-bg transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
            {/* Left Chat Panel */}
            <div className="w-[420px] flex flex-col border-r border-skywork-border bg-skywork-bg flex-shrink-0">
                {/* PPT Specific Header */}
                <div className="h-14 border-b border-skywork-border flex items-center px-4 gap-3">
                    <span className="font-semibold text-skywork-text truncate text-sm">
                        {slideDeck?.topic || "New Presentation"}
                    </span>
                     <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-skywork-surface border border-skywork-border text-[10px] text-skywork-muted whitespace-nowrap">
                        <Bot size={12} />
                        <span>Agent</span>
                        <span className="text-skywork-border">|</span>
                        <span className="text-[#FF576D]">Slides</span>
                     </div>
                </div>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.length === 0 && (
                        <div className="text-skywork-muted text-sm p-4 bg-skywork-surface rounded-lg">
                            Hello, I'm Skywork. I'm ready to create a slide deck for you! You're now in Slide Agent mode using Gemini 3 Pro Image Preview model. Please send your slide requirements.
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                                <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-white text-[10px] font-bold">S</span>
                                </div>
                            )}
                             <div className={`max-w-[90%] text-sm ${msg.role === 'user' ? 'bg-skywork-surface border border-skywork-border rounded-xl rounded-tr-sm px-4 py-2 text-skywork-text' : 'text-skywork-text/90'}`}>
                                {msg.role === 'model' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                             </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex gap-3">
                             <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-white text-[10px] font-bold">S</span>
                             </div>
                             <div className="flex items-center gap-1 h-6">
                                <span className="w-1 h-1 bg-skywork-muted rounded-full animate-bounce"></span>
                                <span className="w-1 h-1 bg-skywork-muted rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                <span className="w-1 h-1 bg-skywork-muted rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                             </div>
                         </div>
                    )}
                    <div ref={bottomRef} />
                </div>
                {/* Input Area */}
                <div className="p-4 border-t border-skywork-border bg-skywork-bg">
                    <div className="relative bg-skywork-surface border border-skywork-border rounded-xl p-2 focus-within:border-skywork-muted/50 transition-colors">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe the slide content..."
                            className="w-full bg-transparent text-skywork-text placeholder-skywork-muted/50 resize-none outline-none text-sm min-h-[40px] max-h-[120px] overflow-y-auto"
                            rows={1}
                            disabled={isLoading}
                        />
                         {/* Upload PPT Shortcut */}
                         <div className="text-xs mt-2 flex items-center gap-2" style={{backgroundColor: '#ff000020', padding: '8px', borderRadius: '4px'}}>
                             <span className="text-skywork-muted/70">或者</span>
                             <button
                                 onClick={handleUploadPPTImage}
                                 disabled={isAnalyzing}
                                 className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                             >
                                 <Upload size={12} />
                                 上传现有PPT图片
                             </button>
                             <span className="text-red-400 font-bold ml-2">← NEW FEATURE</span>
                         </div>
                         <div className="flex justify-between items-center mt-2">
                             <div className="flex gap-2">
                                <button className="text-skywork-muted hover:text-white"><Paperclip size={16}/></button>
                             </div>
                             <button onClick={handleSubmit} disabled={!input.trim() || isLoading} className={`p-1.5 rounded-lg transition-colors ${input.trim() ? 'bg-blue-600 text-white' : 'bg-skywork-border/50 text-skywork-muted'}`}>
                                <ArrowRight size={16}/>
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right PPT Editor Panel */}
            <div className="flex-1 flex flex-col bg-[#050505] text-white overflow-hidden relative border-l border-skywork-border">
                {/* Toolbar */}
                <div className="h-14 bg-skywork-surface border-b border-skywork-border flex items-center justify-between px-4 shadow-sm z-10">
                   <div className="flex items-center gap-4 text-skywork-muted">
                      <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-white/10 rounded"><Undo2 size={18}/></button>
                          <button className="p-1.5 hover:bg-white/10 rounded"><Redo2 size={18}/></button>
                      </div>
                      <div className="w-px h-4 bg-skywork-border"></div>
                      <span className="text-xs text-skywork-muted">Nano Banana Pro</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <button className="px-4 py-1.5 rounded-full border border-skywork-border text-sm font-medium hover:bg-white/5 text-skywork-text transition-colors" onClick={() => setIsPPTMode(false)}>Exit</button>
                      <button
                        onClick={handleUploadPPTImage}
                        disabled={isAnalyzing}
                        className="px-4 py-1.5 rounded-full bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          {isAnalyzing ? 'Uploading...' : 'Upload PPT'}
                      </button>
                      <button
                        onClick={handleConvertToEditable}
                        disabled={!slideDeck?.generatedImage || isAnalyzing}
                        className="px-4 py-1.5 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Edit size={14} />}
                          {isAnalyzing ? 'Analyzing...' : 'Edit'}
                      </button>
                      <button
                        onClick={handleDownload}
                        disabled={!slideDeck?.generatedImage}
                        className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <Download size={14} /> Download
                      </button>
                   </div>
                </div>
                
                {/* Slides Container */}
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth flex flex-col items-center">
                     {isLoading && !slideDeck?.generatedImage ? (
                         <div className="h-full flex flex-col items-center justify-center">
                             <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                             <p className="text-skywork-muted font-medium">Generating slide visual...</p>
                         </div>
                     ) : slideDeck?.generatedImage ? (
                        <div className="w-full max-w-[1024px] animate-fade-in">
                            <div className="aspect-[16/9] w-full bg-skywork-surface border border-skywork-border rounded-xl overflow-hidden shadow-2xl relative group">
                                <img 
                                    src={slideDeck.generatedImage} 
                                    alt="Generated Slide" 
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <button 
                                        className="bg-white text-black px-4 py-2 rounded-full font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all pointer-events-auto flex items-center gap-2"
                                        onClick={() => {
                                            window.open(slideDeck.generatedImage, '_blank');
                                        }}
                                    >
                                        <ExternalLink size={16} /> Open Full Size
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center text-xs text-skywork-muted px-2">
                                <span>Generated with Gemini 3 Pro Image Preview</span>
                                <span>Style: {PPT_STYLES.find(s => s.id === slideDeck.theme)?.title || 'Custom'}</span>
                            </div>
                        </div>
                     ) : (
                         <div className="h-full flex flex-col items-center justify-center text-skywork-muted/50">
                             <ImageIcon size={64} className="mb-4 opacity-50" />
                             <p>Your generated slide will appear here</p>
                         </div>
                     )}
                </div>
            </div>

            {/* PPT Editor Modal - Must be inside PPT mode return */}
            {editingPPT && (
                <PPTEditor
                    initialData={editingPPT}
                    onClose={handleCloseEditor}
                />
            )}

        </div>
    );
  }

  return (
    <div 
      className={`flex-1 h-full flex flex-col bg-skywork-bg transition-all duration-300 relative ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}
    >
      {/* Header (Only visible when not landing) */}
      {!isLanding && (
        <header className="h-16 flex items-center justify-between px-6 border-b border-skywork-border/50 backdrop-blur-md bg-skywork-bg/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <span className="font-medium text-skywork-text">Skywork Chat</span>
             <span className="px-2 py-0.5 rounded text-xs bg-skywork-surface text-skywork-muted border border-skywork-border">
                {modelType === ModelType.FLASH ? 'Standard' : 'Pro Reasoning'}
             </span>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-40 scroll-smooth">
        
        {/* Landing View */}
        {isLanding ? (
          <div className="h-full flex flex-col items-center justify-center pt-[10vh] animate-fade-in w-full max-w-[860px] mx-auto">
            
            {/* Super Agents Badge */}
            <div className="mb-4 flex items-center gap-2 px-3 py-1 rounded-full bg-skywork-surface border border-skywork-border/50">
                <span className="text-sm font-medium text-skywork-text">Skywork Super Agents</span>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 rounded">1.0</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight text-center mb-10 leading-tight">
              Craft Stunning Content,<br/>Present with Impact
            </h1>

            {/* Input Component - Pixel Replica Style */}
            <div className="w-full relative z-20">
                <div className="bg-skywork-surface border border-skywork-border rounded-[20px] shadow-2xl p-4 min-h-[160px] flex flex-col justify-between relative overflow-hidden group hover:border-skywork-border/80 transition-colors">
                    
                    {/* Top Agent Indicator */}
                    <div className="flex justify-center mb-2">
                         {activeAgent ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-skywork-bg border border-skywork-border/50 text-xs font-medium text-skywork-muted animate-fade-in">
                                <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[8px] text-white font-bold">A</div>
                                <span>Agent</span>
                                <span className="text-skywork-border">|</span>
                                <span className="text-[#FF576D]">{activeAgent}</span>
                             </div>
                         ) : (
                             <div className="h-6"></div> // Spacer to keep height
                         )}
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={activeAgent ? "Describe the presentation..." : "Enter your topic and requirements, type @ to reference files..."}
                        className="w-full bg-transparent text-skywork-text placeholder-skywork-muted/70 resize-none outline-none text-lg min-h-[60px] overflow-y-auto text-center"
                        rows={1}
                        autoFocus
                    />

                    {/* Upload PPT Shortcut - Show when Slides agent is selected */}
                    {activeAgent === 'Slides' && (
                        <div className="text-sm mt-3 flex items-center justify-center gap-2" style={{backgroundColor: '#ff000020', padding: '8px', borderRadius: '8px'}}>
                            <span className="text-skywork-muted/70">或者</span>
                            <button
                                onClick={handleUploadPPTImage}
                                disabled={isAnalyzing}
                                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
                            >
                                <Upload size={14} />
                                上传现有PPT图片
                            </button>
                            <span className="text-red-400 font-bold">← NEW!</span>
                        </div>
                    )}

                    {/* Footer Controls */}
                    <div className="flex items-center justify-between mt-4">
                        {/* Left Controls */}
                        <div className="flex items-center gap-2">
                             <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-skywork-bg border border-skywork-border hover:bg-skywork-border/50 transition-colors text-xs font-medium text-skywork-text">
                                <Zap size={14} className="text-yellow-400" />
                                <span>Fast</span>
                             </button>
                             <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF8E6] hover:bg-[#FFF0CC] transition-colors text-xs font-medium text-[#522712] border border-[#FBE851]">
                                <span className="text-lg leading-none">🍌</span>
                                <span>Nano Banana Pro</span>
                                <span className="ml-1 px-1 py-0.5 bg-[#EEE0FF] text-[#7826FF] text-[9px] rounded uppercase tracking-wide">Free</span>
                             </button>
                             <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-skywork-bg transition-colors text-skywork-muted hover:text-white">
                                <Plus size={18} />
                             </button>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-3">
                             <button className="text-skywork-muted hover:text-white transition-colors" title="Link">
                                <LinkIcon size={20} />
                             </button>
                             <div className="w-px h-4 bg-skywork-border"></div>
                             <button 
                                onClick={handleSubmit}
                                disabled={!input.trim()}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${input.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-100' : 'bg-skywork-border/30 text-skywork-muted cursor-not-allowed'}`}
                             >
                                <ArrowRight size={18} />
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent Icons Row */}
            <div className="mt-12 w-full">
                <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                    <AgentIcon 
                        label="General" 
                        color="rgb(51, 133, 255)"
                        icon={
                            <path d="M11.2289 7.6121C11.4226 7.22305 11.9776 7.22305 12.1713 7.61211L13.3456 9.97132C14.2387 11.7655 15.6927 13.2195 17.4869 14.1126L19.8461 15.2869C20.2352 15.4806 20.2352 16.0357 19.8461 16.2293L17.4869 17.4037C15.6927 18.2968 14.2387 19.7507 13.3456 21.545L12.1713 23.9042C11.9776 24.2932 11.4226 24.2932 11.2289 23.9042L10.0546 21.545C9.16145 19.7507 7.7075 18.2968 5.91327 17.4037L3.55406 16.2293C3.165 16.0357 3.165 15.4806 3.55406 15.2869L5.91327 14.1126C7.7075 13.2195 9.16145 11.7655 10.0546 9.97132L11.2289 7.6121Z" fill="white" />
                        }
                        secondaryIcon={
                            <path opacity="0.6" d="M20.3739 3.94761C20.4687 3.75705 20.7406 3.75705 20.8355 3.94761L21.4107 5.1032C21.8482 5.98204 22.5603 6.69422 23.4392 7.13168L24.5948 7.70689C24.7853 7.80175 24.7853 8.07363 24.5948 8.16848L23.4392 8.7437C22.5603 9.18116 21.8482 9.89333 21.4107 10.7722L20.8355 11.9278C20.7406 12.1183 20.4687 12.1183 20.3739 11.9278L19.7987 10.7722C19.3612 9.89333 18.649 9.18116 17.7702 8.7437L16.6146 8.16848C16.424 8.07363 16.424 7.80175 16.6146 7.70689L17.7702 7.13168C18.649 6.69422 19.3612 5.98204 19.7987 5.1032L20.3739 3.94761Z" fill="white" />
                        }
                        onClick={() => { setActiveAgent('General'); setInput("General Help: "); inputRef.current?.focus(); }}
                    />
                    
                    <AgentIcon 
                        label="Documents" 
                        color="rgb(77, 94, 255)"
                        icon={
                            <>
                            <path d="M26.1725 12.6158L24.9883 17.6667C23.9733 22.0288 21.9675 23.7929 18.1975 23.4304C17.5933 23.3821 16.9408 23.2733 16.24 23.1042L14.21 22.6208C9.17124 21.4246 7.61249 18.9354 8.79666 13.8846L9.98083 8.82168C10.2225 7.79459 10.5125 6.90043 10.875 6.16334C12.2887 3.23918 14.6933 2.45376 18.7292 3.40834L20.7471 3.87959C25.81 5.06376 27.3567 7.56501 26.1725 12.6158Z" fill="white" />
                            <path d="M21.1337 12.6961C21.0612 12.6961 20.9887 12.6841 20.9041 12.672L15.0437 11.1857C14.5604 11.0649 14.2704 10.5695 14.3912 10.0861C14.5121 9.60281 15.0075 9.31281 15.4908 9.43364L21.3512 10.9199C21.8346 11.0407 22.1246 11.5361 22.0037 12.0195C21.9071 12.4182 21.5325 12.6961 21.1337 12.6961Z" fill="#4D5EFF" />
                            </>
                        }
                        onClick={() => { setActiveAgent('Documents'); setInput("Analyze this document: "); inputRef.current?.focus(); }}
                    />

                    <AgentIcon 
                        label="Slides" 
                        color="rgb(255, 87, 109)"
                        icon={
                            <>
                            <path d="M18.5547 3.61719C19.645 3.61744 20.792 4.49209 21.076 5.54834L23.5745 14.7267C24.0742 16.5441 22.9387 18.0319 21.0532 18.0319H14.8747V22.7544H17.4997C17.9778 22.7544 18.3744 23.1513 18.3747 23.6294C18.3747 24.1077 17.978 24.5044 17.4997 24.5044H10.4997C10.0215 24.5042 9.62465 24.1076 9.62465 23.6294C9.62493 23.1514 10.0217 22.7546 10.4997 22.7544H13.1247V18.0319H6.94497C5.05957 18.0318 3.92404 16.544 4.42364 14.7267L6.92218 5.54834C7.20616 4.49194 8.35417 3.61719 9.44464 3.61719H18.5547Z" fill="white" />
                            <path d="M10.0036 13.151C9.81708 13.151 9.62172 13.0578 9.48851 12.8714C9.24873 12.5399 9.29311 12.053 9.57729 11.7733L12.3748 9.04877C12.6323 8.80014 12.9609 8.69655 13.2717 8.75871C13.5914 8.82086 13.8667 9.04874 14.0354 9.38024L14.9679 11.1931L17.57 8.66548C17.8542 8.38578 18.2716 8.43755 18.5113 8.76905C18.7511 9.10054 18.7067 9.58743 18.4225 9.86713L15.6251 12.5916C15.3675 12.8403 15.039 12.9438 14.7281 12.8817C14.4084 12.8195 14.1331 12.5917 13.9644 12.2602L13.0319 10.4473L10.4299 12.9749C10.3055 13.0889 10.1546 13.151 10.0036 13.151Z" fill="#FF576D" />
                            </>
                        }
                        onClick={() => { setActiveAgent('Slides'); setInput(""); inputRef.current?.focus(); }}
                    />
                    
                    <AgentIcon 
                        label="Sheets" 
                        color="rgb(41, 204, 95)"
                        icon={
                            <>
                            <path d="M4 8C4 5.79086 5.79086 4 8 4H20C22.2091 4 24 5.79086 24 8V8.5C24 9.32843 23.3284 10 22.5 10H5.5C4.67157 10 4 9.32843 4 8.5V8Z" fill="white" />
                            <rect opacity="0.6" x="4" y="11" width="6" height="6" rx="1.5" fill="white" />
                            <rect x="11" y="11" width="6" height="13" rx="1.5" fill="white" />
                            <rect opacity="0.6" x="18" y="11" width="6" height="6" rx="1.5" fill="white" />
                            <path opacity="0.6" d="M4 19.5C4 18.6716 4.67157 18 5.5 18H8.5C9.32843 18 10 18.6716 10 19.5V22.5C10 23.3284 9.32843 24 8.5 24H8C5.79086 24 4 22.2091 4 20V19.5Z" fill="white" />
                            <rect x="11" y="18" width="6" height="6" rx="1.5" fill="white" />
                            <path opacity="0.6" d="M18 19.5C18 18.6716 18.6716 18 19.5 18H22.5C23.3284 18 24 18.6716 24 19.5V20C24 22.2091 22.2091 24 20 24H19.5C18.6716 24 18 23.3284 18 22.5V19.5Z" fill="white" />
                            </>
                        }
                        onClick={() => { setActiveAgent('Sheets'); setInput("Analyze this spreadsheet: "); inputRef.current?.focus(); }}
                    />
                    
                     <AgentIcon 
                        label="Posters" 
                        color="rgb(255, 120, 42)"
                        icon={
                            <>
                             <rect x="4.19531" y="2.25781" width="19.6094" height="23.4915" rx="3.30327" fill="white" />
                             <path d="M17.7412 4.47656C16.6988 4.47656 15.8536 5.32173 15.8536 6.36414C15.8537 7.4065 16.6988 8.25173 17.7412 8.25173C18.7836 8.25172 19.6287 7.4065 19.6288 6.36414C19.6288 5.32173 18.7836 4.47657 17.7412 4.47656Z" fill="#FCAB7C" />
                             <path d="M6.22007 12.6279C4.46715 16.4673 8.37779 15.9815 10.7694 15.9815H16.5583C21.1198 15.9815 23.5189 16.288 21.4962 12.8746C19.4736 9.46117 19.5296 8.43559 16.0127 10.9015C12.6436 13.2638 12.7263 8.67572 10.7694 7.49929C8.81256 6.32286 7.76238 9.24967 6.22007 12.6279Z" fill="#FA6915" />
                            </>
                        }
                        onClick={() => { setActiveAgent('Posters'); setInput("Design a poster for: "); inputRef.current?.focus(); }}
                    />

                    <AgentIcon 
                        label="Websites" 
                        color="rgb(115, 87, 255)"
                        icon={
                            <>
                            <path d="M23.9811 7.54688V20.8154C23.9811 22.196 22.8616 23.3152 21.4811 23.3154H6.35706C4.97634 23.3154 3.85706 22.1961 3.85706 20.8154V7.54688H23.9811Z" fill="#7357FF" stroke="white" />
                            <rect opacity="0.42" x="5.57324" y="10.4375" width="16.6806" height="3.1276" rx="0.933333" fill="white" />
                            <rect opacity="0.42" x="5.57324" y="15.125" width="14.7828" height="6.25521" rx="0.933333" fill="white" />
                            <path d="M20.2938 16.1868C19.1647 15.5837 17.8616 16.6226 18.1978 17.8576L19.7125 23.421C20.0541 24.6756 21.742 24.891 22.3877 23.7624L23.053 22.5994C23.1402 22.4641 23.2736 22.3651 23.4283 22.321L25.4001 21.7591C26.6623 21.3995 26.8454 19.6865 25.6878 19.0681L20.2938 16.1868Z" fill="white" />
                            <path d="M3.34912 6.60938C3.34912 4.95252 4.69227 3.60938 6.34912 3.60938H21.4709C23.1277 3.60938 24.4709 4.95252 24.4709 6.60937V8.79761H3.34912V6.60938Z" fill="white" />
                            </>
                        }
                        onClick={() => { setActiveAgent('Websites'); setInput("Create a website layout for: "); inputRef.current?.focus(); }}
                    />
                    
                    <AgentIcon 
                        label="Tools Agent" 
                        color="transparent"
                        icon={
                            <>
                             <path d="M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z" fill="white" />
                             <path d="M30.5093 25H28.5117C26.2091 25 25 26.2077 25 28.4971V30.4924C25 32.7923 26.2091 34 28.5011 34H30.4988C32.7908 34 33.9999 32.7923 33.9999 30.5029V28.5076C34.0104 26.2077 32.8013 25 30.5093 25Z" fill="#FFC362" />
                             <path opacity="0.5" d="M19.5093 14H17.5117C15.2091 14 14 15.2077 14 17.4971V19.4924C14 21.7923 15.2091 23 17.5011 23H19.4988C21.7908 23 22.9999 21.7923 22.9999 19.5029V17.5076C23.0104 15.2077 21.8013 14 19.5093 14Z" fill="#00C9A7" />
                             <path d="M29.2487 14.1556C29.352 13.9481 29.648 13.9481 29.7513 14.1556L30.3776 15.4138C30.8539 16.3707 31.6293 17.1461 32.5862 17.6224L33.8444 18.2487C34.0519 18.352 34.0519 18.648 33.8444 18.7513L32.5862 19.3776C31.6293 19.8539 30.8539 20.6293 30.3776 21.5862L29.7513 22.8444C29.648 23.0519 29.352 23.0519 29.2487 22.8444L28.6224 21.5862C28.1461 20.6293 27.3707 19.8539 26.4138 19.3776L25.1556 18.7513C24.9481 18.648 24.9481 18.352 25.1556 18.2487L26.4138 17.6224C27.3707 17.1461 28.1461 16.3707 28.6224 15.4138L29.2487 14.1556Z" fill="#FF4BD5" />
                             <path d="M15 32.3793V26.729C15 25.5464 16.3047 24.8289 17.3033 25.4622L21.9263 28.3941C22.8738 28.9949 22.8504 30.3851 21.8833 30.9538L17.2603 33.6723C16.2604 34.2603 15 33.5394 15 32.3793Z" fill="#FF0033" />
                            </>
                        }
                        onClick={() => { setActiveAgent('Tools Agent'); setInput("Use tools to: "); inputRef.current?.focus(); }}
                        isTool
                    />
                </div>
            </div>

            {/* Template Section with Styles */}
             <div className="w-full mt-16 border-t border-skywork-border/50 pt-8">
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {['All', 'Professional', 'Creative', 'Academic', 'Minimal'].map((cat, i) => (
                        <button key={i} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${i === 0 ? 'bg-skywork-surface text-white border border-skywork-border' : 'text-skywork-muted hover:text-white hover:bg-skywork-surface/50'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {/* Upload Placeholder */}
                     <div className="aspect-[16/9] bg-skywork-surface border border-skywork-border rounded-xl flex items-center justify-center flex-col gap-2 cursor-pointer hover:border-blue-500/50 transition-colors">
                        <Plus size={24} className="text-skywork-muted" />
                        <span className="text-sm text-skywork-muted">Upload Template</span>
                     </div>
                     
                     {/* Dynamic Styles from PPT_STYLES */}
                     {PPT_STYLES.map((style) => (
                        <div 
                            key={style.id} 
                            onClick={() => setSelectedTemplateId(style.id)}
                            className={`aspect-[16/9] bg-skywork-surface border rounded-xl overflow-hidden cursor-pointer group relative transition-all ${selectedTemplateId === style.id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-skywork-border hover:border-skywork-muted'}`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${style.previewColor} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                            
                            {/* Preview Elements */}
                            <div className="absolute inset-4 flex flex-col gap-2 opacity-50">
                                <div className={`h-2 w-1/2 rounded-full ${style.color}`}></div>
                                <div className="h-1 w-3/4 bg-gray-500/50 rounded-full"></div>
                                <div className="h-1 w-2/3 bg-gray-500/50 rounded-full"></div>
                            </div>

                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                <p className="text-sm font-medium text-white">{style.title}</p>
                                {selectedTemplateId === style.id && <CheckCircle2 size={16} className="text-blue-500" />}
                            </div>
                        </div>
                     ))}
                </div>
             </div>

          </div>
        ) : (
          /* Message List */
          <div className="max-w-3xl mx-auto pt-8 space-y-8">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                )}
                
                <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'bg-skywork-surface border border-skywork-border rounded-2xl rounded-tr-sm px-5 py-3 text-skywork-text' : 'text-skywork-text/90 px-1'}`}>
                  {msg.role === 'model' ? (
                    <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-skywork-border max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                      
                      {/* Grounding Sources */}
                      {msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-skywork-border/50">
                          <p className="text-xs font-semibold text-skywork-muted mb-2 flex items-center gap-1">
                            <Search size={12} /> SOURCES
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.groundingMetadata.groundingChunks.map((chunk, i) => (
                              chunk.web && (
                                <a 
                                  key={i} 
                                  href={chunk.web.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-1.5 bg-skywork-surface border border-skywork-border rounded hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors text-xs text-skywork-text group"
                                >
                                  <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] group-hover:bg-blue-500 group-hover:text-white">
                                    {i + 1}
                                  </div>
                                  <span className="truncate max-w-[150px]">{chunk.web.title}</span>
                                  <ExternalLink size={10} className="opacity-50 group-hover:opacity-100" />
                                </a>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>

                {msg.role === 'user' && (
                   <div className="w-8 h-8 rounded-lg bg-skywork-surface border border-skywork-border flex items-center justify-center shrink-0 mt-1">
                     <User size={16} className="text-skywork-muted" />
                   </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <div className="flex items-center gap-1 h-8">
                    <span className="w-1.5 h-1.5 bg-skywork-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-skywork-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-skywork-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area - Floating at bottom (Only for non-landing) */}
      {!isLanding && (
        <div className="absolute bottom-6 left-0 right-0 px-4 md:px-0 pointer-events-none">
            <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className={`relative bg-skywork-surface/90 backdrop-blur-xl border border-skywork-border rounded-[20px] shadow-2xl transition-all duration-300 ${isLoading ? 'opacity-80' : 'opacity-100'}`}>
                
                {/* Input Controls */}
                <div className="absolute -top-10 left-0 flex items-center gap-2">
                   <ModelToggle active={searchMode === SearchMode.ON} onClick={() => setSearchMode(searchMode === SearchMode.ON ? SearchMode.OFF : SearchMode.ON)} label="Web Search" icon={<Globe size={14} />} />
                   <ModelToggle active={modelType === ModelType.PRO} onClick={() => setModelType(modelType === ModelType.PRO ? ModelType.FLASH : ModelType.PRO)} label="Deep Think" icon={<Sparkles size={14} />} />
                </div>

                <div className="flex flex-col p-4">
                   <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Skywork..."
                    className="w-full bg-transparent text-skywork-text placeholder-skywork-muted resize-none outline-none max-h-[200px] min-h-[24px] overflow-y-auto"
                    rows={1}
                    disabled={isLoading}
                    />
                
                    <div className="flex items-center justify-between mt-3 pt-2">
                        <div className="flex items-center gap-2 text-skywork-muted">
                           <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Attach">
                              <Paperclip size={18} />
                           </button>
                           <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Voice">
                              <span className="text-xs border border-current px-1.5 py-0.5 rounded font-medium">Auto</span>
                           </button>
                        </div>
                    
                        <button 
                        onClick={handleSubmit}
                        disabled={!input.trim() || isLoading}
                        className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${input.trim() && !isLoading ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-skywork-border/50 text-skywork-muted cursor-not-allowed'}`}
                        >
                        {isLoading ? <StopCircle size={18} className="animate-pulse" /> : <ArrowRight size={18} />}
                        </button>
                    </div>
                </div>
            </div>
            </div>
        </div>
      )}

      {/* PPT Editor Modal */}
      {editingPPT && (
        <PPTEditor
          initialData={editingPPT}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
};

const AgentIcon = ({ label, icon, secondaryIcon, color, onClick, isTool = false }: { label: string, icon: React.ReactNode, secondaryIcon?: React.ReactNode, color: string, onClick: () => void, isTool?: boolean }) => (
    <div onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer group">
        <div 
            className={`w-[48px] h-[48px] rounded-[14px] flex items-center justify-center relative transition-transform group-hover:scale-105 shadow-lg`}
            style={{ backgroundColor: isTool ? 'transparent' : color }}
        >
             <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className={isTool ? "w-[48px] h-[48px]" : "w-[28px] h-[28px]"}>
                 {icon}
                 {secondaryIcon}
             </svg>
             <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 bg-white rounded-full"></div>
             </div>
        </div>
        <span className="text-sm text-skywork-text group-hover:text-white transition-colors">{label}</span>
    </div>
);

const ModelToggle = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-skywork-surface/50 border-skywork-border text-skywork-muted hover:text-white hover:border-skywork-muted'}`}
    >
        {icon}
        {label}
    </button>
);

export default ChatInterface;