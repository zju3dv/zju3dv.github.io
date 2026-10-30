export const visualState = {
  active: "overview",
  dataset: "nuScenes",
  policy: "Expert",
  renderer: "Street GS",
  frequency: "2 Hz",
  scenes: { gallery: 0, policy: 0, traffic: 0, renderer: 0 },
  paused: { gallery: false, policy: false, renderer: false },
};

const TAU = Math.PI * 2;
const mono = "Plex, monospace";
const random = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function path(ctx, points, fill, stroke, width = 1, close = true) {
  ctx.beginPath();
  points.forEach((point, i) =>
    i ? ctx.lineTo(point[0], point[1]) : ctx.moveTo(point[0], point[1]),
  );
  if (close) ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function projection(camera, target, center, focal) {
  const forward = target.map((v, i) => v - camera[i]);
  const length = Math.hypot(...forward);
  forward.forEach((v, i) => {
    forward[i] = v / length;
  });
  const horizontal = Math.hypot(forward[0], forward[2]);
  const right = [-forward[2] / horizontal, 0, forward[0] / horizontal];
  const up = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ];
  return (point) => {
    const delta = point.map((v, i) => v - camera[i]);
    const z = delta.reduce((sum, v, i) => sum + v * forward[i], 0);
    return [
      center[0] +
        (delta.reduce((sum, v, i) => sum + v * right[i], 0) * focal) / z,
      center[1] - (delta.reduce((sum, v, i) => sum + v * up[i], 0) * focal) / z,
      z,
    ];
  };
}

function line3(ctx, project, points, color, width = 1) {
  const projected = points.map(project);
  if (projected.some((point) => point[2] < 1)) return;
  path(ctx, projected, null, color, width, false);
}

// Smooth, projected contour lines keep the vehicle light and abstract.
function contour(ctx, project, points, color, width = 1, closed = false) {
  const samples = [];
  const count = closed ? points.length : points.length - 1;
  const at = (i) =>
    points[
      closed
        ? (i + points.length) % points.length
        : Math.max(0, Math.min(points.length - 1, i))
    ];
  for (let i = 0; i < count; i++) {
    const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let step = 0; step < 12; step++) {
      const t = step / 12;
      samples.push(
        b.map(
          (v, axis) =>
            0.5 *
            (2 * v +
              (-a[axis] + c[axis]) * t +
              (2 * a[axis] - 5 * v + 4 * c[axis] - d[axis]) * t * t +
              (-a[axis] + 3 * v - 3 * c[axis] + d[axis]) * t * t * t),
        ),
      );
    }
  }
  if (!closed) samples.push(points.at(-1));
  path(ctx, samples.map(project), null, color, width, closed);
}

function car(ctx, project, x = 0, z = 0, scale = 1, time = 0) {
  const p = ([vx, vy, vz]) =>
    project([x + vx * scale, vy * scale, z + vz * scale]);
  const mirror = ([vx, vy, vz]) => [-vx, vy, vz];
  // Every adjoining contour uses these same junctions; no independently guessed endpoints.
  const nose = [0, 0.66, -3.05];
  const hood = [1.06, 0.78, -2.6];
  const front = [1.3, 0.94, -1.6];
  const middle = [1.26, 0.84, 0.5];
  const rear = [1.35, 0.96, 1.8];
  const tail = [1.09, 0.72, 2.8];
  const tip = [0, 0.68, 3.05];
  const side = [nose, hood, front, middle, rear, tail, tip];
  const perimeter = [...side, ...side.slice(1, -1).reverse().map(mirror)];
  const lower = (point) => [point[0] * 0.96, 0.28, point[2] * 0.99];
  const roofFront = [0.8, 1.58, -0.72];
  const roofMiddle = [0.86, 1.64, 0.35];
  const roofRear = [0.78, 1.55, 1.08];
  const roof = [
    mirror(roofFront),
    [0, 1.64, -0.88],
    roofFront,
    roofMiddle,
    roofRear,
    [0, 1.63, 1.18],
    mirror(roofRear),
    mirror(roofMiddle),
  ];
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Wheel loops and spokes share the same rim radius and plane.
  for (const sign of [-1, 1])
    for (const wz of [-1.68, 1.8]) {
      const center = [sign * 1.32, 0.44, wz];
      const wheelPoint = (angle, radius) => [
        center[0],
        center[1] + Math.cos(angle) * 0.43 * radius,
        center[2] + Math.sin(angle) * 0.47 * radius,
      ];
      for (const radius of [1, 0.65]) {
        const points = Array.from({ length: 49 }, (_, i) =>
          wheelPoint((i / 48) * TAU, radius),
        );
        line3(ctx, p, points, radius === 1 ? "#5caff2bb" : "#397ca777", 0.7);
      }
      for (let spoke = 0; spoke < 5; spoke++) {
        line3(
          ctx,
          p,
          [center, wheelPoint((spoke / 5) * TAU - time * 1.4, 0.65)],
          "#4a90bb66",
          0.55,
        );
      }
    }
  ctx.shadowColor = "#27b9f0";
  ctx.shadowBlur = 5;
  contour(ctx, p, perimeter, "#bcecff", 1.15, true);
  ctx.shadowBlur = 0;
  contour(ctx, p, perimeter.map(lower), "#388ed3bb", 0.85, true);
  contour(ctx, p, roof, "#ddf6ff", 1.05, true);
  for (const sign of [-1, 1]) {
    const reflect = (point) => [point[0] * sign, point[1], point[2]];
    const edge = (points, color = "#a5dcef", width = 0.85, closed = false) =>
      contour(ctx, p, points.map(reflect), color, width, closed);
    edge([front, [1.1, 1.25, -1.22], roofFront]);
    edge([roofRear, [1.08, 1.27, 1.5], rear]);
    edge([roofMiddle, middle, lower(middle)], "#579ec3aa", 0.65);
    edge([tail, lower(tail)], "#539fd3aa", 0.7);
    edge([hood, lower(hood)], "#539fd3aa", 0.7);
    edge(
      [front, [1.59, 1.03, -1.43], [1.54, 0.93, -1.15], [1.36, 0.92, -1.18]],
      "#70b9e2aa",
      0.7,
      true,
    );
  }
  contour(ctx, p, [mirror(front), [0, 1.04, -1.79], front], "#86c3db", 0.8);
  contour(ctx, p, [mirror(rear), [0, 1.06, 1.99], rear], "#a7d9e9", 0.85);
  ctx.shadowColor = "#38d9fb";
  ctx.shadowBlur = 7;
  contour(ctx, p, [mirror(tail), [0, 0.79, 2.97], tail], "#70ebff", 1.5);
  ctx.restore();
}

function ground(ctx, project, extent = 75, step = 5, bright = false) {
  for (let x = -extent; x <= extent; x += step)
    line3(
      ctx,
      project,
      [
        [x, 0, -160],
        [x, 0, 60],
      ],
      x % 20 === 0 ? "#24424c" : "#163039",
      bright ? 0.8 : 0.5,
    );
  for (let z = -160; z <= 60; z += step)
    line3(
      ctx,
      project,
      [
        [-extent, 0, z],
        [extent, 0, z],
      ],
      z % 20 === 0 ? "#24424c" : "#163039",
      bright ? 0.8 : 0.5,
    );
}

function drawWorld(ctx, w, h, time) {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, w, h);
  const project = projection(
    [0, 14, 20],
    [0, 0, 0],
    [w * 0.5, h * 0.47],
    h * 1.4,
  );
  ground(ctx, project, 80, 5);
  car(ctx, project, 0, 0, 1.45, time);
}

function drawStreet(ctx, w, h, time, seed = 0, angle = 0, style = 0) {
  const palettes = [
    {
      sky: "#102449",
      haze: "#24536c",
      face: "#16465c",
      wall: "#0b2a43",
      roof: "#2c6779",
      edge: "#60b1c0",
      route: "#65eac5",
    },
    {
      sky: "#141d3d",
      haze: "#3a5485",
      face: "#293c6b",
      wall: "#162c50",
      roof: "#3a6391",
      edge: "#7aaddc",
      route: "#82b7ff",
    },
    {
      sky: "#0b273b",
      haze: "#245c6b",
      face: "#164c58",
      wall: "#123341",
      roof: "#37767b",
      edge: "#6ac5c5",
      route: "#9be7cf",
    },
  ];
  const colors = palettes[style];
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, colors.sky);
  sky.addColorStop(0.6, colors.haze);
  sky.addColorStop(1, "#0a2040");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const horizon = h * 0.42;
  const vanishing =
    w * (0.5 + Math.sin(angle * 0.65) * 0.25 + Math.sin(seed * 2) * 0.06);
  const bend = seed === 2 ? 0.1 : 0;
  path(
    ctx,
    [
      [0, horizon],
      [w, horizon],
      [w, h],
      [0, h],
    ],
    "#07172e",
    null,
  );
  // Far skyline.
  for (let i = 0; i < 30; i++) {
    const bx = (i * w) / 28;
    const bh = h * (0.06 + random(i + seed * 40) * 0.27);
    ctx.fillStyle = `rgba(35,59,68,${0.5 + random(i) * 0.4})`;
    ctx.fillRect(bx, horizon - bh, w / 24, bh);
    ctx.strokeStyle = "#4b6c7338";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, horizon - bh, w / 24, bh);
  }
  const roadPoint = (x, z, y = 0) => {
    const scale = 1 / (z * 0.035 + 1);
    return [
      vanishing + x * w * 0.073 * scale + bend * w * (1 - scale),
      horizon + (h * 0.69 - y * h * 0.1) * scale,
    ];
  };
  // Street blocks are drawn far-to-near; outlines remain readable in small camera panes.
  for (let i = 14; i >= 0; i--) {
    const z = i * 11 + 8 - ((time * 3) % 11);
    for (const side of [-1, 1]) {
      const width = 2.6 + random(i + seed * 3 + side) * 3;
      const height = 5 + random(i + seed * 8 + side + 30) * 12;
      const inner = side * (6.8 + random(i + seed * 10) * 1.1);
      const outer = inner + width * side;
      const front = [
        roadPoint(inner, z),
        roadPoint(outer, z),
        roadPoint(outer, z, height),
        roadPoint(inner, z, height),
      ];
      const wall = [
        roadPoint(inner, z),
        roadPoint(inner, z + 9),
        roadPoint(inner, z + 9, height),
        roadPoint(inner, z, height),
      ];
      path(ctx, front, colors.face, colors.edge + "99", 0.6);
      path(ctx, wall, colors.wall, colors.edge + "88", 0.6);
      path(
        ctx,
        [
          roadPoint(inner, z, height),
          roadPoint(outer, z, height),
          roadPoint(outer, z + 9, height),
          roadPoint(inner, z + 9, height),
        ],
        colors.roof,
        colors.edge + "99",
        0.5,
      );
      for (let y = 1.7; y < height - 0.5; y += 2.1) {
        path(
          ctx,
          [roadPoint(inner, z, y), roadPoint(outer, z, y)],
          null,
          colors.edge + "77",
          0.55,
          false,
        );
        path(
          ctx,
          [roadPoint(inner, z, y), roadPoint(inner, z + 9, y)],
          null,
          colors.edge + "66",
          0.5,
          false,
        );
      }
      for (let x = 0.8; x < width; x += 1.2)
        path(
          ctx,
          [
            roadPoint(inner + side * x, z, 0.5),
            roadPoint(inner + side * x, z, height),
          ],
          null,
          "#66868b55",
          0.5,
          false,
        );
    }
  }
  for (let i = 7; i >= 0; i--) {
    const z = i * 23 + 17 - ((time * 3) % 11);
    for (const side of [-1, 1]) {
      const base = roadPoint(side * 6.3, z);
      const crown = roadPoint(side * 6.3, z, 3.6);
      const radius = (w * 0.046) / (z * 0.035 + 1);
      path(ctx, [base, crown], null, "#407b80", 0.7, false);
      ctx.beginPath();
      ctx.ellipse(crown[0], crown[1], radius, radius * 1.25, 0, 0, TAU);
      ctx.fillStyle = "#123c40";
      ctx.fill();
      ctx.strokeStyle = "#48a69a77";
      ctx.lineWidth = 0.6;
      ctx.stroke();
      for (let leaf = 0; leaf < 12; leaf++) {
        const theta = random(i * 19 + leaf) * TAU;
        const distance = Math.sqrt(random(leaf * 31 + i)) * radius;
        ctx.fillStyle = "#75dfbd66";
        ctx.fillRect(
          crown[0] + Math.cos(theta) * distance,
          crown[1] + Math.sin(theta) * distance,
          1,
          1,
        );
      }
    }
  }
  for (const side of [-1, 1]) {
    path(
      ctx,
      [roadPoint(side * 6.6, 0), roadPoint(side * 6.6, 350)],
      null,
      "#66868b",
      1.2,
      false,
    );
    path(
      ctx,
      [roadPoint(side * 6.1, 0), roadPoint(side * 6.1, 350)],
      null,
      "#385961",
      0.7,
      false,
    );
  }
  for (let z = 0; z < 220; z += 12) {
    const moved = z - ((time * 6) % 12);
    if (moved < 0) continue;
    for (const x of [-2.7, 2.7])
      path(
        ctx,
        [
          roadPoint(x - 0.035, moved),
          roadPoint(x + 0.035, moved),
          roadPoint(x + 0.035, moved + 5),
          roadPoint(x - 0.035, moved + 5),
        ],
        "#9db4b6",
        null,
      );
  }
  path(
    ctx,
    [
      roadPoint(-1.1, 0),
      roadPoint(-0.6, 140),
      roadPoint(0.6, 140),
      roadPoint(1.1, 0),
    ],
    "#22d3ee12",
    null,
  );
  const route = Array.from({ length: 30 }, (_, i) =>
    roadPoint(Math.sin(seed + i * 0.08) * 0.23, i * 5),
  );
  path(ctx, route, null, colors.route + "cc", 1.5, false);
  const vehicles = [
    { x: -3.8, z: 25 + Math.sin(time * 0.35 + seed) * 4 },
    { x: 3.7, z: 48 + Math.sin(time * 0.2) * 5 },
    { x: 0.3, z: 85 },
  ];
  for (const [index, vehicle] of vehicles.entries()) {
    const { x, z } = vehicle;
    const a = roadPoint(x - 1, z),
      b = roadPoint(x + 1, z),
      c = roadPoint(x + 0.85, z, 1.5),
      d = roadPoint(x - 0.85, z, 1.5);
    path(
      ctx,
      [a, b, c, d],
      index === 0 ? "#607b82" : "#47656e",
      "#aac7c9",
      0.7,
    );
    path(
      ctx,
      [
        roadPoint(x - 0.7, z, 1.1),
        roadPoint(x + 0.7, z, 1.1),
        roadPoint(x + 0.55, z, 1.5),
        roadPoint(x - 0.55, z, 1.5),
      ],
      "#142f3a",
      "#557f8b",
      0.5,
    );
  }
  // Subtle point field gives the preview a reconstructed, rather than photographic, texture.
  for (let i = 0; i < (style === 2 ? 320 : 100); i++) {
    const px = random(i * 3 + seed) * w,
      py = random(i * 3 + seed + 1) * h;
    ctx.fillStyle = style === 2 ? "#a8fff14a" : "#b4e6e91c";
    ctx.fillRect(px, py, style === 2 ? 1.5 : 1, 1);
  }
  const shade = ctx.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, "#050c1338");
  shade.addColorStop(0.7, "#050c1300");
  shade.addColorStop(1, "#050c1355");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
}

// Vehicle frame: +X is right, -Z is forward, +Y is up.
// The gallery observer is on the vehicle's centerline, above its rear.
// Camera channels follow the dataset layouts; the pane distances are display spacing.
export const cameraRigs = {
  nuScenes: [
    { name: "FRONT LEFT", yaw: -55, camera: 0 },
    { name: "FRONT", yaw: 0, camera: 1 },
    { name: "FRONT RIGHT", yaw: 55, camera: 2 },
    { name: "REAR LEFT", yaw: -110, camera: 3 },
    { name: "REAR", yaw: 180, camera: 4 },
    { name: "REAR RIGHT", yaw: 110, camera: 5 },
  ],
  Waymo: [
    { name: "FRONT LEFT", yaw: -45, camera: 0 },
    { name: "FRONT", yaw: 0, camera: 1 },
    { name: "FRONT RIGHT", yaw: 45, camera: 2 },
    { name: "SIDE LEFT", yaw: -90, camera: 3 },
    { name: "SIDE RIGHT", yaw: 90, camera: 5 },
  ],
  NuRec: [
    { name: "CROSS LEFT", yaw: -60, camera: 0 },
    { name: "FRONT WIDE", yaw: 0, camera: 1 },
    { name: "CROSS RIGHT", yaw: 60, camera: 2 },
    { name: "REAR LEFT", yaw: -135, camera: 3 },
    { name: "FRONT TELE", yaw: 0, camera: 4 },
    { name: "REAR RIGHT", yaw: 135, camera: 5 },
  ],
};

export function camerasFor(owner) {
  const dataset =
    owner === "gallery"
      ? visualState.dataset
      : owner === "renderer" && visualState.scenes.renderer >= 2
        ? "Waymo"
        : "nuScenes";
  return cameraRigs[dataset];
}

// Preview textures preserve 16:9, including the requested 1600 × 900 NuRec views.
const rigFrame = { width: 384, height: 216 };
const rigRing = { radius: 9.6, centerY: 1 };
const rigElevation = Math.PI / 6;
const rigDistance = 120;

// Flat, vertical panels share one ring; the observer stays on the car's centerline.
export function rigProjection(w, h, cameras = camerasFor("gallery")) {
  const target = [0, rigRing.centerY, 0];
  const observer = [
    0,
    target[1] + rigDistance * Math.sin(rigElevation),
    rigDistance * Math.cos(rigElevation),
  ];
  const normalized = projection(observer, target, [0, 0], 1);
  const bounds = cameras.flatMap((camera) => {
    const panel = cameraPanel(camera, cameras);
    return [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ].map(([u, v]) => normalized(panel.point(u, v)));
  });
  const xs = bounds.map((point) => point[0]),
    ys = bounds.map((point) => point[1]);
  const left = Math.min(...xs),
    right = Math.max(...xs),
    top = Math.min(...ys),
    bottom = Math.max(...ys);
  const padding = Math.min(w, h) * 0.07;
  const focal = Math.min(
    (w - padding * 2) / (right - left),
    (h - padding * 2) / (bottom - top),
  );
  return projection(
    observer,
    target,
    [
      w / 2 - ((left + right) * focal) / 2,
      h / 2 - ((top + bottom) * focal) / 2,
    ],
    focal,
  );
}

export function cameraPanel(camera, cameras) {
  const angle = (camera.yaw * Math.PI) / 180;
  const directions = [...new Set(cameras.map((c) => (c.yaw + 360) % 360))].sort(
    (a, b) => a - b,
  );
  const spacing = Math.min(
    ...directions.map(
      (yaw, index) =>
        (directions[(index + 1) % directions.length] - yaw + 360) % 360,
    ),
  );
  const { radius, centerY } = rigRing;
  const aspect = rigFrame.width / rigFrame.height;
  // Use one scale for every camera, including cameras sharing a direction.
  const width = 2 * radius * Math.tan((spacing * Math.PI) / 360) - 0.7;
  const height = width / aspect;
  const channels = cameras.filter((c) => c.yaw === camera.yaw);
  const gap = 0.16;
  const panelHeight = height;
  const panelWidth = width;
  const stackHeight = channels.length * panelHeight + gap * (channels.length - 1);
  const top =
    centerY + stackHeight / 2 - channels.indexOf(camera) * (panelHeight + gap);
  const sin = Math.sin(angle),
    cos = Math.cos(angle);
  return {
    width: panelWidth,
    height: panelHeight,
    frontFacing:
      rigRing.radius + rigDistance * Math.cos(rigElevation) * cos > 0,
    normal: [-sin, 0, cos],
    point(u, v) {
      const across = (u - 0.5) * panelWidth;
      return [
        radius * sin + across * cos,
        top - panelHeight * v,
        -radius * cos + across * sin,
      ];
    },
  };
}

function panelOutline(panel) {
  const ru = 0.025,
    rv = 0.055;
  const corners = [
    [1 - ru, rv, -Math.PI / 2],
    [1 - ru, 1 - rv, 0],
    [ru, 1 - rv, Math.PI / 2],
    [ru, rv, Math.PI],
  ];
  return corners.flatMap(([u, v, start]) =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = start + ((i / 5) * Math.PI) / 2;
      return panel.point(u + Math.cos(angle) * ru, v + Math.sin(angle) * rv);
    }),
  );
}

// Project a flat image through a small triangle grid without curving its surface.
function texturedTriangle(ctx, texture, source, target) {
  const [[x0, y0], [x1, y1], [x2, y2]] = source;
  const [[u0, v0], [u1, v1], [u2, v2]] = target;
  const determinant = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
  const coefficient = (a, b, c) => [
    (a * (y1 - y2) + b * (y2 - y0) + c * (y0 - y1)) / determinant,
    (a * (x2 - x1) + b * (x0 - x2) + c * (x1 - x0)) / determinant,
    (a * (x1 * y2 - x2 * y1) +
      b * (x2 * y0 - x0 * y2) +
      c * (x0 * y1 - x1 * y0)) /
      determinant,
  ];
  const [a, c, e] = coefficient(u0, u1, u2),
    [b, d, f] = coefficient(v0, v1, v2);
  ctx.save();
  const cx = (u0 + u1 + u2) / 3,
    cy = (v0 + v1 + v2) / 3;
  path(
    ctx,
    target.map(([x, y]) => {
      const length = Math.hypot(x - cx, y - cy);
      return [x + ((x - cx) / length) * 0.3, y + ((y - cy) / length) * 0.3];
    }),
    null,
    null,
  );
  ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(texture, 0, 0);
  ctx.restore();
}

const rigTextures = Array.from({ length: 6 }, () => {
  const canvas = document.createElement("canvas");
  canvas.width = rigFrame.width;
  canvas.height = rigFrame.height;
  return { canvas, ctx: canvas.getContext("2d") };
});

function drawRig(ctx, w, h, time, scene) {
  const project = rigProjection(w, h);
  const cameras = camerasFor("gallery");
  const panes = cameras.map((camera) => ({
    ...camera,
    panel: cameraPanel(camera, cameras),
    texture: rigTextures[camera.camera],
  }));
  const drawPane = (pane) => {
    const { canvas, ctx: paint } = pane.texture;
    const { panel } = pane;
    drawStreet(
      paint,
      canvas.width,
      canvas.height,
      time,
      scene,
      pane.yaw / 55,
      0,
    );
    const outline = panelOutline(panel).map(project);
    ctx.save();
    path(ctx, outline, "#061322", null);
    ctx.clip();
    const divisions = 5;
    for (let row = 0; row < divisions; row++)
      for (let col = 0; col < divisions; col++) {
        const uv = [
          [col / divisions, row / divisions],
          [(col + 1) / divisions, row / divisions],
          [(col + 1) / divisions, (row + 1) / divisions],
          [col / divisions, (row + 1) / divisions],
        ];
        const target = uv.map(([u, v]) => project(panel.point(u, v)));
        const source = uv.map(([u, v]) => [
          u * canvas.width,
          v * canvas.height,
        ]);
        for (const indices of [
          [0, 1, 2],
          [0, 2, 3],
        ])
          texturedTriangle(
            ctx,
            canvas,
            indices.map((i) => source[i]),
            indices.map((i) => target[i]),
          );
      }
    if (!panel.frontFacing) path(ctx, outline, "#020617ad", null);
    ctx.restore();
    path(
      ctx,
      outline,
      null,
      panel.frontFacing ? "#568b9e70" : "#3c628e55",
      0.7,
    );
  };
  const sorted = panes.sort(
    (a, b) =>
      project(b.panel.point(0.5, 0.5))[2] - project(a.panel.point(0.5, 0.5))[2],
  );
  sorted.filter((pane) => pane.panel.point(0.5, 0.5)[2] < 0).forEach(drawPane);
  car(ctx, project, 0, 0, 1.65, time);
  sorted.filter((pane) => pane.panel.point(0.5, 0.5)[2] >= 0).forEach(drawPane);
}

function drawMap(ctx, w, h, time, seed, mode = 0) {
  ctx.fillStyle = "#061225";
  ctx.fillRect(0, 0, w, h);
  const scale = Math.max(w, h) / 350;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.3 + seed * 0.22);
  ctx.scale(scale, scale);
  for (let x = -350; x <= 350; x += 18) {
    path(
      ctx,
      [
        [x, -350],
        [x, 350],
      ],
      null,
      "#1b2b332f",
      0.5,
      false,
    );
    path(
      ctx,
      [
        [-350, x],
        [350, x],
      ],
      null,
      "#1b2b332f",
      0.5,
      false,
    );
  }
  for (let x = -350; x < 350; x += 90)
    for (let y = -350; y < 350; y += 105) {
      ctx.fillStyle = "#122b3e";
      ctx.fillRect(x + 19, y + 20, 49, 63);
      ctx.strokeStyle = "#2d526a";
      ctx.lineWidth = 0.7;
      ctx.strokeRect(x + 19, y + 20, 49, 63);
      ctx.strokeStyle = "#2e5d7255";
      ctx.strokeRect(x + 24, y + 26, 39, 51);
    }
  for (let x = -360; x <= 360; x += 90) {
    path(
      ctx,
      [
        [x, -400],
        [x, 400],
      ],
      null,
      "#314c58",
      1,
      false,
    );
    path(
      ctx,
      [
        [x + 12, -400],
        [x + 12, 400],
      ],
      null,
      "#314c58",
      1,
      false,
    );
    ctx.setLineDash([5, 5]);
    path(
      ctx,
      [
        [x + 6, -400],
        [x + 6, 400],
      ],
      null,
      "#55707880",
      0.5,
      false,
    );
    ctx.setLineDash([]);
  }
  for (let y = -420; y <= 420; y += 105) {
    path(
      ctx,
      [
        [-400, y],
        [400, y],
      ],
      null,
      "#314c58",
      1,
      false,
    );
    path(
      ctx,
      [
        [-400, y + 12],
        [400, y + 12],
      ],
      null,
      "#314c58",
      1,
      false,
    );
    ctx.setLineDash([5, 5]);
    path(
      ctx,
      [
        [-400, y + 6],
        [400, y + 6],
      ],
      null,
      "#55707880",
      0.5,
      false,
    );
    ctx.setLineDash([]);
  }
  const route = [
    [6, 180],
    [6, 45],
    [6, 20],
    [15, 7],
    [35, 6],
    [230, 6],
  ];
  path(ctx, route, null, "#6deab418", 14, false);
  path(ctx, route, null, "#6deab480", 2, false);
  ctx.setLineDash([3, 6]);
  ctx.lineDashOffset = -time * 12;
  path(ctx, route, null, "#6deab4", 1.4, false);
  ctx.setLineDash([]);
  const motion = Math.sin(time * 0.3) * 16;
  for (let i = 0; i < 15; i++) {
    const vertical = i % 2 === 0;
    const x = vertical
      ? ((i % 3) - 1) * 90 + 3
      : (random(i + seed) - 0.5) * 300 + ((time * (mode === 0 ? 3 : 2)) % 22);
    const y = vertical
      ? (random(i + seed + 30) - 0.5) * 300 + motion
      : ((i % 3) - 1) * 105 + 3;
    ctx.fillStyle = i % 3 === 0 ? "#4c8bb4" : "#31598c";
    ctx.strokeStyle = "#81bded";
    ctx.lineWidth = 0.6;
    ctx.fillRect(x - 3, y - 5, vertical ? 5 : 9, vertical ? 9 : 5);
    ctx.strokeRect(x - 3, y - 5, vertical ? 5 : 9, vertical ? 9 : 5);
  }
  const egoY = 55 - motion * (mode === 2 ? 0.6 : 1);
  ctx.shadowColor = "#6deab4";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#6deab4";
  ctx.fillRect(1, egoY, 8, 15);
  ctx.shadowBlur = 0;
  path(
    ctx,
    [
      [5, egoY - 10],
      [1, egoY - 3],
      [9, egoY - 3],
    ],
    "#6deab4",
    null,
  );
  ctx.restore();
  const fade = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.15,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.7,
  );
  fade.addColorStop(0, "#06122500");
  fade.addColorStop(1, "#061225ba");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, w, h);
  if (w > 200) {
    ctx.font = `7px ${mono}`;
    ctx.fillStyle = "#7b9aa8";
    path(
      ctx,
      [
        [w - 65, h - 22],
        [w - 25, h - 22],
      ],
      null,
      "#6a929d",
      1,
      false,
    );
    ctx.fillText("20 m", w - 60, h - 10);
  }
}

export function startVisuals() {
  const canvases = [...document.querySelectorAll("canvas[data-visual]")].map(
    (canvas) => ({
      canvas,
      ctx: canvas.getContext("2d"),
      owner: canvas.closest(".chapter").id,
      width: 0,
      height: 0,
      elapsed: 6,
    }),
  );
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const item = canvases.find((item) => item.canvas === entry.target);
      item.width = entry.contentRect.width;
      item.height = entry.contentRect.height;
      const ratio = Math.min(devicePixelRatio, 2);
      item.canvas.width = Math.round(item.width * ratio);
      item.canvas.height = Math.round(item.height * ratio);
      item.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
  });
  canvases.forEach((item) => observer.observe(item.canvas));
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || now - last < 40) return;
    const delta = Math.min((now - last) / 1000, 0.1);
    last = now;
    for (const item of canvases) {
      if (
        item.owner !== visualState.active ||
        item.width === 0 ||
        item.height === 0 ||
        item.canvas.getClientRects().length === 0
      )
        continue;
      if (!visualState.paused[item.owner] && !motion.matches)
        item.elapsed += delta;
      const { ctx, width: w, height: h, canvas, elapsed: t } = item;
      const seed = visualState.scenes[item.owner] || 0;
      const datasetOffset =
        ["nuScenes", "Waymo", "NuRec"].indexOf(visualState.dataset) * 4;
      const policyOffset = [
        "Expert",
        "UniAD",
        "VAD",
        "DiffusionDrive",
        "OpenDriveVLA",
      ].indexOf(visualState.policy);
      ctx.clearRect(0, 0, w, h);
      switch (canvas.dataset.visual) {
        case "framework":
          drawWorld(ctx, w, h, t);
          break;
        case "rig":
          drawRig(ctx, w, h, t, seed + datasetOffset);
          break;
        case "map":
          drawMap(ctx, w, h, t, seed, Number(canvas.dataset.mode || 0));
          break;
        case "camera": {
          const camera = camerasFor(item.owner).find(
            (camera) => camera.camera === Number(canvas.dataset.camera),
          );
          const offset =
            item.owner === "gallery"
              ? datasetOffset
              : item.owner === "policy"
                ? policyOffset
                : 0;
          drawStreet(
            ctx,
            w,
            h,
            t + Number(canvas.dataset.mode) * 2,
            seed + offset,
            camera.yaw / 55,
            item.owner === "renderer"
              ? ["Street GS", "OmniRe", "InfiniSplat"].indexOf(
                  visualState.renderer,
                )
              : 0,
          );
          break;
        }
      }
    }

  }
  requestAnimationFrame(frame);
}
