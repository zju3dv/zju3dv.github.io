(() => {
  const design = document.querySelector('[data-title-design]');
  const text = document.querySelector('[data-title-text]');
  const canvas = document.querySelector('[data-title-canvas]');
  if (!design || !text || !canvas) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 4200;
  const latitude = 55 * Math.PI / 180;
  let pending = !reduced.matches;
  let visible = false;
  let ready = false;
  let frame = 0;
  let render = null;
  let lastSize = '';
  let gl;

  // A single small normal map gives the whole word a shared bevel and extrusion.
  // It is rebuilt only for font/size changes. Lighting then runs on the GPU.
  function distanceInside(alpha, width, height) {
    const distance = new Float32Array(width * height);
    for (let i = 0; i < distance.length; i++) distance[i] = alpha[i * 4 + 3] > 127 ? 1e6 : 0;
    const diagonal = Math.SQRT2;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        distance[i] = Math.min(distance[i], distance[i - 1] + 1, distance[i - width] + 1,
          distance[i - width - 1] + diagonal, distance[i - width + 1] + diagonal);
      }
    }
    for (let y = height - 2; y > 0; y--) {
      for (let x = width - 2; x > 0; x--) {
        const i = y * width + x;
        distance[i] = Math.min(distance[i], distance[i + 1] + 1, distance[i + width] + 1,
          distance[i + width - 1] + diagonal, distance[i + width + 1] + diagonal);
      }
    }
    return distance;
  }

  function makeSurface() {
    const style = getComputedStyle(design);
    const size = parseFloat(style.fontSize);
    const ratio = 2; // Supersample bevel edges, including on 1× desktop displays.
    const padding = 8;
    const bounds = design.getBoundingClientRect();
    const width = Math.ceil((bounds.width + padding * 2) * ratio);
    const height = Math.ceil((bounds.height + padding * 2) * ratio);
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width / ratio}px`;
    canvas.style.height = `${height / ratio}px`;
    canvas.style.left = `${-padding}px`;
    canvas.style.top = `${-padding}px`;
    const mask = document.createElement('canvas');
    mask.width = width;
    mask.height = height;
    const ctx = mask.getContext('2d', { willReadFrequently: true });
    ctx.font = `${style.fontWeight} ${size * ratio}px ${style.fontFamily}`;
    ctx.fontKerning = 'none';
    const tracking = parseFloat(style.letterSpacing) * ratio;
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'alphabetic';
    const metrics = ctx.measureText(text.textContent);
    const ascent = metrics.fontBoundingBoxAscent ?? size * ratio * .99;
    const descent = metrics.fontBoundingBoxDescent ?? size * ratio * .21;
    const baseline = padding * ratio + (bounds.height * ratio - ascent - descent) / 2 + ascent;
    let cursor = padding * ratio;
    for (const letter of text.textContent) {
      ctx.fillText(letter, cursor, baseline);
      cursor += ctx.measureText(letter).width + tracking;
    }
    const ink = ctx.getImageData(0, 0, width, height).data;
    const distance = distanceInside(ink, width, height);
    const pixels = new Uint8Array(width * height * 4);
    const bevel = 2.1 * ratio;
    const depthX = Math.round(.6 * ratio);
    const depthY = Math.round(3.2 * ratio);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const face = ink[i * 4 + 3] / 255;
        const back = x >= depthX && y >= depthY ? ink[((y - depthY) * width + x - depthX) * 4 + 3] / 255 : 0;
        const alpha = face + back * (1 - face);
        if (!alpha) continue;
        const dx = (distance[i + 1] - distance[i - 1]) / 2;
        const dy = (distance[i + width] - distance[i - width]) / 2;
        const length = Math.hypot(dx, dy) || 1;
        const slope = Math.max(0, 1 - Math.max(0, distance[i] - .5) / bevel);
        const nx = -dx / length * slope;
        const ny = dy / length * slope;
        const nz = Math.sqrt(Math.max(.04, 1 - slope * slope));
        const weight = face / alpha;
        pixels[i * 4] = ((nx * weight + .18 * (1 - weight)) * .5 + .5) * 255;
        pixels[i * 4 + 1] = ((ny * weight - .93 * (1 - weight)) * .5 + .5) * 255;
        pixels[i * 4 + 2] = ((nz * weight + .32 * (1 - weight)) * .5 + .5) * 255;
        pixels[i * 4 + 3] = alpha * 255;
      }
    }
    return { pixels, width, height, aspect: width / height, emHeight: height / ratio / size };
  }

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Title shader unavailable');
    return shader;
  }

  function createRenderer() {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, depth: false, preserveDrawingBuffer: true });
    if (!gl) return null;
    const vertex = compile(gl.VERTEX_SHADER, `
      attribute vec2 position;
      varying vec2 uv;
      void main() { uv = vec2(position.x * .5 + .5, .5 - position.y * .5); gl_Position = vec4(position, 0., 1.); }
    `);
    const fragment = compile(gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D surface;
      uniform vec3 light;
      uniform vec2 extent;
      varying vec2 uv;
      void main() {
        vec4 texel = texture2D(surface, uv);
        if (texel.a < .004) { gl_FragColor = vec4(0.); return; }
        vec3 normal = normalize(texel.rgb * 2. - 1.);
        vec3 point = vec3((uv.x - .5) * extent.x, (.5 - uv.y) * extent.y, 0.);
        vec3 direction = normalize(light * 8. - point);
        float diffuse = max(dot(normal, direction), 0.);
        vec3 halfway = normalize(direction + vec3(0., 0., 1.));
        float specular = pow(max(dot(normal, halfway), 0.), 38.) * .24;
        float front = smoothstep(.22, .65, normal.z);
        vec3 silver = mix(vec3(.24, .31, .37), vec3(.76, .81, .85), front);
        vec3 color = silver * (.28 + diffuse * .88) + vec3(.86, .93, 1.) * specular;
        // A soft upper fill keeps letter shapes legible when the key passes behind.
        color += vec3(.08, .10, .12) * max(normal.y, 0.);
        gl_FragColor = vec4(color, texel.a);
      }
    `);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Title renderer unavailable');
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const light = gl.getUniformLocation(program, 'light');
    const extent = gl.getUniformLocation(program, 'extent');
    return {
      resize() {
        const map = makeSurface();
        gl.viewport(0, 0, map.width, map.height);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, map.width, map.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, map.pixels);
        gl.uniform2f(extent, map.aspect * map.emHeight, map.emHeight);
      },
      draw(angle = 0) {
        // x is right, y is up, z faces the reader. Increasing azimuth is CCW
        // from above; on the front half the light travels from left to right.
        const x = Math.sin(angle) * Math.cos(latitude);
        const y = Math.sin(latitude);
        const z = Math.cos(angle) * Math.cos(latitude);
        gl.uniform3f(light, x, y, z);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    };
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (render && !gl.isContextLost()) render.draw();
  }

  function play() {
    if (frame || !ready || !render || reduced.matches || !visible || document.hidden) return;
    pending = false;
    const started = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - started) / duration);
      // Smooth acceleration and deceleration, one complete orbit, no loop.
      const phase = progress * progress * (3 - 2 * progress);
      render.draw(phase * Math.PI * 2);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else stop();
    }
    frame = requestAnimationFrame(tick);
  }

  function resize() {
    if (!render) return;
    const box = design.getBoundingClientRect();
    const size = `${box.width},${box.height},${devicePixelRatio}`;
    if (size === lastSize) return;
    lastSize = size;
    stop();
    render.resize();
    render.draw();
    design.classList.add('is-lit');
  }

  design.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') play();
  });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= .5;
    if (!visible) stop();
    else if (pending) play();
  }, { threshold: [0, .5] });
  observer.observe(design);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (pending) play();
  });
  reduced.addEventListener('change', () => { pending = false; stop(); });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    pending = false;
    stop();
    ready = false;
    render = null;
    design.classList.remove('is-lit');
  });

  document.fonts.load('700 92px "Lato"', 'DynOLAT').catch(() => {}).then(() => {
    try {
      render = createRenderer();
      if (!render) return;
      resize();
      ready = true;
      new ResizeObserver(resize).observe(design);
      if (pending) play();
    } catch {
      render = null;
      design.classList.remove('is-lit');
    }
  });
})();
