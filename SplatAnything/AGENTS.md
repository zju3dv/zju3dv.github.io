# 场景顺序与目录编号

调整 Qualitative Results 或 Application 任一类别的场景顺序时，必须同时移动并重新命名本地文件夹，使该类别页面的第 N 个 case 对应目录 N。Qualitative Results 素材位于 `images/visualization/<category>/<number>/`，Application 素材位于 `images/application/{rig,pano}/<number>/`。不要只修改页面展示顺序。目录内的预览视频、首帧、卡片图片和其他素材随场景一起移动。

本地目录编号与 Hugging Face 目录编号必须严格一致：本地 `<category>/N/` 只能下载远端 `<category>/N/` 中的 HTML。用户自行调整 Hugging Face 的场景顺序，不要为了跟随原场景而保留跨编号的下载映射。点击 Explore in 3D 时读取该编号目录下的最新 HTML；不要固定到旧仓库版本或依赖换序前的文件名、大小。

重命名时同步更新图库中的场景 ID 和素材路径，移除该类别已被目录重命名取代的 `SCENE_ORDER` 配置，避免重复换序；验证页面编号、本地目录和远端下载目录三者对应。`remote-viewers.json` 是可重新生成的目录清单，清单键的编号也必须与远端目录编号相同。
