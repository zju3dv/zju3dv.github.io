// Self-contained WebGL2 3D Gaussian Splatting viewer with navmesh constraints.
// No external dependencies. Based on the EWA splatting approach.

// ======================== GLSL SHADERS ========================

const VERT_SRC = `#version 300 es
precision highp float;
precision highp int;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform vec2 u_viewport;
uniform highp sampler2D u_posTex;   // xyz, opacity
uniform highp sampler2D u_covATex;  // c00,c01,c02,c11
uniform highp sampler2D u_covBTex;  // c12,c22,0,0
uniform highp sampler2D u_colorTex; // r,g,b,a (normalized)
uniform int u_texWidth;

in vec2 a_quad;        // quad corner [-1,1]
in uint a_splatIdx;    // sorted gaussian index (instanced)

out vec4 v_color;
out vec2 v_offset;

ivec2 idxToCoord(uint idx) {
    return ivec2(int(idx) % u_texWidth, int(idx) / u_texWidth);
}

void main() {
    ivec2 tc = idxToCoord(a_splatIdx);

    vec4 posOp  = texelFetch(u_posTex,   tc, 0);
    vec4 covA   = texelFetch(u_covATex,  tc, 0);
    vec4 covB   = texelFetch(u_covBTex,  tc, 0);
    vec4 color  = texelFetch(u_colorTex, tc, 0);

    vec3 center = posOp.xyz;
    float opacity = posOp.w;

    // Transform to view space
    vec4 p_view = u_view * vec4(center, 1.0);
    float z = -p_view.z;

    if (z < 0.2 || z > 200.0) {
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }

    vec4 p_clip = u_proj * p_view;

    float fx = u_proj[0][0] * u_viewport.x * 0.5;
    float fy = u_proj[1][1] * u_viewport.y * 0.5;
    float z2 = z * z;

    // Clamp view-space position ratio to prevent Jacobian blow-up near frustum edges
    float limx = 1.3 * (0.5 * u_viewport.x / fx);
    float limy = 1.3 * (0.5 * u_viewport.y / fy);
    float tx = clamp(p_view.x / z, -limx, limx) * z;
    float ty = clamp(p_view.y / z, -limy, limy) * z;

    // Jacobian of perspective projection (view-space → pixel-space)
    // d(pixel)/d(view): positive signs on the z-derivative column
    mat3 J = mat3(
        fx / z,  0.0,     0.0,
        0.0,     fy / z,  0.0,
        fx * tx / z2, fy * ty / z2, 0.0
    );

    mat3 W = mat3(u_view); // view rotation

    mat3 T = J * W; // world → pixel-space Jacobian

    // 3D world-space covariance (symmetric)
    mat3 Sigma = mat3(
        covA.x, covA.y, covA.z,
        covA.y, covA.w, covB.x,
        covA.z, covB.x, covB.y
    );

    mat3 cov2D = T * Sigma * transpose(T);

    // Extract 2x2 with regularization
    float a = cov2D[0][0] + 0.3;
    float b = cov2D[0][1];
    float d = cov2D[1][1] + 0.3;

    float det = a * d - b * b;
    if (det < 0.0001) {
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }

    float trace = a + d;
    float mid = 0.5 * trace;
    float disc = max(0.01, mid * mid - det);
    float sqrtDisc = sqrt(disc);
    float lambda1 = mid + sqrtDisc;
    float lambda2 = max(0.01, mid - sqrtDisc);

    vec2 v1;
    if (abs(b) > 0.0001) {
        v1 = normalize(vec2(b, lambda1 - a));
    } else {
        v1 = vec2(1.0, 0.0);
    }
    vec2 v2 = vec2(-v1.y, v1.x);

    float radius = 3.0;
    float r1 = radius * sqrt(lambda1);
    float r2 = radius * sqrt(lambda2);

    // Cull very large or very small splats
    if (r1 > u_viewport.x * 2.0 || r1 < 0.1) {
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }

    vec2 pixelOffset = a_quad.x * v1 * r1 + a_quad.y * v2 * r2;

    gl_Position = p_clip;
    gl_Position.xy += pixelOffset * 2.0 / u_viewport * gl_Position.w;

    v_offset = a_quad * radius;
    v_color = vec4(color.rgb, opacity);
}
`;

const FRAG_SRC = `#version 300 es
precision highp float;

in vec4 v_color;
in vec2 v_offset;

out vec4 fragColor;

void main() {
    float power = -0.5 * dot(v_offset, v_offset);
    if (power < -4.5) discard; // beyond 3-sigma
    float alpha = v_color.a * exp(power);
    if (alpha < 1.0 / 255.0) discard;
    fragColor = vec4(v_color.rgb * alpha, alpha);
}
`;

// ======================== MATH UTILITIES ========================

function mat4Perspective(fovY, aspect, near, far) {
    const f = 1.0 / Math.tan(fovY / 2);
    const nf = 1.0 / (near - far);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0,
    ]);
}

function computeViewMatrix(pos, yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);

    // Camera basis vectors in world space
    const rx = cy, ry = 0, rz = -sy;                       // right
    const ux = sy * sp, uy = cp, uz = cy * sp;             // up
    const fwx = sy * cp, fwy = -sp, fwz = cy * cp;        // -look direction (local +Z)

    const tx = -(rx * pos[0] + ry * pos[1] + rz * pos[2]);
    const ty = -(ux * pos[0] + uy * pos[1] + uz * pos[2]);
    const tz = -(fwx * pos[0] + fwy * pos[1] + fwz * pos[2]);

    // Column-major
    return new Float32Array([
        rx, ux, fwx, 0,
        ry, uy, fwy, 0,
        rz, uz, fwz, 0,
        tx, ty, tz, 1,
    ]);
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const MINIMAP_SIZE = 128;
const MINIMAP_PADDING = 10;

// ======================== RADIX SORT ========================

class RadixSorter {
    constructor(maxCount) {
        this.maxCount = maxCount;
        this.keys = new Uint32Array(maxCount);
        this.indices = new Uint32Array(maxCount);
        this.tmpKeys = new Uint32Array(maxCount);
        this.tmpIndices = new Uint32Array(maxCount);
        this.counts = new Uint32Array(256);
    }

    sort(depths, count) {
        const { keys, indices, tmpKeys, tmpIndices, counts } = this;

        // Convert depth to sortable uint32 key (negate for back-to-front)
        const f32 = new Float32Array(1);
        const i32 = new Int32Array(f32.buffer);
        for (let i = 0; i < count; i++) {
            f32[0] = -depths[i];
            const v = i32[0];
            keys[i] = v >= 0 ? (v | 0x80000000) >>> 0 : (~v) >>> 0;
            indices[i] = i;
        }

        // 4-pass radix sort (8 bits per pass)
        let kSrc = keys, kDst = tmpKeys, iSrc = indices, iDst = tmpIndices;
        for (let shift = 0; shift < 32; shift += 8) {
            counts.fill(0);
            for (let i = 0; i < count; i++) {
                counts[(kSrc[i] >>> shift) & 0xFF]++;
            }
            let sum = 0;
            for (let i = 0; i < 256; i++) {
                const c = counts[i]; counts[i] = sum; sum += c;
            }
            for (let i = 0; i < count; i++) {
                const b = (kSrc[i] >>> shift) & 0xFF;
                const d = counts[b]++;
                kDst[d] = kSrc[i];
                iDst[d] = iSrc[i];
            }
            [kSrc, kDst] = [kDst, kSrc];
            [iSrc, iDst] = [iDst, iSrc];
        }

        return iSrc;
    }
}

// ======================== NAVMESH ========================

class NavMesh {
    constructor(data) {
        this.vertices = data.vertices;
        this.triangles = data.triangles;
        this.params = data.params;
        this.groundY = data.vertices[0][1]; // flat navmesh
    }

    _sign(px, pz, ax, az, bx, bz) {
        return (px - bx) * (az - bz) - (ax - bx) * (pz - bz);
    }

    _pointInTriangle(px, pz, tri) {
        const v = this.vertices;
        const [ai, bi, ci] = tri;
        const ax = v[ai][0], az = v[ai][2];
        const bx = v[bi][0], bz = v[bi][2];
        const cx = v[ci][0], cz = v[ci][2];

        const d1 = this._sign(px, pz, ax, az, bx, bz);
        const d2 = this._sign(px, pz, bx, bz, cx, cz);
        const d3 = this._sign(px, pz, cx, cz, ax, az);
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        return !(hasNeg && hasPos);
    }

    isOnMesh(x, z) {
        for (const tri of this.triangles) {
            if (this._pointInTriangle(x, z, tri)) return true;
        }
        return false;
    }

    closestPointOnEdge(px, pz, ax, az, bx, bz) {
        const dx = bx - ax, dz = bz - az;
        const len2 = dx * dx + dz * dz;
        if (len2 < 1e-10) return [ax, az];
        let t = ((px - ax) * dx + (pz - az) * dz) / len2;
        t = Math.max(0, Math.min(1, t));
        return [ax + t * dx, az + t * dz];
    }

    constrainMove(fromX, fromZ, toX, toZ) {
        if (this.isOnMesh(toX, toZ)) return [toX, toZ];

        // Sliding: try X-only, then Z-only
        if (this.isOnMesh(toX, fromZ)) return [toX, fromZ];
        if (this.isOnMesh(fromX, toZ)) return [fromX, toZ];

        // Find nearest point on any navmesh edge
        let bestDist = Infinity, bestX = fromX, bestZ = fromZ;
        for (const tri of this.triangles) {
            const v = this.vertices;
            const edges = [
                [tri[0], tri[1]], [tri[1], tri[2]], [tri[2], tri[0]]
            ];
            for (const [ai, bi] of edges) {
                const [cx, cz] = this.closestPointOnEdge(
                    toX, toZ, v[ai][0], v[ai][2], v[bi][0], v[bi][2]
                );
                const dist = (cx - toX) ** 2 + (cz - toZ) ** 2;
                if (dist < bestDist) {
                    bestDist = dist; bestX = cx; bestZ = cz;
                }
            }
        }
        if (this.isOnMesh(bestX, bestZ)) return [bestX, bestZ];
        return [fromX, fromZ];
    }
}

// ======================== SPLAT LOADER ========================

async function loadSplatFile(url, onProgress) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);

    const contentLength = +resp.headers.get('Content-Length') || 0;
    const reader = resp.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (onProgress && contentLength > 0) {
            onProgress(received / contentLength);
        }
    }

    const buffer = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
    }

    return buffer.buffer;
}

function processSplatData(buffer) {
    const BYTES_PER_SPLAT = 32;
    const count = buffer.byteLength / BYTES_PER_SPLAT;
    if (count !== Math.floor(count)) {
        throw new Error('Invalid splat file size');
    }

    const data = new DataView(buffer);
    const positions = new Float32Array(count * 4);  // x,y,z,opacity
    const covA = new Float32Array(count * 4);       // c00,c01,c02,c11
    const covB = new Float32Array(count * 4);       // c12,c22,0,0
    const colors = new Float32Array(count * 4);     // r,g,b,a (normalized)

    for (let i = 0; i < count; i++) {
        const off = i * BYTES_PER_SPLAT;

        const x = data.getFloat32(off, true);
        const y = data.getFloat32(off + 4, true);
        const z = data.getFloat32(off + 8, true);

        const sx = data.getFloat32(off + 12, true);
        const sy = data.getFloat32(off + 16, true);
        const sz = data.getFloat32(off + 20, true);

        const r = data.getUint8(off + 24) / 255;
        const g = data.getUint8(off + 25) / 255;
        const b = data.getUint8(off + 26) / 255;
        const a = data.getUint8(off + 27) / 255;

        const qw = (data.getUint8(off + 28) - 128) / 128;
        const qx = (data.getUint8(off + 29) - 128) / 128;
        const qy = (data.getUint8(off + 30) - 128) / 128;
        const qz = (data.getUint8(off + 31) - 128) / 128;

        // Normalize quaternion
        const qlen = Math.sqrt(qw * qw + qx * qx + qy * qy + qz * qz) || 1;
        const nw = qw / qlen, nx = qx / qlen, ny = qy / qlen, nz = qz / qlen;

        // Rotation matrix from quaternion
        const r00 = 1 - 2 * (ny * ny + nz * nz);
        const r01 = 2 * (nx * ny - nw * nz);
        const r02 = 2 * (nx * nz + nw * ny);
        const r10 = 2 * (nx * ny + nw * nz);
        const r11 = 1 - 2 * (nx * nx + nz * nz);
        const r12 = 2 * (ny * nz - nw * nx);
        const r20 = 2 * (nx * nz - nw * ny);
        const r21 = 2 * (ny * nz + nw * nx);
        const r22 = 1 - 2 * (nx * nx + ny * ny);

        // T = R * diag(sx, sy, sz)
        const t00 = r00 * sx, t01 = r01 * sy, t02 = r02 * sz;
        const t10 = r10 * sx, t11 = r11 * sy, t12 = r12 * sz;
        const t20 = r20 * sx, t21 = r21 * sy, t22 = r22 * sz;

        // Covariance Sigma = T * T^T (6 unique values)
        const c00 = t00 * t00 + t01 * t01 + t02 * t02;
        const c01 = t00 * t10 + t01 * t11 + t02 * t12;
        const c02 = t00 * t20 + t01 * t21 + t02 * t22;
        const c11 = t10 * t10 + t11 * t11 + t12 * t12;
        const c12 = t10 * t20 + t11 * t21 + t12 * t22;
        const c22 = t20 * t20 + t21 * t21 + t22 * t22;

        positions[i * 4] = x;
        positions[i * 4 + 1] = y;
        positions[i * 4 + 2] = z;
        positions[i * 4 + 3] = a; // use splat alpha as opacity

        covA[i * 4] = c00;
        covA[i * 4 + 1] = c01;
        covA[i * 4 + 2] = c02;
        covA[i * 4 + 3] = c11;

        covB[i * 4] = c12;
        covB[i * 4 + 1] = c22;
        covB[i * 4 + 2] = 0;
        covB[i * 4 + 3] = 0;

        colors[i * 4] = r;
        colors[i * 4 + 1] = g;
        colors[i * 4 + 2] = b;
        colors[i * 4 + 3] = 1.0;
    }

    return { count, positions, covA, covB, colors };
}

// ======================== WEBGL HELPERS ========================

function compileShader(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('Shader compile error: ' + log);
    }
    return shader;
}

function createProgram(gl, vsSrc, fsSrc) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error('Program link error: ' + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function createDataTexture(gl, data, width, height, internalFormat, format, type) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
}

// ======================== MAIN VIEWER CLASS ========================

export class GaussianViewer {
    constructor(container) {
        this.container = container;
        this.canvas = container.querySelector('canvas') || document.createElement('canvas');
        if (!this.canvas.parentElement) container.appendChild(this.canvas);

        this.gl = null;
        this.program = null;
        this.splatCount = 0;
        this.navmesh = null;

        // Camera
        this.camPos = new Float32Array([0, 1.4, 0]);
        this.camYaw = 0;
        this.camPitch = 0;
        this.eyeHeight = 1.2;
        this.moveSpeed = 3.0;   // m/s
        this.rotSpeed = 1.8;    // rad/s

        // Input
        this.keys = {};
        this.focused = false;

        // Performance
        this.frameCount = 0;
        this.lastFpsTime = 0;
        this.fps = 0;

        // Sorting
        this.sorter = null;
        this.depths = null;
        this.sortedIndices = null;
        this.sortedIdxBuffer = null;

        // Data
        this.posData = null;

        // Minimap
        this.minimapBounds = null;
        this.minimapScale = 1;
        this.minimapPadding = MINIMAP_PADDING;
        this._initMinimap();

        this._bindEvents();
    }

    _bindEvents() {
        const c = this.container;

        c.addEventListener('mouseenter', () => { c.focus(); });
        c.addEventListener('focus', () => { this.focused = true; });
        c.addEventListener('blur', () => { this.focused = false; this.keys = {}; });

        c.addEventListener('keydown', (e) => {
            if (!this.focused) return;
            this.keys[e.key.toLowerCase()] = true;
            if (['w','a','s','d','z','x','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        c.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    _initMinimap() {
        if (this.minimapEl) return;

        const clipId = `gs-minimap-clip-${Math.random().toString(36).slice(2, 10)}`;
        const wrap = document.createElement('div');
        wrap.className = 'gs-minimap';
        wrap.setAttribute('aria-hidden', 'true');

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${MINIMAP_SIZE} ${MINIMAP_SIZE}`);
        svg.setAttribute('class', 'gs-minimap__svg');

        const defs = document.createElementNS(SVG_NS, 'defs');
        const clipPath = document.createElementNS(SVG_NS, 'clipPath');
        clipPath.setAttribute('id', clipId);
        const clipCircle = document.createElementNS(SVG_NS, 'circle');
        clipCircle.setAttribute('cx', String(MINIMAP_SIZE / 2));
        clipCircle.setAttribute('cy', String(MINIMAP_SIZE / 2));
        clipCircle.setAttribute('r', String(MINIMAP_SIZE / 2 - 2));
        clipPath.appendChild(clipCircle);
        defs.appendChild(clipPath);
        svg.appendChild(defs);

        const meshGroup = document.createElementNS(SVG_NS, 'g');
        meshGroup.setAttribute('clip-path', `url(#${clipId})`);

        const meshPath = document.createElementNS(SVG_NS, 'path');
        meshPath.setAttribute('class', 'gs-minimap__mesh');
        meshGroup.appendChild(meshPath);

        const agentGroup = document.createElementNS(SVG_NS, 'g');
        agentGroup.setAttribute('class', 'gs-minimap__agent');

        const agentDot = document.createElementNS(SVG_NS, 'circle');
        agentDot.setAttribute('class', 'gs-minimap__agent-dot');
        agentDot.setAttribute('cx', '0');
        agentDot.setAttribute('cy', '0');
        agentDot.setAttribute('r', '2.6');

        const agentArrow = document.createElementNS(SVG_NS, 'path');
        agentArrow.setAttribute('class', 'gs-minimap__agent-arrow');
        agentArrow.setAttribute('d', 'M0 -8 L5 6 L0 3 L-5 6 Z');

        agentGroup.appendChild(agentDot);
        agentGroup.appendChild(agentArrow);
        meshGroup.appendChild(agentGroup);
        svg.appendChild(meshGroup);
        wrap.appendChild(svg);
        this.container.appendChild(wrap);

        this.minimapEl = wrap;
        this.minimapMeshPath = meshPath;
        this.minimapAgent = agentGroup;
    }

    _worldToMinimap(x, z) {
        if (!this.minimapBounds) return [MINIMAP_SIZE / 2, MINIMAP_SIZE / 2];

        const { bmin, bmax } = this.minimapBounds;
        const mapX = this.minimapPadding + (x - bmin[0]) * this.minimapScale;
        const mapY = this.minimapPadding + (z - bmin[2]) * this.minimapScale;
        return [mapX, mapY];
    }

    _buildMinimap() {
        if (!this.navmesh || !this.minimapMeshPath) return;

        const { vertices, triangles, params } = this.navmesh;
        const width = Math.max(params.bmax[0] - params.bmin[0], 1e-6);
        const depth = Math.max(params.bmax[2] - params.bmin[2], 1e-6);
        const innerSize = MINIMAP_SIZE - this.minimapPadding * 2;
        this.minimapScale = Math.min(innerSize / width, innerSize / depth);
        this.minimapBounds = { bmin: params.bmin, bmax: params.bmax };

        let path = '';
        for (const tri of triangles) {
            const [ax, ay] = this._worldToMinimap(vertices[tri[0]][0], vertices[tri[0]][2]);
            const [bx, by] = this._worldToMinimap(vertices[tri[1]][0], vertices[tri[1]][2]);
            const [cx, cy] = this._worldToMinimap(vertices[tri[2]][0], vertices[tri[2]][2]);
            path += `M ${ax.toFixed(2)} ${ay.toFixed(2)} L ${bx.toFixed(2)} ${by.toFixed(2)} L ${cx.toFixed(2)} ${cy.toFixed(2)} Z `;
        }

        this.minimapMeshPath.setAttribute('d', path.trim());
        this.minimapEl.classList.add('is-ready');
        this._updateMinimapAgent();
    }

    _updateMinimapAgent() {
        if (!this.minimapAgent || !this.minimapBounds) return;

        const [x, y] = this._worldToMinimap(this.camPos[0], this.camPos[2]);
        const headingX = -Math.sin(this.camYaw);
        const headingY = -Math.cos(this.camYaw);
        const angleDeg = Math.atan2(headingY, headingX) * 180 / Math.PI + 90;
        this.minimapAgent.setAttribute(
            'transform',
            `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angleDeg.toFixed(2)})`
        );
    }

    async init(splatUrl, navmeshUrl) {
        this._loading = false;
        this._animating = false;
        await this._loadSceneData(splatUrl, navmeshUrl);
        this._animate();
    }

    async loadScene(splatUrl, navmeshUrl) {
        if (this._loading) return;
        await this._loadSceneData(splatUrl, navmeshUrl);
    }

    async _loadSceneData(splatUrl, navmeshUrl) {
        this._loading = true;
        const loadingEl = this.container.querySelector('#gs-loading');
        const progressEl = this.container.querySelector('#gs-progress');
        const progressTextEl = this.container.querySelector('#gs-progress-text');

        if (loadingEl) loadingEl.style.display = 'flex';
        const setProgress = (p, text) => {
            if (progressEl) progressEl.style.width = `${(p * 100).toFixed(0)}%`;
            if (progressTextEl) progressTextEl.textContent = text || `${(p * 100).toFixed(0)}%`;
        };

        setProgress(0, 'Loading navmesh...');
        const navResp = await fetch(navmeshUrl);
        const navData = await navResp.json();
        this.navmesh = new NavMesh(navData);
        this._buildMinimap();

        setProgress(0.05, 'Loading gaussians...');
        const splatBuffer = await loadSplatFile(splatUrl, (p) => {
            setProgress(0.05 + p * 0.7, `Loading gaussians... ${(p * 100).toFixed(0)}%`);
        });

        setProgress(0.75, 'Processing gaussians...');
        await new Promise(r => setTimeout(r, 0));

        const splatData = processSplatData(splatBuffer);
        this.splatCount = splatData.count;
        this.posData = splatData.positions;

        setProgress(0.85, 'Initializing WebGL...');
        await new Promise(r => setTimeout(r, 0));

        this._uploadSceneGPU(splatData);
        this.camYaw = 0;
        this.camPitch = 0;
        this._initCamera();
        this._updateMinimapAgent();

        setProgress(1.0, 'Ready!');
        this._loading = false;
        setTimeout(() => {
            if (loadingEl) loadingEl.style.display = 'none';
            this.container.focus();
        }, 300);
    }

    _uploadSceneGPU(splatData) {
        if (!this.gl) {
            this._initGL(splatData);
            return;
        }
        const gl = this.gl;

        // Delete old textures
        if (this.posTex) gl.deleteTexture(this.posTex);
        if (this.covATex) gl.deleteTexture(this.covATex);
        if (this.covBTex) gl.deleteTexture(this.covBTex);
        if (this.colorTex) gl.deleteTexture(this.colorTex);

        const texW = 1024;
        const texH = Math.ceil(splatData.count / texW);
        this.texWidth = texW;

        gl.useProgram(this.program);
        gl.uniform1i(this.uniforms.texWidth, texW);

        const texSize = texW * texH * 4;
        const padPos = new Float32Array(texSize); padPos.set(splatData.positions);
        const padCovA = new Float32Array(texSize); padCovA.set(splatData.covA);
        const padCovB = new Float32Array(texSize); padCovB.set(splatData.covB);
        const padColor = new Float32Array(texSize); padColor.set(splatData.colors);

        this.posTex = createDataTexture(gl, padPos, texW, texH, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.covATex = createDataTexture(gl, padCovA, texW, texH, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.covBTex = createDataTexture(gl, padCovB, texW, texH, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.colorTex = createDataTexture(gl, padColor, texW, texH, gl.RGBA32F, gl.RGBA, gl.FLOAT);

        // Resize instanced index buffer
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sortedIdxBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, splatData.count * 4, gl.DYNAMIC_DRAW);
        gl.bindVertexArray(null);

        // Resize sort buffers
        this.sorter = new RadixSorter(splatData.count);
        this.depths = new Float32Array(splatData.count);
        this.sortedIndices = new Uint32Array(splatData.count);
    }

    _initGL(splatData) {
        const canvas = this.canvas;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = this.container.clientWidth * dpr;
        canvas.height = this.container.clientHeight * dpr;

        const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
        if (!gl) throw new Error('WebGL2 not supported');
        this.gl = gl;

        // Require float textures
        const extFloat = gl.getExtension('EXT_color_buffer_float');

        // Shader program
        this.program = createProgram(gl, VERT_SRC, FRAG_SRC);
        gl.useProgram(this.program);

        // Uniform locations
        this.uniforms = {
            proj: gl.getUniformLocation(this.program, 'u_proj'),
            view: gl.getUniformLocation(this.program, 'u_view'),
            viewport: gl.getUniformLocation(this.program, 'u_viewport'),
            posTex: gl.getUniformLocation(this.program, 'u_posTex'),
            covATex: gl.getUniformLocation(this.program, 'u_covATex'),
            covBTex: gl.getUniformLocation(this.program, 'u_covBTex'),
            colorTex: gl.getUniformLocation(this.program, 'u_colorTex'),
            texWidth: gl.getUniformLocation(this.program, 'u_texWidth'),
        };

        // Set texture units
        gl.uniform1i(this.uniforms.posTex, 0);
        gl.uniform1i(this.uniforms.covATex, 1);
        gl.uniform1i(this.uniforms.covBTex, 2);
        gl.uniform1i(this.uniforms.colorTex, 3);

        // Data textures
        const texW = 1024;
        const texH = Math.ceil(splatData.count / texW);
        this.texWidth = texW;
        gl.uniform1i(this.uniforms.texWidth, texW);

        // Pad data to fill full texture
        const texSize = texW * texH * 4;
        const padPos = new Float32Array(texSize);
        padPos.set(splatData.positions);
        const padCovA = new Float32Array(texSize);
        padCovA.set(splatData.covA);
        const padCovB = new Float32Array(texSize);
        padCovB.set(splatData.covB);
        const padColor = new Float32Array(texSize);
        padColor.set(splatData.colors);

        this.posTex = createDataTexture(gl, padPos, texW, texH, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.covATex = createDataTexture(gl, padCovA, texW, texH, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.covBTex = createDataTexture(gl, padCovB, texW, texH, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.colorTex = createDataTexture(gl, padColor, texW, texH, gl.RGBA32F, gl.RGBA, gl.FLOAT);

        // Quad geometry (VAO)
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const quadVerts = new Float32Array([
            -1, -1,  1, -1,  1, 1,  -1, 1
        ]);
        const quadIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

        const quadBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
        const aQuad = gl.getAttribLocation(this.program, 'a_quad');
        gl.enableVertexAttribArray(aQuad);
        gl.vertexAttribPointer(aQuad, 2, gl.FLOAT, false, 0, 0);

        const elemBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndices, gl.STATIC_DRAW);

        // Instanced index attribute
        this.sortedIdxBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sortedIdxBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, splatData.count * 4, gl.DYNAMIC_DRAW);
        const aIdx = gl.getAttribLocation(this.program, 'a_splatIdx');
        gl.enableVertexAttribArray(aIdx);
        gl.vertexAttribIPointer(aIdx, 1, gl.UNSIGNED_INT, 0, 0);
        gl.vertexAttribDivisor(aIdx, 1);

        gl.bindVertexArray(null);

        // Sorting infrastructure
        this.sorter = new RadixSorter(splatData.count);
        this.depths = new Float32Array(splatData.count);
        this.sortedIndices = new Uint32Array(splatData.count);

        // Render state
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.DEPTH_TEST);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        // Handle resize
        this._onResize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = this.container.clientWidth * dpr;
            canvas.height = this.container.clientHeight * dpr;
        };
        window.addEventListener('resize', this._onResize);
    }

    _initCamera() {
        if (this.navmesh) {
            const p = this.navmesh.params;
            const cx = (p.bmin[0] + p.bmax[0]) / 2;
            const cz = (p.bmin[2] + p.bmax[2]) / 2;
            this.camPos[0] = cx;
            this.camPos[2] = cz;
            this.camPos[1] = this.navmesh.groundY + this.eyeHeight;

            // Point towards the center of the scene if starting at edge
            if (!this.navmesh.isOnMesh(cx, cz)) {
                // Try finding a valid start position near center
                const step = 0.5;
                for (let dx = 0; dx < 5; dx += step) {
                    for (let dz = 0; dz < 5; dz += step) {
                        for (const sx of [1, -1]) {
                            for (const sz of [1, -1]) {
                                if (this.navmesh.isOnMesh(cx + dx * sx, cz + dz * sz)) {
                                    this.camPos[0] = cx + dx * sx;
                                    this.camPos[2] = cz + dz * sz;
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    _updateInput(dt) {
        if (!this.focused) return;

        const k = this.keys;
        const speed = this.moveSpeed * dt;
        const rspeed = this.rotSpeed * dt;

        // Rotation
        if (k['arrowleft'])  this.camYaw += rspeed;
        if (k['arrowright']) this.camYaw -= rspeed;
        if (k['arrowup'])    this.camPitch = Math.min(Math.PI / 9, this.camPitch + rspeed);
        if (k['arrowdown'])  this.camPitch = Math.max(-Math.PI / 8, this.camPitch - rspeed);

        // Movement direction on XZ plane
        const fwdX = -Math.sin(this.camYaw);
        const fwdZ = -Math.cos(this.camYaw);
        const rightX = Math.cos(this.camYaw);
        const rightZ = -Math.sin(this.camYaw);

        let dx = 0, dz = 0, dy = 0;
        if (k['w']) { dx += fwdX * speed; dz += fwdZ * speed; }
        if (k['s']) { dx -= fwdX * speed; dz -= fwdZ * speed; }
        if (k['a']) { dx -= rightX * speed; dz -= rightZ * speed; }
        if (k['d']) { dx += rightX * speed; dz += rightZ * speed; }
        if (k['z']) dy += speed;
        if (k['x']) dy -= speed;

        // Apply navmesh constraint for XZ
        if ((dx !== 0 || dz !== 0) && this.navmesh) {
            const newX = this.camPos[0] + dx;
            const newZ = this.camPos[2] + dz;
            const [cx, cz] = this.navmesh.constrainMove(
                this.camPos[0], this.camPos[2], newX, newZ
            );
            this.camPos[0] = cx;
            this.camPos[2] = cz;
        } else {
            this.camPos[0] += dx;
            this.camPos[2] += dz;
        }

        // Y movement (clamped)
        const minY = (this.navmesh ? this.navmesh.groundY : 0) + 0.3;
        const maxY = (this.navmesh ? this.navmesh.groundY : 0) + 3.0;
        this.camPos[1] = Math.max(minY, Math.min(maxY, this.camPos[1] + dy));
    }

    _sortSplats() {
        const count = this.splatCount;
        const pos = this.posData;

        // View direction from camera
        const cy = Math.cos(this.camYaw), sy = Math.sin(this.camYaw);
        const cp = Math.cos(this.camPitch), sp = Math.sin(this.camPitch);
        const vx = -sy * cp, vy = -sp, vz = -cy * cp;

        const cx = this.camPos[0], cY = this.camPos[1], cz = this.camPos[2];

        for (let i = 0; i < count; i++) {
            const px = pos[i * 4] - cx;
            const py = pos[i * 4 + 1] - cY;
            const pz = pos[i * 4 + 2] - cz;
            this.depths[i] = px * vx + py * vy + pz * vz;
        }

        const sorted = this.sorter.sort(this.depths, count);

        // Upload sorted indices
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sortedIdxBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, sorted.subarray(0, count));
    }

    _render() {
        const gl = this.gl;
        const w = this.canvas.width, h = this.canvas.height;

        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);

        // Matrices
        const proj = mat4Perspective(Math.PI / 3, w / h, 0.1, 200);
        const view = computeViewMatrix(this.camPos, this.camYaw, this.camPitch);

        gl.uniformMatrix4fv(this.uniforms.proj, false, proj);
        gl.uniformMatrix4fv(this.uniforms.view, false, view);
        gl.uniform2f(this.uniforms.viewport, w, h);

        // Bind textures
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.posTex);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.covATex);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.covBTex);
        gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.colorTex);

        // Draw instanced
        gl.bindVertexArray(this.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, this.splatCount);
        gl.bindVertexArray(null);
    }

    _animate() {
        let lastTime = performance.now();
        this.lastFpsTime = lastTime;
        this._visible = true;
        this._rafId = 0;

        const fpsEl = this.container.querySelector('#gs-fps');

        const loop = () => {
            if (!this._visible) {
                this._rafId = 0;
                return;
            }

            const now = performance.now();
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            this._updateInput(dt);
            this._updateMinimapAgent();
            this._sortSplats();
            this._render();

            this.frameCount++;
            if (now - this.lastFpsTime >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastFpsTime = now;
                if (fpsEl) fpsEl.textContent = `FPS: ${this.fps}`;
            }

            this._rafId = requestAnimationFrame(loop);
        };

        const visObs = new IntersectionObserver((entries) => {
            const wasVisible = this._visible;
            this._visible = entries[0].isIntersecting;
            if (this._visible && !wasVisible) {
                lastTime = performance.now();
                this.keys = {};
                this._rafId = requestAnimationFrame(loop);
            }
        }, { threshold: 0 });
        visObs.observe(this.container);

        this._rafId = requestAnimationFrame(loop);
    }
}
