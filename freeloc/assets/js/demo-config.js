"use strict";

const DEMO_DATA = [
  {
    name: "Spencerville",
    map: "assets/demo/Spencerville/map.png",
    single: ["00096", "00167", "00179", "00224", "00244"].map((frame) => ({
      image: `assets/demo/Spencerville/single/observation/Spencerville_frame_${frame}-3.png`,
      result: `assets/demo/Spencerville/single/results/Spencerville_frame_${frame}-3.png`
    })),
    sequential: {
      video: "assets/demo/Spencerville/sequential/synchronized.mp4"
    }
  },
  {
    name: "Spotswood",
    map: "assets/demo/Spotswood/map.png",
    single: ["00000", "00044", "00117", "00128", "00191"].map((frame) => ({
      image: `assets/demo/Spotswood/single/observation/Spotswood_frame_${frame}-3.png`,
      result: `assets/demo/Spotswood/single/results/Spotswood_frame_${frame}-3.png`
    })),
    sequential: {
      video: "assets/demo/Spotswood/sequential/synchronized.mp4"
    }
  },
  {
    name: "Springhill",
    map: "assets/demo/Springhill/map.png",
    single: ["00017", "00025", "00090", "00109", "00126"].map((frame) => ({
      image: `assets/demo/Springhill/single/observation/Springhill_frame_${frame}-3.png`,
      result: `assets/demo/Springhill/single/results/Springhill_frame_${frame}-3.png`
    })),
    sequential: {
      video: "assets/demo/Springhill/sequential/synchronized.mp4"
    }
  },
  {
    name: "Stilwell",
    map: "assets/demo/Stilwell/map.png",
    single: ["00029", "00053", "00117", "00175", "00237"].map((frame) => ({
      image: `assets/demo/Stilwell/single/observation/Stilwell_frame_${frame}-3.png`,
      result: `assets/demo/Stilwell/single/results/Stilwell_frame_${frame}-3.png`
    })),
    sequential: {
      video: "assets/demo/Stilwell/sequential/synchronized.mp4"
    }
  },
  {
    name: "Stokes",
    map: "assets/demo/Stokes/map.png",
    single: ["00005", "00040", "00059", "00066", "00077"].map((frame) => ({
      image: `assets/demo/Stokes/single/observation/Stokes_frame_${frame}-3.png`,
      result: `assets/demo/Stokes/single/results/Stokes_frame_${frame}-3.png`
    })),
    sequential: {
      video: "assets/demo/Stokes/sequential/synchronized.mp4"
    }
  },
  {
    name: "Sumas",
    map: "assets/demo/Sumas/map.png",
    single: ["00017", "00042", "00046", "00079", "00083"].map((frame) => ({
      image: `assets/demo/Sumas/single/observation/Sumas_frame_${frame}-3.png`,
      result: `assets/demo/Sumas/single/results/Sumas_frame_${frame}-3.png`
    })),
    sequential: {
      video: "assets/demo/Sumas/sequential/synchronized.mp4"
    }
  },
  {
    name: "Superior",
    map: "assets/demo/Superior/map.png",
    single: ["00052", "00159", "00247", "00359", "00368"].map((frame) => ({
      image: `assets/demo/Superior/single/observation/Superior_frame_${frame}-3.png`,
      result: `assets/demo/Superior/single/results/Superior_frame_${frame}-3.png`
    })),
    sequential: {
      video: "assets/demo/Superior/sequential/synchronized.mp4"
    }
  },
  {
    name: "Swormville",
    map: "assets/demo/Swormville/map.png",
    single: ["00002", "00027", "00082", "00117", "00123"].map((frame) => ({
      image: `assets/demo/Swormville/single/observation/Swormville_frame_${frame}-3.png`,
      result: `assets/demo/Swormville/single/results/Swormville_frame_${frame}-3.png`
    })),
    sequential: {
      video: "assets/demo/Swormville/sequential/synchronized.mp4"
    }
  },
  {
    name: "Woonsocket",
    map: "assets/demo/Woonsocket/map.png",
    single: ["00000", "00059", "00096", "00130", "00181"].map((frame) => ({
      image: `assets/demo/Woonsocket/single/observation/Woonsocket_frame_${frame}-3.png`,
      result: `assets/demo/Woonsocket/single/results/Woonsocket_frame_${frame}-3.png`
    })),
    sequential: {
      video: "assets/demo/Woonsocket/sequential/synchronized.mp4"
    }
  }
];
