/**
 * SplatAnything content manifest — edit this file to populate the page.
 * Author information is populated; fill in the remaining content and asset URLs.
 * Paths are relative to index.html; absolute HTTPS URLs work as well.
 * viewer: SuperSplat standalone viewer HTML, relative to `viewerBase` or absolute.
 *   It is only downloaded after "Explore in 3D".
 * poster / preview: still image and short muted MP4 shown before a viewer is opened.
 * See README.md for examples and the asset directory layout.
 */
window.SPLAT_CONTENT = {
  project: {
    name: "SplatAnything",
    subtitle: "",
    authors: [
      {
        name: "Hao Yu",
        url: "https://ritianyu.github.io/",
        affiliation: "1,2",
      },
      {
        name: "Zhenwei Wang",
        url: "https://zhenwwang.github.io/",
        affiliation: "2",
      },
      {
        name: "Yongzhen Hu",
        url: "https://github.com/Edisoneh",
        affiliation: "1",
      },
      { name: "Yuning Gong", url: "", affiliation: "2" },
      { name: "Junta Wu", url: "", affiliation: "2" },
      { name: "Xiaowei Zhou", url: "https://xzhou.me/", affiliation: "1" },
      {
        name: "Hujun Bao",
        url: "http://www.cad.zju.edu.cn/home/bao/",
        affiliation: "1",
      },
      {
        name: "Tengfei Wang",
        url: "https://tengfei-wang.github.io/",
        affiliation: "2",
        corresponding: true,
      },
      {
        name: "Chunchao Guo",
        url: "https://openreview.net/profile?id=~Chunchao_Guo1",
        affiliation: "2",
        corresponding: true,
      },
      { name: "Sida Peng", url: "https://pengsida.net/", affiliation: "1,3" },
    ],
    affiliations: ["Zhejiang University", "Tencent Hunyuan", "Causa Robotics"],
    links: { paper: "", code: "", huggingface: "" },
  },
  // A string, or an array of points shown as a numbered list. **text** is bold;
  // the project name is set in the title font.
  tldr: [
    "SplatAnything achieves high-quality feed-forward 3DGS across **arbitrary scenes**, and performs robustly under a wide range of extrapolated viewpoints.",
    "SplatAnything introduces **Gaussian Spacing Normalization**, alleviating the ambiguity in learning Gaussian attributes across scenes of varying scales.",
  ],
  // Empty uses each scene's localViewer for local validation, when available.
  // Root of the hosted viewer HTML files; scene `viewer` paths are relative to it,
  // e.g. "https://huggingface.co/datasets/<user>/<repo>/resolve/main/".
  viewerBase: "https://huggingface.co/datasets/ritianyu/SplatAnything_Demo/resolve/de6459bfe59506c3e602831703e079491e2e3f75/",
  // Names listed in `links` are turned into links inside `text`.
  acknowledgements: {
    text: "We thank Jiawei Wang and Yujie Guo for insightful discussions and valuable feedback.",
    links: {
      "Jiawei Wang": "https://plus-wave.github.io/",
      "Yujie Guo": "https://guoyujie.cn/",
    },
  },
  citation: `@article{yu2026splatanything,
  title={SplatAnything: Gaussian Spacing Normalization for Feed-Forward 3DGS across Arbitrary Scenes},
  author={Yu, Hao and Wang, Zhenwei and Hu, Yongzhen and Gong, Yuning and Wu, Junta and Zhou, Xiaowei and Bao, Hujun and Wang, Tengfei and Guo, Chunchao and Peng, Sida},
  journal={arXiv preprint},
  year={2026}
}`,
  video: {
    src: "demo/demo_video.mp4",
    poster: "demo/poster.jpg",
    embed: "",
    caption: "",
    aspectRatio: "16 / 9",
    chapters: [
      { id: "object", label: "Objects", time: 2 },
      { id: "indoor", label: "Indoor Scenes", time: 13 },
      { id: "street", label: "Street Scenes", time: 25 },
      { id: "aerial", label: "Aerial Scenes", time: 38 },
    ],
  },
  // Categories become the gallery tabs. Scenes come from images/visualization via
  // tools/sync_gallery.py (assets/js/gallery.js); each has poster / preview / viewer.
  qualitative: [
    { id: "object", label: "Objects", scenes: window.SPLAT_GALLERY?.object || [] },
    { id: "indoor", label: "Indoor Scenes", scenes: window.SPLAT_GALLERY?.indoor || [] },
    { id: "street", label: "Street Scenes", scenes: window.SPLAT_GALLERY?.street || [] },
    { id: "aerial", label: "Aerial Scenes", scenes: window.SPLAT_GALLERY?.aerial || [] },
  ],
  comparison: {
    methods: [
      { id: "model-a", name: "" },
      { id: "model-b", name: "" },
      { id: "model-c", name: "" },
    ],
    // ours / models[id]: { poster, preview, viewer }, or a string as viewer URL.
    categories: [
      {
        id: "object",
        label: "Objects",
        scenes: [
        {
          id: "compare-object-01",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        {
          id: "compare-object-02",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        {
          id: "compare-object-03",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        ],
      },
      {
        id: "indoor",
        label: "Indoor Scenes",
        scenes: [
        {
          id: "compare-indoor-01",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        {
          id: "compare-indoor-02",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        {
          id: "compare-indoor-03",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        ],
      },
      {
        id: "street",
        label: "Street Scenes",
        scenes: [
        {
          id: "compare-street-01",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        {
          id: "compare-street-02",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        {
          id: "compare-street-03",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        ],
      },
      {
        id: "aerial",
        label: "Aerial Scenes",
        scenes: [
        {
          id: "compare-aerial-01",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        {
          id: "compare-aerial-02",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        {
          id: "compare-aerial-03",
          name: "",
          dataset: "",
          thumbnail: "",
          ours: { poster: "", preview: "", viewer: "" },
          models: { "model-a": "", "model-b": "", "model-c": "" },
        },
        ],
      },
    ],
  },
};
