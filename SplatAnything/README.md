# SplatAnything 项目主页模板

纯 HTML / CSS / JavaScript，无需构建，可以直接作为 GitHub Pages 子目录部署。

## 本地预览

在当前目录运行：

```sh
python3 tools/serve.py 8080
```

然后访问 `http://localhost:8080`。该预览服务支持 HTTP Range 分段请求，使视频在尚未全部下载时也能使用分类按钮跳转或拖动进度条。不要用不支持 Range 的普通 `python3 -m http.server` 预览视频。也可以直接打开 `index.html` 查看静态内容；视频和 3D 交互应通过 HTTP 服务验证。

## 内容入口

作者、单位及后续素材地址在 **`assets/js/content.js`** 中维护。作者和单位已填写，副标题当前在 `index.html` 中；其余论文内容和素材地址待补充。页面中的几何缩略图只是模板，不是真实实验结果。单位按数组顺序自动标注为 1、2，作者的 `affiliation` 使用对应编号，多单位用逗号分隔。

| 字段                   | 用途                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `project.version`      | 主标题括号中的版本名称，当前为 `InfiniSplat v3`                                      |
| `project.subtitle`     | 论文副标题；出现 Gaussian Spacing Normalization 时自动突出显示                        |
| `project.authors`      | 作者数组，例如 `{ name: '姓名', url: '作者主页', affiliation: '1' }`                  |
| `project.affiliations` | 单位名称数组                                                                          |
| `project.links`        | `paper`、`code`、`huggingface`、`series` 对应资源按钮；`series` 为 InfiniSplat Series 仓库链接，留空时不可点击 |
| `tldr`                 | 第一模块的简介，支持换行，按纯文本处理                                                |
| `video.src`            | 视频文件地址，例如 `assets/media/demo.mp4`                                            |
| `video.poster`         | 视频封面图片                                                                          |
| `video.embed`          | 视频平台的嵌入播放器地址，`src` 有值时优先使用本地视频                                |
| `video.caption`        | 可选视频说明                                                                          |
| `video.aspectRatio`    | 可选视频比例，例如 `"3 / 2"`；有视频时默认 `16 / 9`                                   |
| `video.chapters`       | 视频下方的分类跳转按钮，例如 `{ id: 'object', label: 'Objects', time: 5 }`，`time` 单位为秒 |
| `qualitative`          | Objects / Indoor / Street / Aerial 四个类别；场景默认来自 `images/visualization`，见下文 |
| `application`          | Pano-Recon for AR/VR（12 个 case）/ Rig-Recon for Autonomous Driving（6 个 case），素材来自 `images/application` |
| `comparison.methods`   | 右栏可选择的方法，`id` 必须唯一                                                       |
| `comparison.categories`| 对比的四个类别，每个场景含 Ours 与各方法的结果                                         |
| `acknowledgements`     | 致谢：`text` 为正文，`links` 中列出的人名会在正文中自动变成链接；`text` 为空时隐藏板块 |
| `citation`             | 引用的 BibTeX 文本，Copy 按钮复制到剪贴板；为空时隐藏板块                              |

类别和场景数量都不固定，可以直接增删数组中的元素。类别 `id` 为 `object`、`indoor`、`street`、`aerial` 时自动使用对应图标。场景 `id` 必须唯一；缩略图网格、当前选中状态、场景计数都会自动更新。切换类别时保留各类上一次选择的场景。

Demo 视频使用 `demo/demo_video.mp4`（H.264、720p）。页面打开后会先完整下载该文件，视频中央显示旋转圆圈和按实际下载字节计算的百分比；下载完成并准备好首帧后，才隐藏加载提示并开放播放控件和分类跳转按钮。播放器使用已下载文件的 Blob URL，后续播放和拖动进度条无需继续从网络加载视频。加载失败时可重试或直接打开原视频。

Demo 视频加载前的底图 `demo/poster.jpg` 使用该视频的第一帧。

视频下方五个按钮分别跳到 Objects（00:03）、Indoor Scenes（00:16）、Street Scenes（00:27）、Aerial Scenes（00:40）、Panoramic Scenes（00:58）并开始播放；当前播放的分类会同步高亮。时间戳在 `video.chapters` 中维护，按钮上只显示分类名称。宽屏端五列排列，手机端两列排列，最后的 Panoramic Scenes 按钮占一整行。

## 展示方式（参考 InfiniSplat v2）

Method 板块位于 Demo Video 与 Qualitative Results 之间，正文和图注在 `index.html` 中维护：图 (a) 为 `images/method/pipeline_2.jpg`，展示整体流程；图 (b) 为 `pipeline_1.jpg`，解释 RDNorm 的 Gaussian-scale 监督歧义和 GSNorm 的作用。文字依据本地论文的 Abstract 和 Introduction 整理。两图保持完整比例，Full size 链接可打开原图；手机端图注按单列显示。

对比模块目前暂时停用，HTML、样式、脚本和内容配置均保留。重新启用时，取消 `index.html` 中对比 section 和 Compare 导航的注释，以及 `assets/js/app.js` 中 `setupComparison()` 调用的注释。

第 3、4 模块参考 [InfiniSplat v2](https://zju3dv.github.io/InfiniSplat2/) 的 Visualization：选中场景后先显示 `poster` 和静音循环的 `preview` 视频，点击 **Explore in 3D** 才加载 SuperSplat 查看器；**Back to preview** 返回预览，右上角箭头在新标签页打开查看器。场景卡片以网格排在查看器下方，每个类别可以放很多例子而不会一次下载所有模型。

- `preview` 建议使用几秒钟、H.264 编码的 MP4。只在查看器进入视口附近时下载，离开视口、页面进入后台或 Demo 视频播放时暂停；系统开启“减少动态效果”时只显示静帧。
- 上方播放器的加载底图 `poster.jpg` 使用预览视频第一帧；下方场景卡片的 `thumb.jpg` 使用独立的源图片。没有视频时，播放器底图也使用源图片；源图片移走后，同步脚本保留已有的卡片缩略图。只有源图片和卡片缩略图都不存在时，才用视频首帧生成卡片。
- 每个场景可选 `aspectRatio`（例如 `"4 / 3"`），让查看器比例与素材一致；默认结果区 `16 / 9`，对比区 `1.26`。
- 预览图比例与查看器不同时，两侧用同一张图的模糊版本填充。
- 只有 `viewer` 没有图片时显示占位背景加 Explore 按钮；三者都为空时显示 “3D scene coming soon” 占位。

## Application

Application 位于 Qualitative Results 下方，按顺序提供两个类别：**Pano-Recon for AR/VR**（12 个 case）和 **Rig-Recon for Autonomous Driving**（6 个 case），默认展示 Pano 01。布局与结果板块共用同一套播放器、场景卡片和切换逻辑：先显示预览视频，点击 **Explore in 3D** 才下载当前 case 的 HTML，下载时显示进度；支持返回预览、重置、全屏和新标签页打开。

素材目录为 `images/application/rig/1/` 至 `6/` 和 `images/application/pano/1/` 至 `12/`。每个目录放 `preview.mp4` 和独立的卡片源图片；播放器底图使用视频第一帧，卡片仍使用源图片。缺少素材的编号目录保留 case 位置并显示待补充预览，不会请求不存在的视频或图片。HTML 可暂存同目录验证，并已加入 Git 忽略规则。

Rig 当前提供 6 个 case，每个目录包含 `preview.mp4`（1280×720、30fps、完整约 9.93 秒）、视频首帧 `poster.jpg`（1280×720）、由目录内参考帧 `frame_*.png` 生成的 `thumb.jpg`（480×480）和首帧缓存 `preview-frame.json`。页面卡片使用小尺寸 `thumb.jpg`。

Pano 当前提供 12 个 case，每个目录包含 `preview.mp4`（1280×720、30fps、完整 16.6 秒）、视频首帧 `poster.jpg`（1280×720）、由原始全景参考图缩小得到的 `thumb.jpg`（1024×512，按图片内容自适应 JPEG 质量，约 100 KB）和首帧缓存 `preview-frame.json`。大尺寸源图移走后仍保留该全景缩略图，不会将卡片改成视频首帧。

添加或更新素材后执行 `python3 tools/sync_application.py`，生成 `assets/js/application.js`。下载目录严格与本地编号一致：Rig 01 下载 Hugging Face 的 `rig/1/` 下的 HTML，Pano 06 下载 `pano/6/` 下的 HTML；同样在点击时查询最新文件名和大小，不提前下载其他 case。

## 3D 查看器（本地验证 / HuggingFace 托管）

每个场景的 3D 结果是一个用 SuperSplat 导出的**单文件 HTML 查看器**（模型已压缩并内嵌在 HTML 中）。当前四类共 54 个场景的 HTML 已接入 [ritianyu/SplatAnything_Demo](https://huggingface.co/datasets/ritianyu/SplatAnything_Demo)。选择分类或 case 时只显示预览；点击 **Explore in 3D** 才下载当前场景的 HTML，完成后启动交互查看器。下载界面显示百分比和已下载 / 总大小，切换 case 或返回预览会取消未完成的下载。查看器下方有对应操作提示。

本地文件夹编号与 Hugging Face 目录编号严格一致：`images/visualization/<类别>/N/` 只下载远端 `<类别>/N/` 中的 HTML，不保留跨编号的历史映射。调整页面顺序时同步重命名本地文件夹，远端文件夹的顺序由用户调整。

点击 Explore in 3D 后，loader 才查询 Hugging Face `main` 分支中当前类别、当前编号目录的文件清单，找到唯一的 HTML 并下载；文件名和进度条所需的大小以该次查询为准。因此远端调整目录、文件名或 HTML 内容后，无需沿用旧文件名、旧大小或旧仓库版本。每个编号目录应只放一个 HTML，不会扫描或下载其他 case 的 HTML。

重新上传 HTML 后执行：

```sh
python3 tools/sync_remote_viewers.py
python3 tools/sync_gallery.py
```

第一个脚本按本地场景 ID 的类别和编号核对同编号的远端目录，将文件名、大小、SHA-256 和核对时的仓库版本记录到 `remote-viewers.json`，并将 `viewerBase` 设为 `resolve/main/`；第二个脚本将清单写入图库。新增本地 case 时先运行一次 `sync_gallery.py` 生成场景 ID。该清单用于维护核对，页面点击下载时会重新读取对应目录的最新信息；点击前不请求目录清单或任何场景 HTML。

本地验证时，将 HTML 放到 `images/visualization/<类别>/<编号>/` 后运行同步脚本。脚本自动记录 `localViewer`；没有远端映射时，按 HTML 文件名生成默认 `viewer` 路径。`viewerBase` 留空时，点击 **Explore in 3D** 才在 iframe 中加载本地 HTML。当前四类共 54 个场景均已提供 `preview.mp4`，会在预览区域静音循环播放，点击 **Back to preview** 可从 3D 视图返回。目录中有多个视频时优先使用 `preview.mp4` / `preview.webm`。

1. 在 SuperSplat 中导入 PLY，调整初始相机，导出单文件 HTML 查看器。
2. 上传到 HuggingFace 仓库（dataset 或 model 均可），使用生成的 `viewer` 路径：`<类别>/<编号>/<HTML文件名>`。例如 Object 09 为 `object/9/box_109__wcam_wintrs.html`。没有本地 HTML 的场景仍默认使用 `<类别>/<编号>/viewer.html`。
3. 在 `assets/js/content.js` 中填写 `viewerBase`，即仓库文件的根地址：

```js
viewerBase: "https://huggingface.co/datasets/<user>/<repo>/resolve/main/",
```

`viewerBase` 为空且没有本地 HTML 时，结果区显示预览图和 “3D VIEWER SOON”。填写 `viewerBase` 后会优先使用远程文件，无需修改每个场景；点击 **Explore in 3D** 后才由 `assets/viewer/loader.html` 从 HuggingFace 下载对应 HTML（显示 MB 进度），下载完成后在 iframe 中由 SuperSplat 运行。HuggingFace 的 `resolve` 地址会把 HTML 当作下载文件，不能直接放进 iframe，所以需要这个 loader（与 InfiniSplat v2 相同的做法）。右上角“在新标签页打开”同样经过 loader。`info.json` 中的完整 `viewer` URL 或显式本站路径仍优先，`viewer: ""` 可关闭该场景的 3D 功能。

当前 Hugging Face 查看器使用 `main` 分支，保证用户自行调整远端顺序后按同编号目录读取最新文件。不要将下载固定到换序前的 commit。

`viewer` 的地址规则：

- 普通相对路径（如 `object/1/viewer.html`）相对于 `viewerBase`；
- 完整 URL，或以 `/`、`./`、`../` 开头的本站路径，按原样使用；
- 与页面不同源的地址自动经过 loader，本站地址直接放进 iframe。

## 定性结果素材（images/visualization）

Qualitative Results 的场景由 `images/visualization/<类别>/<编号>/` 自动生成，类别目录为 `object`、`indoor`、`street`、`aerial`，仅扫描纯数字命名的场景目录并按数字顺序排列，忽略 `video/` 等原始导出或辅助目录。每个场景目录可放：

| 文件 | 用途 |
| ---- | ---- |
| 任意一张图片（`.png` / `.jpg` / `.webp`） | 下方场景卡片的源图片，生成 `thumb.jpg`（480px）；没有视频时也生成播放器底图 `poster.jpg`（1280px） |
| `*.mp4` / `*.webm` | 选中场景后静音循环播放；第一帧只用于上方播放器的加载底图 `poster.jpg`（建议几秒钟、H.264） |
| `*.html` | 本地验证用的 SuperSplat 查看器；自动接入 Explore in 3D，未来上传时保留相同文件名 |
| `info.json`（可选） | `{"name": "...", "dataset": "...", "viewer": "..."}`：覆盖默认名称（`Object 01` 等）或查看器路径；`"viewer": ""` 表示该场景没有 3D |

有本地 HTML 时，`viewer` 为 `<类别>/<编号>/<HTML文件名>`，`localViewer` 为本站素材路径；否则 `viewer` 默认为 `<类别>/<编号>/viewer.html`。增删或修改素材后运行：

```bash
python3 -m pip install pillow imageio-ffmpeg
python3 tools/sync_gallery.py
```

脚本会重新生成 `assets/js/gallery.js`，`content.js` 中的 `qualitative` 直接读取它。有视频时生成对应第一帧的播放器底图，卡片缩略图保留原图。`preview-frame.json` 记录视频文件名、大小和修改时间，视频变化后自动重新提取底图；系统已有 ffmpeg 时无需安装 imageio-ffmpeg。原始 PNG 只作为源文件，页面只加载生成的 JPG。不要把 PLY 放进本仓库。

Object 已按当前展示顺序整理为 `images/visualization/object/1/` 至 `12/`，已移除 case 的素材目录已删除。文件夹编号、场景 ID、预览图路径和默认名称 `Object 01` 至 `Object 12` 一一对应，直接按目录数字顺序同步。`info.json` 中的自定义名称优先，新增场景时继续使用后续编号即可。

Indoor 保留原目录 `1, 2, 4, 5, 7, 10, 11, 12, 15, 16, 19, 20`，已依次整理为 `indoor/1/` 至 `12/`，页面名称对应 `Indoor 01` 至 `Indoor 12`。HTML 查看器保留原文件名，所在目录和生成的查看器路径使用新编号。

Street 当前为 `street/1/` 至 `12/`，页面名称对应 `Street 01` 至 `Street 12`，各目录的 `preview.mp4` 用于静音循环预览。播放器加载底图使用视频首帧，下方卡片图使用原始图片；`video/` 和 `video.zip` 保留为原始导出素材，不参与场景生成。

Street 已将原目录 1↔2、3↔4 实际交换并重命名，当前按目录数字顺序展示：`street/1/` 对应 `Street 01`，下载远端 `street/1/` 中的 HTML，以此类推。以后调整任何类别的场景顺序时，也必须同时重命名本地目录并更新页面引用，避免目录编号与页面编号不一致或重复应用旧的排序规则。远端始终按本地编号下载，Hugging Face 上的场景顺序由用户自行调整。

Aerial 已按原目录编号 `2, 3, 5, 6, 7, 8, 9, 11, 14, 18, 20, 21, 22, 25, 27, 28, 29, 34` 的数字升序，依次整理为 `aerial/1/` 至 `18/`，页面名称为 `Aerial 01` 至 `Aerial 18`。18 个场景均提供 `preview.mp4`（1280×720、30fps、约 9.93 秒），播放器底图来自视频首帧，卡片图保留原始照片。`images/visualization/aerial/case_mapping.json` 记录旧、新编号、原片文件名和压缩统计；`video/` 中的原片名称保持原始编号，后续更新预览应先按对照表定位新目录。重命名前的素材和网页配置保存在 aerial 下的 `.case_renumber_backup/`。

Aerial 页面顺序由 `tools/sync_gallery.py` 的 `SCENE_ORDER` 保持，当前源目录顺序为 `11, 12, 13, 10, 5, 18, 7, 8, 9, 4, 1, 2, 3, 14, 15, 16, 17, 6`，页面名称按展示位置连续编号为 `Aerial 01` 至 `Aerial 18`。`case_mapping.json` 的 `new_id` 表示素材目录编号；从页面编号查找素材时，先用 `SCENE_ORDER` 定位对应目录。

手动填写的定性场景示例：

```js
{
  id: 'indoor-01',
  name: '场景名称',
  dataset: '数据集名称',
  poster: 'assets/media/indoor-01.jpg',
  preview: 'assets/media/indoor-01.mp4',
  viewer: 'indoor/1/viewer.html', // 相对于 viewerBase
  aspectRatio: '4 / 3', // 可选
}
```

对比填写示例：

```js
methods: [
  { id: 'model-a', name: '方法名称' },
],
categories: [
  {
    id: 'street',
    label: 'Street Scenes',
    scenes: [
      {
        id: 'compare-street-01',
        name: '场景名称',
        dataset: '',
        thumbnail: '', // 可选，默认使用 Ours 的 poster
        ours: {
          poster: 'assets/media/compare-street-01/ours.jpg',
          preview: 'assets/media/compare-street-01/ours.mp4',
          viewer: 'compare/street-01/ours.html', // 相对于 viewerBase
        },
        models: {
          // 也可以只写查看器地址字符串
          'model-a': 'compare/street-01/model-a.html',
        },
      },
    ],
  },
],
```

对比区与结果区使用同一套类别标签和场景网格，左侧固定 Ours，右侧下拉框切换方法，不重载左栏。点击任一侧的 Explore in 3D 会同时打开两侧的查看器，**Back to previews** 同时返回预览；切换场景或类别时两侧回到预览。右侧预览视频跟随左侧的播放时间，方便对比相同的相机轨迹。某个方法的结果留空时，仅该栏显示占位状态，不沿用上一场景的结果。

**相机说明：**两栏是独立的 SuperSplat 页面，当前没有跨 iframe 相机同步。为保证初始视角一致，请在导出每个方法的结果时使用相同坐标系、相机位置和朝向。重置按钮通过重载对应查看器恢复导出的初始状态。外部页面可能受自己的嵌入策略限制，应使用允许 iframe 展示的地址。

父页面只在展示区接近视口时加载查看器，换场景时移除旧 iframe。HuggingFace 上的 HTML 由 loader 显示下载进度，下载失败（例如 404）时提供重试和直接下载链接。上传后建议先在新标签页打开确认可用。

## 设计和维护

页面有两套设计，共用同一份 `assets/js/content.js`、素材和字体：

| 设计 | 入口 | 样式 / 脚本 |
| --- | --- | --- |
| 当前：简洁浅色（默认） | `index.html` | `assets/css/style.css`、`assets/js/app.js` |
| 原版：暖灰窗口风格 | `index-classic.html` | `assets/css/style-classic.css`、`assets/js/app-classic.js` |

原版文件是改版前的完整冻结副本，不要再改动。直接访问 `index-classic.html` 即可查看原版；要把原版换回主页，执行：

```sh
mv index.html index-light.html && mv index-classic.html index.html
```

（`index-classic.html` 引用的是 `-classic` 版样式和脚本，改名后仍然有效。）

**当前设计**参考 learn.shareai.run 的配色：白色底、`#f4f4f5` 浅灰面板、`#e4e4e7` 细边框、`#09090b` 正文和 `#71717a` 次要文字；主按钮与类别分段控件选中态为近黑色；Demo 视频和 BibTeX 放在带红黄绿三点的黑色窗口里；四个类别分别使用浅蓝、浅绿、浅琥珀、浅紫徽章（场景编号与数据集标签随类别变色）。正文使用系统字体栈（Apple 设备上为 SF Pro / SF Mono），项目名 SplatAnything 沿用原版的 Georgia 斜体；副标题在宽度 1000px 以上的屏幕保持一行，更窄时自动换行。标题居中。首屏主标题为静态的 “SplatAnything (InfiniSplat v3)”，字号较原版缩小；顶部说明徽章、暂停按钮和 Splat 粒子特效已移除。资源区提供 InfiniSplat Series 按钮，链接到 `https://github.com/zju3dv/InfiniSplat`。

- `index.html`：首屏与概览、视频、Method、结果、致谢、引用模块；对比模块保留代码，当前已注释停用。
- 主标题右上角的 ♾️ 标志使用 SVG 和蓝色流动线段动画，随标题字号缩放，离开视口或页面进入后台时自动暂停，系统开启“减少动态效果”时静止。
- `assets/css/style.css`：当前设计的全部样式，颜色集中在文件开头的变量中。
- `assets/js/app.js`：内容渲染、类别与场景切换、预览与查看器切换、双栏对比、加载、全屏和引用复制。
- `assets/favicon.svg`：标签页图标，与标题右上角共用同款黑色轮廓、蓝色线段的 ♾️ 造型。

**原版设计**为暖灰底色 `#e4e4e0`、悬浮导航、斜体项目名，以及 “Splat” 散开再聚合的标题动画；它使用 `assets/fonts/` 中的 DM Sans 和 IBM Plex Mono。

几何缩略图和视频占位只是模板，不代表实验结果。页面功能不依赖第三方 JavaScript。

模板包含键盘操作：Tab 聚焦控件；类别标签支持左右方向键、Home、End，场景网格还支持上下方向键按行移动；全屏支持关闭按钮和 Esc。窄屏保留两栏对比，通过全屏按钮可放大各自的查看器。
