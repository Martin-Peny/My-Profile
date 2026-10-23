# Haoyang Ling — Enter the Frequency

## Repository

The GitHub repository is https://github.com/Martin-Peny/My-Profile. The local `main` branch tracks `origin/main`. To commit and push future changes:

```sh
git add .
git commit -m "Describe the change"
git push
```

Original photographs (`photo/` and `scripts/assets/`), private reference documents (`docs/information/`), environment files, dependencies, build output, and QA artifacts stay local and are ignored by Git. The ready-to-use website assets in `public/` are included, so a fresh checkout can build without private source material. Regenerating image assets requires the original local source files.

音乐人 Haoyang Ling 的个人网站。以参考图中的工业科幻、设备线框、工程标注、网格与高对比排版为视觉基础，使用炭黑背景、红色强调色与浅灰文字。

## English and Simplified Chinese

Use the **中文 / EN** button in the header to switch languages without leaving the current chapter. Share `/?lang=zh` for Simplified Chinese or `/?lang=en` for English. Links without a valid language selection always open in English, regardless of browser language or previously saved preferences. Language selection stays in the URL across reloads and preserves other query parameters and section anchors.

`src/i18n.tsx` provides the shared language state, updates the document language, title, and description, and handles URL selection. Keep English source copy in `src/content.ts` and the corresponding components, and maintain its Chinese translations in `src/locales/zh.json`. Use `useLanguage().t` for visitor-facing copy, including accessibility labels, image descriptions, control states, and meaningful 3D book text. Update source strings and translation keys together whenever copy changes. Both languages must receive content and feature updates in the same task, as required by `AGENTS.md`.

Run `npm run build` and `npx playwright test tests/language.spec.ts` to verify the English default, language switching, shared links, localized metadata, interactive content, and responsive layouts. The language tests save Chinese previews to `artifacts/chinese-{width}.png`.

## 本地运行

需要 Node.js 20.19+ 或 22.12+，使用 npm：

```sh
npm install
npm run dev
```

开发地址以终端输出为准，默认是 `http://127.0.0.1:5173`。

```sh
npm run build
npm run preview
npm run test:e2e
```

`build` 会运行 TypeScript 和 Vue 类型检查并构建到 `dist/`。`preview` 预览构建产物，默认端口为 4173。可将 `dist/` 部署到支持静态网站的托管平台。目前未配置或执行线上发布。

`test:e2e` 先构建网站，再使用本机 Google Chrome，自动启动 5199 端口上的独立生产预览服务，检查桌面和移动布局、整卡锚点导航、目标区块焦点、键盘操作、深色表面及悬停状态、地形动画离屏暂停、减少动态效果与 WebGL 降级/恢复。截图输出到 `artifacts/desktop.png`、`artifacts/mobile.png`、`artifacts/explore-desktop.png` 与 `artifacts/explore-mobile.png`（第二部分局部预览），以及 `artifacts/explore-desktop-full.png` 与 `artifacts/explore-mobile-full.png`（整页预览）。如果默认开发端口已被其他项目占用，可运行 `npm run dev -- --port 5198 --strictPort` 并访问终端显示的地址。

## 技术与维护

- **React + TypeScript**：整站布局、导航、个人内容卡片与经历区块。
- **WebGL navigation art**: Three.js renders procedural identity plates, a microphone, and an open book with dark surfaces, red contours, and muted engineering lines. Local SVG illustrations provide the grid, annotations, loading fallback, reduced-motion view, and WebGL failure fallback. No external model, image request, or new dependency is required.
- **Three.js**：用户提供的人像照片配合手工设计的深度图和细分网格，形成可交互浅浮雕；WebGL 不可用时显示同一张本地透明照片。
- 原声音控制台已从页面移除。`src/SoundLab.vue`、旧声音配置及相关依赖保留为未挂载的历史实现，不参与当前页面运行；本次没有清理依赖。Vue 类型检查仍包含在构建命令中。
- 字体通过 npm 安装并本地打包，不依赖外部字体请求。不接入统计、追踪、服务器或数据库。

| 文件                   | 维护内容                         |
| ---------------------- | -------------------------------- |
| `src/content.ts`       | 姓名、身份、三张导航卡片与经历内容         |
| `src/App.tsx`          | 页面结构、导航、主要文案         |
| `src/SiteFooter.tsx` / `src/SiteFooter.css` | Closing copy, portrait background, chapter navigation, and responsive footer layout |
| `public/images/footer-portrait.webp` | Optimized user-supplied red portrait for the footer background |
| `src/CreativeProjects.tsx` / `src/CreativeProjects.css` | Unmounted historical creative module; no longer displayed or imported by the page |
| `docs/creative-projects.md` | Creative module sources, confirmation dates, links, and maintenance instructions |
| `src/styles.css`       | 色彩、布局、响应式与减少动画设置 |
| `src/HeroPortrait.tsx` / `src/PortraitFallback.tsx` | 3D 人像、交互及静态照片降级 |
| `scripts/prepare-portrait.py` | 人像裁切、透明杂点处理、深度图生成 |
| `public/images/hero-portrait.webp` / `public/images/hero-portrait-depth.png` | 首屏透明人像及同尺寸深度图 |
| `src/TechnicalArt.tsx` | 轨道图、波形与旧声音实验插图       |
| `src/Topography.tsx` / `src/react-bits/Topography.jsx` / `src/react-bits/Topography.css` | EXPLORE adapter, React Bits terrain renderer, and styles |
| `src/LiquidEther.tsx` / `src/LiquidEther.css` | Hero 红色流体背景、鼠标交互及静态降级 |
| `src/NavigationArt.tsx` / `src/NavigationModels.ts` / `src/NavigationArtFallback.tsx` | WebGL navigation lifecycle and interactions, procedural 3D models, and original SVG fallback/annotations |
| `src/AcademicWorkbench.tsx` / `src/AcademicWorkbench.css` | Academic workbench, accessible book controls, fallback illustration, and education/research content below MY LIFE |
| `src/AcademicScene.tsx` | Three.js matte charcoal microphone/headphones, fine red accents, desk lighting, and shadows |
| `src/AcademicBookModel.ts` | Physical hardback geometry, local cover/paper textures, red foil artwork, binding, and hinged cover animation |
| `src/SoundLab.vue`     | 未挂载的历史音频控制台           |
| `index.html`           | 标题、语言、SEO 描述             |

## 个人内容导航

The three cards in `#explore` are **Introduction, My life, and Academic Experience**, linking to `#introduction`, `#my-life`, and `#academic-experience`. The section retains its red topographic background, dark cards, engineering annotations, and three-column layout, switching to a single column at 760px and below. Maintain card titles, descriptions, labels, icons, and anchors in `src/content.ts` under `profileSections`. My life opens the existing vinyl section before the ACADEMIC workbench. Academic is the final content section and leads directly into the portrait footer. The workbench is a large square scene with a slightly angled perspective camera, a dark tabletop with visible corners and thickness, and perpendicular red grid lines on the tabletop. Its closed hardback rises and enlarges into a four-page notebook, with all copy and page controls on the book itself.

`NavigationArt({ icon })` retains the existing `ProfileIcon` contract. Each card renders a perspective WebGL model in a 360:260 frame: three offset identity plates with a generic faceted profile, a tilted microphone with a curved grille and spatial orbit, or an open book with layered pages and a red spine. Opaque dark surfaces occlude rear lines; thin additive red accents provide restrained local glow without a bloom pass. The original SVG grid and figure labels remain visible behind the model.

Models float on an eight-second cycle with a vertical amplitude of 0.035 scene units and a base sway below three degrees. Pointer movement across a card adds up to ±10° yaw and ±6° pitch, with smooth interpolation and a return to neutral on exit. Hover and keyboard focus brighten the red outlines. Canvas elements are decorative, do not receive pointer events, and add no keyboard stops: each card remains one link, and Enter moves focus to its destination section. Touch gestures retain ordinary page scrolling without pointer-driven model rotation.

Model code and each independent WebGL renderer initialize when their illustration comes within 160px of the viewport. Animation runs only while the illustration is visible and the document is in the foreground, capped at 30 rendered frames per second and a device pixel ratio of 1.5. The SVG remains visible until the first successful WebGL frame; initialization failure or context loss restores it, and context restoration rebuilds the scene. Reduced motion uses the original static SVG without allocating a card renderer. Cleanup releases geometries, materials, renderers, observers, and listeners, including React StrictMode replay.

`tests/navigation-art.spec.ts` covers lazy rendering, pointer limits and reset, keyboard navigation, offscreen/background pause, context recovery, reduced-motion toggles, responsive sizing, and touch scrolling. Screenshots are saved to `artifacts/navigation-webgl-{width}.png` for 320, 390, 768, and 1440px, plus `artifacts/navigation-webgl-hover.png`. Run `npm run test:e2e` for the production build and complete browser regression suite.

Introduction now displays a three-row photo gallery with slow automatic horizontal movement. Academic content uses only the education and research interests supplied in `docs/information/personal-information.md` and the existing introduction copy; no publications, awards, or unsupported academic claims are added.

## Hero 人像

The portrait preparation script removes the blue spill around the hair, darkening affected hair pixels and fading translucent halo pixels without adding a colored rim. Regenerating the assets retains this cleanup for both the interactive portrait and its static fallback; the source photograph remains unmodified.

Hero 使用用户提供的红色外套、手持麦克风人像。原始照片保存在 `scripts/assets/portrait-source.png`，不随静态站点发布。使用 Python 及 Pillow 运行 `python scripts/prepare-portrait.py` 可重新生成 630 × 997 的透明 WebP 和灰度深度图；照片约 104 KB，深度图约 46 KB。裁切框和头发、面部、肩臂、手及麦克风的平滑深度参数集中在脚本中。这是按原照片设计的浅浮雕，不补全侧面和背面。

`src/HeroPortrait.tsx` 使用现有 Three.js 将深度图映射到 96 × 152 段网格，照片保持原色。鼠标跟随最大横向 ±4°、纵向 ±3°；拖动最大横向 ±9°、纵向 ±5°，松手或离开后回正。触屏只启用横向拖动，通过 `touch-action: pan-y` 保留纵向页面滚动。Tab 可聚焦交互区，方向键调整角度，Home / Escape 回正；失焦也回正。人像操作不触发流体背景扰动。

静态照片在加载时始终可见，纹理与深度图加载且 WebGL 首帧完成后切换为立体效果。无 WebGL、初始化失败、深度图失败或上下文丢失时保留照片；上下文恢复后重新初始化。开启减少动态效果时不创建人像画布，隐藏交互提示并移除交互焦点。像素比上限 1.5，只在交互、缓动、恢复或调整尺寸时绘制；离屏与页面隐藏时暂停，卸载时清理纹理、网格、材质和监听器。

人像回归测试在 `tests/portrait.spec.ts`，覆盖拖动限幅、键盘、真实触摸滚动、静止与离屏暂停、上下文恢复、深度图失败及减少动态效果。构图截图保存为 `artifacts/hero-portrait-{width}.png`，其中 width 为 320、390、768、1024、1440；交互截图为 `artifacts/hero-portrait-interactive.png` 与 `artifacts/hero-portrait-mobile-interactive.png`。

## Hero 流体背景

Hero 接入 React Bits 的 `LiquidEther`，使用 WebGL 2 流体模拟，不新增依赖。参数集中在 `src/App.tsx`：配色 `#f4072e` / `#f40808` / `#f70f13`，鼠标力度 20、半径 100、持久度 0.75、分辨率 0.5、自动速度 0.5、自动强度 2.2、亮度 1、黏度 0，启用自动演示、入场和点击扩散，关闭边缘反弹与浅色模式。背景铺满 Hero 的实际高度；`src/styles.css` 中的 `.hero::after` 用暗色遮罩保持标题和按钮可读。

流体监听 Hero 区域，链接、按钮和人像交互区不触发扩散，触屏滑动不注入鼠标扰动。区块离屏或页面隐藏时暂停，系统开启“减少动态效果”时改用静态红色渐变。WebGL 2 / 浮点渲染不可用或上下文丢失时使用同一深色降级背景；上下文恢复后重新初始化。组件卸载时清理事件、观察器、动画和 GPU 资源。来源及许可全文见 `public/THIRD_PARTY_NOTICES.md`。端到端测试另输出 `artifacts/hero-liquid-ether-desktop.png` 与 `artifacts/hero-liquid-ether-mobile.png`。

## 深色背景与地形效果

全站避免纯白、米白或大片灰白背景，包括卡片、悬停、选中、加载和降级状态。浅色仅用于文字、细线与小图标。`src/styles.css` 中的 `--text-primary` / `--text-secondary` 管理文字，`--surface` / `--surface-card` / `--surface-hover` 管理深色表面。

The EXPLORE background uses the React Bits **Topography JS-CSS** component fetched from https://reactbits.dev/r/Topography-JS-CSS.json. The registry lists no dependencies or registry dependencies, so no packages or shadcn configuration are needed. The original JavaScript renderer and plain CSS live in `src/react-bits/Topography.jsx` and `src/react-bits/Topography.css`; a declaration file exposes its props to the TypeScript application.

`src/App.tsx` configures the requested red `#fa0f0f` terrain: 22 contour levels, line width 1.2, elevation 1, foreground 0.2, tilt 32, forward speed 0.25, glow 0.6, depth of field 0.4, fog 0.35, hover lift, and click pulse. Other settings retain the registry defaults. The background fills the actual EXPLORE section, including its taller mobile layout, rather than using the documentation's fixed 600px demo container. The dark gradient overlay preserves text contrast without obscuring the terrain.

`src/Topography.tsx` is a small site adapter that retains the SVG fallback and observes readiness, visibility, context loss, and system motion preferences. The renderer uses its original native WebGL 2 terrain, contour sampling, lighting, bloom, depth of field, and fog. It pauses animation while offscreen or when the document is hidden. Changes to reduced motion remount the renderer in its static mode and disable pointer effects. Unsupported WebGL 2 or shader initialization failure shows the local SVG; context loss shows the same fallback until restoration.

The registry renderer has four small integration changes: an optional first-paint/frame callback for fallback visibility, pointer filtering for site controls and touch scrolling, a static render path that avoids animation frames under reduced motion, and omission of forced context loss on cleanup so React StrictMode replay and context restoration can reinitialize safely. GPU resources, observers, and listeners still use the registry cleanup. Source attribution and the React Bits license are included in `public/THIRD_PARTY_NOTICES.md`.

## 内容边界

目前确认姓名 **Haoyang Ling**、音乐人身份及用户提供的 Hero 人像。页面中的标语为设计文案；舞台与学术经历区块明确标注待补充。未添加未经提供的真实作品、专辑、演出、履历、社交链接或联系方式。获得真实素材后，可补充个人介绍及对应的真实经历。

## Floating record player and playlist

`src/BackgroundMusic.tsx` and `src/BackgroundMusic.css` manage the floating black-and-red record. The collapsed widget is only a circular record (68px on desktop, 56px on phones), with no rectangular container, caption, or separate playback button. Click the record to open the playlist and playback controls. The record rotates only during actual playback and stops at its current angle when paused. Reduced motion keeps it still. The panel closes with the record, its Close button, an outside click, or Escape; closing does not stop playback. Language switching retains the open panel and audio state. It starts at the left edge, vertically centered in the viewport, with a 20px desktop or 12px phone margin and device safe areas. Drag the record with a mouse, pen, or touch to reposition it; release leaves it in place for the current page session. A movement threshold separates dragging from clicking. The circle stays within the visible viewport when dragged or resized. The playlist opens beside the circle when space permits, or above/below on narrow screens, and remains within the viewport. Dragging, scrolling, and language switching preserve audio state; reloading restores the default left-center position. Playback errors are announced accessibly while collapsed; expand the record to see error details and retry.

`src/music.ts` exports `MusicTrack` and the ordered `musicTracks` array. The first entry is the existing user-supplied `public/audio/background-music.mp3`, labelled only as background music. The following entries are the user-supplied recordings **崇拜**, **去北极忘记你**, **水星记**, and **用背脊唱情歌**, streamed from their Aliyun OSS HTTPS URLs; their original song titles are preserved in both languages. Add recordings to `public/audio/` or use a direct HTTPS audio URL, then append entries to the array. Local paths are relative to `public/`, without `public/` in the configured URL, and respect Vite's deployment base path. Each entry needs a unique, stable `id`, its real `title`, and `src`; `performer` and `cover` are optional. Store cover images in `public/images/` and configure their relative paths. Missing covers use the CSS record artwork. No performer credits have been assumed.

The player reads durations from the selected audio file. It supports playlist selection, previous/next, seeking, volume, mute, ordered repeat, shuffle without repeating a track within a round, and repeat-one. Previous follows playback history, including shuffle history. Search filters visible song titles without changing playback or its queue. The list scrolls separately, and unselected recordings are not preloaded. An empty array displays an empty playlist and disables transport. Keep song names in their original spelling; add English-to-Chinese mappings in `src/locales/zh.json` when a bilingual title is needed. All player controls and feedback use the shared language provider.

Music attempts to play the first track automatically when the page opens, at an initial volume of 35%. If the browser blocks audible autoplay, the first click outside the player or an Enter/Space keypress starts playback; Play can also start it directly. These interaction listeners are removed once playback starts or the visitor explicitly controls playback, so a later pause stays in effect. Playback continues across section navigation and language switching. Playback failures leave retry and other songs available. Reloading starts again with the first track; playback history is not stored between visits. No external audio service or additional runtime dependency is used.

The waveform between the Hero title lines follows actual background music playback: it pulses continuously while playing and becomes a slightly thicker, flat dashed line when paused or playback fails. The dashed line uses the same segments as the animated waveform. The system's reduced motion preference keeps the waveform static even during playback.

Run `npm run build` and `npx playwright test tests/background-music.spec.ts tests/music-player.spec.ts tests/language.spec.ts` to verify playback and localization. Playwright starts the production preview on port 5199 and a Vite development server on port 5200 for the isolated multi-track fixture in `tests/fixtures/`. The fixture uses test-only titles and references the existing recording; it is not included in the production build or playlist.

## Logo assets

The header, footer, browser tab, and Apple touch icon use the supplied pixel-art portrait with a transparent background. The preparation script removes the black backdrop and detached bottom emblem, preserves the portrait's original colors and pixel contours, and centers the portrait on a square canvas with a small transparent margin. The original image is stored in `scripts/assets/logo-source.jpg` and is not included in the published site. Run `python scripts/prepare-logo.py` with Pillow installed to regenerate `public/images/logo.png` (full-resolution transparent cutout), `public/images/logo.webp` (256 × 256), `public/favicon.png` (48 × 48), `public/favicon.ico` (16, 32, 48, and 64 px), and `public/apple-touch-icon.png` (180 × 180). All generated formats preserve transparency. Page logos are rendered by `Mark` in `src/icons.tsx`; browser icon links are maintained in `index.html`.

## 手动验收

在桌面和手机尺寸检查主导航、三张卡片的图标区/标题区/底部箭头点击、三个内容区块和返回导航链接，确认所有目标无遮挡、无横向溢出、无控制台错误。使用 Tab / Enter 检查整卡焦点和跳转后的目标焦点；开启减少动态效果时检查静态立体图标与即时锚点跳转。无 WebGL 时应保留透明人像照片、静态地形及完整可用的 SVG 导航卡片。

## Introduction photo gallery

The `#introduction` anchor and the Introduction navigation labels remain available. Its **INTRODUCTION** section contains three full-width rows: landscape images in the top and bottom rows and portrait images in the middle row all move left. GSAP moves each row automatically at 18 pixels per second, independently of the mouse and page scroll direction. Two identical sequences form a continuous loop. Rows are 320–420 pixels tall on larger screens and 220–280 pixels tall on phones; photographs keep their original proportions. Four decorative red text tickers frame the rows: one above, one in each gap, and one below. Each ticker moves right on a 48-second loop using two identical sequences, each at least as wide as the viewport. Tickers retain the original wording and are 55px tall on desktop and 45px on phones. The gallery and tickers stay in normal page flow without pinning; there is no fixed bottom ticker or reserved footer space. The hero fills the viewport below the header.

The **PAUSE GALLERY / RESUME GALLERY** button controls all three photo rows and all four tickers. Animation also pauses while the gallery is offscreen or the document is hidden. A resize rebuild preserves each track's loop progress. React cleanup reverts local GSAP animations, media queries, observers, and listeners. Tickers are hidden from assistive technology, add no keyboard stops, and remain still when reduced motion is enabled.

- `src/PhotoGallery.tsx`: rendering, responsive image sources, reduced-motion behavior, and scoped GSAP lifecycle.
- `src/gallery-images.json`: generated image IDs, row assignments, original dimensions, English alternative text, and WebP variants. Resource URLs contain no local source paths.
- `scripts/prepare-gallery.py`: source selection and image preparation. Maintain its `DESCRIPTIONS` dictionary when adding photographs; unknown descriptions stop generation rather than inventing content.
- `photo/`: original, unmodified source photographs. Only optimized assets in `public/images/gallery/` are part of the deployed gallery.

Regenerate assets and the manifest with Python and Pillow, as used by the existing portrait preparation script:

```sh
python scripts/prepare-gallery.py
npm run build
npm run test:e2e
```

After EXIF orientation correction, width/height ratios of 1.25–1.90 qualify as landscape and 0.60–0.80 as portrait. Files are sorted by filename; landscape images alternate between the top and bottom rows. Portraits use a seeded shuffle (`20261018`) so the middle row has a mixed order that stays stable across reloads and asset regeneration. The current 54 sources produce 24 landscape images (12 per outer row), 25 portrait images, and five exclusions. The excluded filename suffixes are `231526_190`, `232942_303`, `233013_848`, `233034_698`, and `233127_597`. Generated WebP variants have heights of 420 and 840 pixels, never upscale the source, and contain no source metadata. Images retain their original proportions and reserve layout space before lazy loading.

When reduced motion is enabled, the rows become static horizontal scroll regions. Touch swipes, horizontal trackpad scrolling, scrollbars, and the left/right arrow keys after focusing a row provide access to the photographs. Changing the system preference restores or removes automatic animation without reloading the page.

`tests/gallery.spec.ts` verifies row assignment, resource loading, photo and ticker directions, ticker placement and seams, pause/resume, offscreen and background suspension, edge-to-edge responsive layouts, reduced-motion browsing, and preference changes. Gallery screenshots are saved under `artifacts/gallery-{width}.png`, with focused gallery previews under `artifacts/gallery-tickers-{width}.png`.


## About Me portrait and My Life vinyl

The Introduction gallery uses a dark red-tinted background (`#180f11`) with a soft red radial gradient. It is followed by a full-width About Me section with a matching subtle red tint (`#180f11`) and gradient with a minimum height of `100svh`. `GalleryContentSpace` pairs a red halftone portrait on the left with the introduction in the selected language on the right. The layout uses a 42:58 column ratio, excluding the gap, and stacks the portrait above the text at 1000px and below. Portraits retain their complete 3:4 frame with contain fitting, a maximum height of 760px, and a maximum width of 520px in the stacked layout. Edit the introduction in `src/content.ts` under `aboutMe`.

`src/AboutEarphones.tsx` adds two red outlined earbuds with moderately long cables descending from the upper right, with a gentle curve toward the lower left. The earbuds end at different heights along the right side, leaving the bottom clear. A responsive SVG draws the cables; separate SVG earbuds retain their proportions at the cable endpoints. Fine construction marks and a subtle red glow retain the technical line style. Desktop text reserves a right gutter. At 1000px and below, the decoration becomes a compact overlay in the upper-right corner beside the portrait. The decoration stays static, ignores pointer input, and is hidden from assistive technology. `src/GalleryContentSpace.tsx` mounts it across the section; placement, endpoint coordinates, and responsive sizing are maintained in `src/styles.css`.

`src/HalftoneReveal.tsx` and its CSS adapt the user-supplied WebGL 2 shaders: red `#fa0f0f` circular dots on `#080808` within the person's silhouette, 6px cells, a 45-degree screen angle, and luminance-based dot density independent of ink hue. The source alpha matte clips both the print and color reveal; a transparent WebGL canvas with premultiplied edges lets the section background show around the person. The original image appears during loading, keyboard focus, or WebGL failure, and is hidden while the effect is ready to avoid doubling translucent edges. Mouse movement reveals the original color photograph with a soft, fading trail. A click creates an expanding reveal ring. The brush radius is 160px on larger screens and 96px at 760px and below. A touch tap creates a ring; a vertical swipe remains normal page scrolling. Keyboard focus shows the original color portrait with a visible focus outline. Automatic wandering is disabled.

The renderer sleeps when idle, offscreen, or in a hidden tab. Reduced motion renders a static halftone with no entrance, trail, or burst, including live preference changes. The transparent original photograph stays beneath the canvas during loading and when WebGL initialization fails or its context is lost; restoration initializes the renderer again. Effects use local resources and add no runtime package or external image request.

The cutout source is `photo/微信图片_2026-10-17_231547_909.jpg`. `scripts/prepare-about-portrait.py` combines a local U²-Net session with source-specific hair/body foreground constraints, GrabCut, and closed-form edge matting to extract the whole person while preserving the source RGB pixels exactly in `public/images/about-portrait.png`. The optimized `public/images/about-portrait.webp` is used on the site. The source is never modified or uploaded, and generated files contain no source metadata. Regenerate with an isolated Python environment (PowerShell):

```powershell
python -m venv artifacts/portrait-tools
.\artifacts\portrait-tools\Scripts\python.exe -m pip install "rembg[cpu]" opencv-python-headless
.\artifacts\portrait-tools\Scripts\python.exe scripts/prepare-about-portrait.py
```

The model is read from rembg's local model cache (or `U2NET_HOME`). If absent, rembg downloads the U²-Net model once; it does not upload the photograph. Tool dependencies and model files are not part of the website. The script saves an original/black/deep-gray comparison to `artifacts/about-portrait-cutout-qa.jpg` and verifies the PNG's RGB pixels and alpha range.

`src/App.tsx` places a dedicated `#my-life` section immediately after About Me and before the Academic workbench. The section uses a dark red-tinted background (`#180f11`) with a soft red radial gradient, with the bold uppercase “MY LIFE” heading on the left and the record on the right at desktop and mobile sizes. Its heading shares the `chapter-title` typography with ABOUT ME, including the condensed display font, responsive sizes, spacing, and red final word. Its responsive layout and typography are maintained in `src/styles.css`. `src/VinylRecord.tsx` and `src/VinylRecord.css` retain the existing black-and-red CSS grooves, reflections, label, 30% crop above and to the right, and 24-second clockwise rotation. Its desktop diameter is `clamp(640px, 86vw, 1360px)`; phones use `clamp(336px, 100vw, 736px)` to preserve the side-by-side layout. The record sits flush with the right edge of the viewport, without right padding. The record ignores input, is hidden from assistive technology, and pauses offscreen, in hidden tabs, and under reduced motion. Campus & Music no longer reserves space for the record.

My Life has its own minimum height of `100svh`, with vertically centered content and responsive top and bottom padding comparable to Introduction. The Academic workbench is a full-width sibling immediately after My Life, so its height does not count toward My Life's minimum height.

`tests/about-portrait.spec.ts` checks responsive layout, section order, the dark red-tinted My Life background, color reveal, tap/scroll handling, keyboard focus, motion preferences, visibility suspension, and WebGL loss and recovery. About Me and My Life previews are saved as `artifacts/about-me-{width}.png` and `artifacts/my-life-{width}.png`.

## Gallery corner lighting

The gallery uses the React Bits SideRays shader in a decorative 600px-high overlay anchored to the top right of the introduction section. The requested red colors (#e91212 and #f4072e) and all effect settings are configured in src/App.tsx. src/SideRays.tsx and src/SideRays.css contain the renderer and static fallback; .gallery-rays in src/styles.css controls its placement and bottom fade. The light uses screen blending, preserves text and control readability, and does not intercept input.

Animation pauses offscreen and while the document is hidden. Reduced motion renders a still frame and disables mouse tracking, including when the preference changes while the page is open. Touch input does not steer the light. Unsupported WebGL 2 or context loss displays a static red glow; context restoration rebuilds the renderer. No package was added. Attribution and license terms are included in public/THIRD_PARTY_NOTICES.md.


## Physical academic book

`src/AcademicBookModel.ts` builds a portrait hardback inside the existing Three.js desk scene. Separate bevelled cover boards, 23 paper signatures, a bound spine, headbands, fore-edge piping, and a ribbon bookmark create actual depth. The front cover uses locally generated dark leather grain, bump and roughness maps, and red printed rules and typography. No external texture or model requests are made. The dark endpapers stay within the site's red/black palette.

The model is closed initially at its original base size, with a matching contact shadow and fallback footprint. Hover or keyboard focus lifts the complete book slightly. Activating the transparent `.academic-book` button starts a reversible 1.9-second animation: the book rises 2.1 scene units, enlarges toward the end of the flight to as much as 235%, turns toward the reader, and unfolds around the left binding. All notebook copy is printed directly into four high-resolution book textures. The first spread contains education and skills on the left and research interests on the right. The second contains research projects on the left and professional experience on the right. A double-sided sheet turns around the spine in 0.85 seconds and supports reversing direction. There is no separate visible content panel or external button bar. The stage, camera view, tabletop, and props retain their dimensions and placement throughout opening and closing. Only the book enlarges, extending slightly beyond the stage border on desktop while staying within the browser viewport. Phones use a smaller responsive open scale. The original closed-book size is preserved, and opening introduces no internal scrolling or automatic viewport movement.

Click the right page, guided by a gently blinking `>>`, to advance; click the left page to return. A `close` control (localized as `关闭` in Chinese) is printed into the upper-right page texture, sharing the paper's perspective and lighting. A transparent hit area with a minimum 44px target and visible keyboard focus returns focus to the closed-book button. These transparent interaction regions are projected from book coordinates on every rendered frame, so they track opening, resizing, and the physical page positions. Keyboard activation works with Enter and Space; Left/Right change spreads, and Escape closes the book when a book control has focus. Reduced motion snaps the book and sheet directly into place and keeps the chevrons static. Language changes and WebGL restoration preserve the selected spread. Equivalent semantic HTML stays visually hidden while WebGL works and appears inside the book area during failure.

Maintain the English notebook copy in `src/content.ts` under `academicNotebook` and its Chinese translations in `src/locales/zh.json`. `src/AcademicBookModel.ts` wraps and fits the full text inside each page frame, including all nine experience bullets and dissertation statistics. `src/AcademicPages.tsx` provides the same content for assistive technology and the fallback. The admission year is omitted because it has not been supplied; the degree shows only its July 2026 end date. The two skill notes explicitly identify the responsibilities that remain to be confirmed.

`src/AcademicScene.tsx` initializes the renderer near the viewport, draws only when resizing or responding to book/prop interaction, and sleeps when settled, offscreen, or in a hidden document. The camera is about 33 degrees from vertical; the tabletop, grid, note cards, and objects share the same perspective and shadows. An oversized transparent canvas extends the original camera view so the book can cross the stage border while the desk keeps its size. Projected mesh bounds keep the HTML interaction regions aligned throughout the book's flight and on resize. Reduced motion shows the same physical geometry while snapping directly to the requested position and scale. Context restoration rebuilds the book and preserves its open state. Geometries, textures, shadow maps, renderers, observers, and listeners are released on cleanup.

The smaller microphone sits in the lower-left corner and the headphones in the upper-right corner. Both props lift slightly on pointer hover or visible keyboard focus; they have no click action or disclosure. Touch input preserves ordinary scrolling. Both props share charcoal surfaces, muted metal details, and fine red piping with the book. The microphone has a spherical grille and the headphone arch connects to both earcups. Small dark note cards are real desk objects and are naturally occluded by the raised book. The contact shadow stays on the tabletop and fades as the book rises.

After building, run `npx playwright test tests/academic-book.spec.ts` for book-specific browser checks: gradual flight and enlargement, reversal, the physical hinge, prop hover/focus without opening content, pointer/keyboard interaction, idle rendering, unchanged stage and prop geometry during opening and closing, slight desktop book overhang, and proportional closed/open layouts in both languages at 320/390/768/1440/1920px, live reduced-motion changes, and context loss/restoration. Screenshots are saved as `artifacts/academic-book-3d-closed.png`, `artifacts/academic-book-3d-open.png`, `artifacts/academic-book-3d-{language}-{width}.png`, and `artifacts/academic-book-3d-open-{language}-{width}.png`.

## Portrait footer

The page ends after the Academic workbench. The former Creative Projects section (including FIND MY FREQUENCY and ON STAGE. IN THE TEAM.) and the separate About closing strip are no longer mounted. Their source content is retained for maintenance, and their CSS is not imported into the running site.

`src/SiteFooter.tsx` contains the localized closing message, existing pixel portrait logo, internal chapter links, Back to Explore, Back to Top, and the automatically updated copyright year. `src/SiteFooter.css` keeps the supplied red portrait centered, using dark edge gradients and a 10px image blur for readable text without covering the central face with copy. A 4% image overscan and clipped footer edges keep the blur from exposing an image border; text, logos, and navigation remain sharp. Desktop content sits to either side; at 760px and below the portrait appears above the copy and navigation. Bottom padding leaves room for the fixed music control. The static footer adds no animation, external service, or dependency.

`public/images/footer-portrait.webp` is a metadata-free 2022 × 778 WebP derived from the user-supplied PNG at quality 90 (approximately 199 KiB). It loads lazily as a decorative image, keeping the dark footer and its text usable before the image loads. The original supplied image is not modified.

After building, run `npx playwright test tests/footer.spec.ts` to check section removal, image loading, layouts at 320/390/768/1440px, keyboard focus, internal navigation, and console errors. Screenshots are saved to `artifacts/footer-{width}.png`.

Introduction, About Me, My Life, and Academic share the same dark red-tinted background (`#180f11`) and soft radial gradient. The Academic display stage stays near-black (`#080909`) to frame the 3D desk. Maintain these colors in `src/styles.css` and `src/AcademicWorkbench.css`.
