# AGENTS.md

## 项目定位

本项目用于构建和维护 **Haoyang Ling（凌浩洋）的个人网站**，以清晰、可信、易于维护的方式介绍本人及其经历、作品与联系方式。

- 本文件适用于整个项目；子目录如有 `AGENTS.md`，其说明仅细化对应目录的约定。
- 用户当前明确提出的要求优先于本文件中的默认约定。
- Communicate with the user in Chinese by default. The website supports English and Simplified Chinese; maintain both versions together. Use English for new or updated project documentation, code comments, and identifiers unless the user explicitly requests another language.
- When the user provides requirements or content in either language, independently prepare clear, natural English and Simplified Chinese website copy. Preserve the original meaning, factual details, and official spellings of names; do not add unsupported information or require the user to supply a translation.
- 网站所有者姓名使用用户最新指定的 **Haoyang Ling**，中文名为 **凌浩洋**；此拼写依据用户提供的信息，不依据目录名推断。

## Bilingual content maintenance

- Every website content or feature change must update the English and Simplified Chinese versions in the same task. Keep facts, dates, statistics, links, section order, and feature availability consistent across both languages; do not deliver an update in only one language.
- English source content lives in `src/content.ts` and the relevant components. Maintain the corresponding English-to-Chinese entries in `src/locales/zh.json` and render visitor-facing copy with `useLanguage().t`. When changing an English source string, update its translation key and Chinese text together, and remove obsolete keys when no longer used.
- Localize headings, body text, navigation, controls, loading and error messages, image alternative text, accessibility labels, document titles and descriptions, and meaningful canvas/SVG text. Product names, official names, abbreviations, and decorative technical identifiers may retain their official spelling.
- `src/i18n.tsx` owns language switching, the `lang` document attribute, and URL language selection. Preserve section anchors and interaction state when switching. The URL `?lang=en` or `?lang=zh` selects the language; links without a valid language parameter always default to English, regardless of browser language or previously saved preferences.
- Verify both languages after changes. For layout or interaction changes, check Chinese and English at mobile and desktop sizes, including long text, readable Chinese typography, keyboard navigation, and the language switch. Extend the existing language browser tests for new behavior as appropriate.

## 个人信息与内容

- `docs/information/personal-information.md` 是 **Haoyang Ling（凌浩洋）的个人信息资料**，由用户提供，包含联系方式、教育经历、个人能力、工作经历、项目经历及校园活动与领导经历；维护相关内容时应先查阅此文件，并以用户后续提供的最新资料为准。
- 该资料文件用于内容维护；将资料写入文档不代表授权将其中全部信息自动发布到网站，公开展示应遵循用户对具体任务的要求。
- 仅使用用户提供或项目中已有的、可确认的个人信息。
- 不编造教育经历、任职信息、研究方向、论文、奖项、项目成果、技能、照片、社交账号或联系方式。
- 缺少信息时，优先省略尚无内容的区块；确需搭建预览时，使用明确的占位文字，并在交付时说明哪些内容待补充。
- 未经确认的占位文字不得包装成真实履历，也不得随发布操作直接上线。
- 保留姓名、机构、论文与项目名称的准确拼写；修改事实性内容时，以用户提供的最新资料为准。
- 不根据“个人网站”这一定位擅自假设其职业、所属机构或学术身份。简历、论文、博客等栏目按实际资料和需求添加。
- 不将本地文件路径、凭据、未公开资料或其他敏感信息写入公开页面、客户端代码或提交记录。

## 设计与交互

- 禁止使用纯白或形成大片白色观感的浅色背景，包括米白、灰白主区块及卡片；默认采用深色背景。悬停、选中、加载和降级状态同样遵守。浅色文字、细线和小面积图标可以保留。
- 默认采用简洁、专业、重视排版与可读性的视觉风格，让个人介绍和作品内容成为页面重点。
- 项目已有设计时，沿用其字体、颜色、间距、组件与交互习惯；大幅调整视觉方向需有用户需求作为依据。
- 页面必须适配手机、平板与桌面，避免横向溢出、文字过小和拥挤布局。
- 优先使用语义化 HTML，保持标题层级合理、链接含义清楚、键盘可操作、焦点可见及文字对比度足够。
- 为有信息含义的图片提供准确的替代文本；纯装饰图片使用空替代文本。
- 动画应克制，并尊重 `prefers-reduced-motion` 设置；不得妨碍阅读与导航。
- 避免无需求依据的弹窗、自动播放、复杂动效和额外页面流程。

## 技术与代码约定

- 当前项目尚未确定技术栈。首次实现时，按需求选择足够简单、便于部署与维护的方案，不预先假定框架或包管理器。
- 对以内容展示为主的网站，优先评估静态页面或静态生成方案；引入服务端、数据库或内容管理系统应有明确需求。
- 技术栈建立后，遵循已有目录结构、包管理器、锁文件、代码风格和组件约定，避免无关重构。
- 添加依赖前先检查现有能力，避免为简单功能引入体积较大或用途重复的库。
- 内容与布局在适当情况下分离，让个人介绍、经历、作品和链接可以集中维护；不要为单个页面过度抽象。
- 使用清楚的命名与小而明确的组件；注释主要解释必要的背景和设计原因。
- 图片和其他静态资源使用可维护的本地路径或可靠来源；控制文件体积，为非首屏图片按需启用懒加载。
- 不擅自接入访问统计、广告、第三方追踪或需要收集访客数据的服务。
- 修改应围绕当前任务展开，保留用户已有工作，不覆盖无关文件。

## 开发与验证

- 开始修改前，先阅读相关源码、项目说明、依赖配置和适用的目录级指令。
- 项目初始化后，在 `README.md` 中记录实际使用的安装、开发、构建和预览命令，以及主要内容的维护位置。
- 以项目实际存在的脚本为准，不假定 `npm run dev`、`npm run build` 或其他命令已经可用。
- 功能或代码变更后，运行与改动相关且项目已有的检查，例如构建、类型检查、代码检查或测试。
- 页面布局和交互变更后，在环境允许时进行浏览器验证，至少检查手机与桌面尺寸、导航、链接、图片加载、键盘操作和控制台错误。
- 检查实际涉及的内容问题：姓名拼写、占位文字、无效链接，以及页面存在下载入口时对应文件是否可用。
- 对简单文案、样式或文档修改，采用与风险相称的验证，不为了形式添加测试或工具链。
- 无法执行的验证应明确说明原因，不将未运行的检查描述为通过。

## 交付与发布

- 完成任务时，用中文简要说明改动内容、涉及文件、验证结果及仍需用户补充的信息。
- 涉及部署时，先识别已有托管平台和发布配置，不擅自假设域名、平台或线上环境。
- 发布、修改域名、接入外部服务等操作应在用户已授权的范围内执行；用户已明确授权的操作无需重复询问。
- 需要用户决策时，先完成不依赖该决策的工作，并提供具体、可审阅的结果。
