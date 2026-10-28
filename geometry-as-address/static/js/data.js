// Prompts and durations are inlined so the page also works when opened via file://.
// Durations (seconds) come from ffprobe and drive the gallery tile sizes.
window.PAGE_DATA = (() => {
  const demo = "material/Ours-Demo";
  const gallery = [
    {
      name: "polish-mountain-wooden-houses",
      duration: 67.6,
      prompt: "A dirt road curves through a mountain village of steep-roofed wooden houses. Warm timber facades, dark shingles, and carved gables line both sides, with parked cars near the buildings. Golden grass and wildflowers fill the foreground, while spruce forest and a distant rocky ridge sit under a cloudy late-day sky.",
    },
    {
      name: "changdeokgung-palace-autumn-garden-",
      duration: 60.7,
      prompt: "A traditional Korean palace hall with a curved dark-tile roof and red wooden columns sits on a stone terrace among autumn trees. Crimson and gold foliage frames stone steps and a low covered walkway. Warm sunlight glows through the canopy above a quiet courtyard of granite paving and garden walls.",
    },
    {
      name: "pine-forest-country-house_cropped",
      duration: 54.1,
      prompt: "A rustic country house with a steep brown roof, stone chimney, and wooden porch sits in a sunlit pine forest. Tall pines and a wooden fence enclose a green lawn, with a circular stone fire pit in the foreground. Blue sky shows through the canopy above the quiet garden.",
    },
    {
      name: "wuzhen-ancient-stone-bridge",
      duration: 42.3,
      prompt: "A steep stone staircase rises between traditional Jiangnan houses toward a bright sky. Dark tiled roofs, white and timber walls, and red lanterns line both sides of the steps. Lush green shrubs fill the foreground beside carved stone railings, with a hanging lantern glowing on the left under clear daylight.",
    },
    {
      name: "modern-residential-street",
      duration: 33.1,
      prompt: "A wide pedestrian street of mixed gray and warm stone tiles runs through a modern residential neighborhood. Low contemporary buildings with brick, concrete, and glass facades stand on both sides, shaded by young trees and neat shrubs. The path leads toward a distant green courtyard under a bright, cloudy sky.",
    },
    {
      name: "austrian-lakeside-village-street",
      duration: 28.5,
      prompt: "A narrow paved lane climbs between traditional alpine houses in a lakeside village. White plaster walls, dark timber balconies, flower boxes, and steep roofs line the street, with a wooden railing along the right. Beyond the rooftops, a deep blue lake sits under forested mountains and a partly cloudy sky.",
    },
    {
      name: "alpine-lake-boathouse",
      duration: 23.9,
      prompt: "A weathered wooden boathouse stands on stilts over a calm turquoise alpine lake, linked to the shore by a timber pier. A small red boat rests beside the dock. Forested slopes rise toward jagged peaks half-hidden in cloud, and the still water mirrors the cabin, mountains, and soft sunlight.",
    },
    {
      name: "suzhou-classical-garden-pavilion",
      duration: 17.0,
      prompt: "A classical Chinese garden centers on a still pond reflecting white walls and dark tiled roofs. A wooden pavilion with lattice windows and upturned eaves extends over the water, linked by a covered corridor to a neighboring hall. Trees, shrubs, and fallen leaves frame the courtyard under an overcast sky.",
    },
  ].map((item) => ({
    ...item,
    video: `${demo}/videos/${item.name}.mp4`,
    poster: `${demo}/previews/${item.name}.png`,
  }));

  const longHorizonDir = "material/Comparison_LongHorizon";
  const longHorizon = [
    "changdeokgung-palace-autumn-garden",
    "pine-forest-country-house",
    "polish-mountain-wooden-houses",
  ].map((name) => ({
    name,
    thumb: `${longHorizonDir}/previews/${name}.png`,
    video: `${longHorizonDir}/video/${name}.mp4`,
  }));

  // Two DL3DV previews have no rendered video yet and are therefore not listed.
  const dl3dvDir = "material/Comparison-DL3DV";
  const dl3dv = [
    ["14452271416631599c6e7a2362b2c5330e08fbf0ec2adfea7930d84cba4e3d69"],
    ["1881f3837a7e28b96a43fa87b9cc5a406104c776cda31f808e1c48d5ed8b8a6d"],
    ["1e5ce991775e9266dcd553306ae9cc153ffd19101b789ff66526bc3877c54fdf"],
    ["1f48fd8ca3d0d6e9c879239ff2f7f824996bd741bcfb74f4e546f2a0f4cf35f5"],
    ["334ff324884919582938372c65ab33ffa0d25fc2e89ce5a896a317f6c2531c90"],
    ["44cdf8e4e44c8a7537517311a981901944319faa55a880e1a8d67d5933d20180"],
    ["4dbff8a392bbd187d5655d5199307632f834386e00875b343d31b2b8195b4241"],
    ["5f57615993d0136efc3628e41994c4cec16779a2b31a47f0a5b8a31637927491"],
    ["7ab720a2e21e729185ab0147e2aeda65d0ae2c0434641f6b13102b01e927919b"],
    ["887529ade78bd981de09e31648c9788f14691f50d113cb5aa5f0e38e75304ec7"],
    ["924228bfa8983b5aa7921a609d5046036c96022f8458c037460386e74f3ffec6"],
    ["935620afb47080ea06056d891f8bd7d70e7b306ee1aac7b282813b3aecd3eba5"],
    ["9c567331ea71ab56d8a96c10ab4d17b8ae3350fcaf689908cdcf608e1d8ae6db"],
    ["9f361436f272b69706cdba2747ab7b86d7227bbbd95458cc927255d11f6e9bbb"],
    ["b93f5691ba1cc8890d0b0fb5792668d8c8e084e3b3ae1a476fc5e2c1e38b79ae"],
    ["c9fa8e4f985a871be37f8bcb5baab74cfc535b12c3898e7469536599a63b9184"],
    ["d2ce0396dc6df5a579dbd8189885ce978c19490709875043e3566efba054236f"],
    ["e834869939ea68d24743bb9f5b13016f4fce585a44740d0b60ee2fc0086e7d7f"],
    ["ec0d0f130fbe697564dbac8df4b8a07665868a6ed0441cd29458607c67f61836"],
    ["f1a05a3e7d1680caa08ed114483fcfbccaf6c72905d2333f6f8f405dbb36454f"],
    ["f3ae99f69bc9d97bc98e83cffedc837422a7bd343d876560d2a60552a3b35779"],
    ["f703f92d32307a37f4df9d2df7aac96f97180c90b7dfad25a05d100550377155"],
    ["fae2d0d5927ef4e8a06398ce9ba6dd52ee4fee78131bb9d2910ca5dbfbfa2362"],
  ].map(([hash, suffix = ""], i) => ({
    name: hash,
    label: `Scene ${String(i + 1).padStart(2, "0")}`,
    thumb: `${dl3dvDir}/previews/${hash}.png`,
    video: `${dl3dvDir}/video/${hash}${suffix}.mp4`,
    camera: `${dl3dvDir}/camera_align/${hash}.png`,
  }));

  const worldScoreDir = "material/Comparison_WorldScore";
  const worldScore = [2, 3, 4, 6, 7, 9, 10, 11, 12, 13, 16, 19, 28, 29, 30, 31, 32, 33, 35, 36, 37, 40].map((n, i) => {
    const name = `case_${String(n).padStart(2, "0")}`;
    return {
      name,
      label: `Case ${String(i + 1).padStart(2, "0")}`,
      thumb: `${worldScoreDir}/previews/${name}.png`,
      video: `${worldScoreDir}/videos/${name}.mp4`,
    };
  });

  return { gallery, longHorizon, dl3dv, worldScore };
})();
