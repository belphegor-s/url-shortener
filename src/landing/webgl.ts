/** Hero background: slowly drifting topographic contour lines, drawn on a WebGL
 *  canvas behind the hero copy.
 *
 *  The field comes from `webgl-noise` — 3D simplex noise by Ian McEwan and Stefan
 *  Gustavson (Ashima Arts), MIT licensed, vendored below with its notice intact:
 *  https://github.com/ashima/webgl-noise. The contouring and the rest of the sketch
 *  are this project's own.
 *
 *  It is decorative and defensive: no WebGL, a lost context or a failed compile all
 *  leave an empty transparent canvas and the page reads exactly as it does without
 *  it. It honours `prefers-reduced-motion` by painting a single frame, and stops
 *  animating whenever it scrolls out of view or the tab is hidden. */

export const CREDIT = 'Contour field built on webgl-noise — simplex noise by Ian McEwan & Stefan Gustavson (Ashima Arts), MIT licensed';

export const NOISE_REPO = 'https://github.com/ashima/webgl-noise';

export const webglScript = String.raw`
(function () {
  var VERT = [
    'attribute vec2 aPos;',
    'void main() { gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    '#extension GL_OES_standard_derivatives : enable',
    'precision highp float;',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform vec3 uLine;',
    'uniform float uAlpha;',

    // --- webgl-noise (MIT) -------------------------------------------------
    // Description : Array and textureless GLSL 2D/3D/4D simplex noise functions.
    //      Author : Ian McEwan, Ashima Arts.
    //  Maintainer : stegu
    //     Lastmod : 20110822 (ijm)
    //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
    //               Distributed under the MIT License. See LICENSE file.
    //               https://github.com/ashima/webgl-noise
    'vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }',
    'vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }',
    'float snoise(vec3 v) {',
    '  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);',
    '  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);',
    '  vec3 i  = floor(v + dot(v, C.yyy));',
    '  vec3 x0 = v - i + dot(i, C.xxx);',
    '  vec3 g = step(x0.yzx, x0.xyz);',
    '  vec3 l = 1.0 - g;',
    '  vec3 i1 = min(g.xyz, l.zxy);',
    '  vec3 i2 = max(g.xyz, l.zxy);',
    '  vec3 x1 = x0 - i1 + C.xxx;',
    '  vec3 x2 = x0 - i2 + C.yyy;',
    '  vec3 x3 = x0 - D.yyy;',
    '  i = mod289(i);',
    '  vec4 p = permute(permute(permute(',
    '             i.z + vec4(0.0, i1.z, i2.z, 1.0))',
    '           + i.y + vec4(0.0, i1.y, i2.y, 1.0))',
    '           + i.x + vec4(0.0, i1.x, i2.x, 1.0));',
    '  float n_ = 0.142857142857;',
    '  vec3 ns = n_ * D.wyz - D.xzx;',
    '  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);',
    '  vec4 x_ = floor(j * ns.z);',
    '  vec4 y_ = floor(j - 7.0 * x_);',
    '  vec4 x = x_ * ns.x + ns.yyyy;',
    '  vec4 y = y_ * ns.x + ns.yyyy;',
    '  vec4 h = 1.0 - abs(x) - abs(y);',
    '  vec4 b0 = vec4(x.xy, y.xy);',
    '  vec4 b1 = vec4(x.zw, y.zw);',
    '  vec4 s0 = floor(b0) * 2.0 + 1.0;',
    '  vec4 s1 = floor(b1) * 2.0 + 1.0;',
    '  vec4 sh = -step(h, vec4(0.0));',
    '  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;',
    '  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;',
    '  vec3 p0 = vec3(a0.xy, h.x);',
    '  vec3 p1 = vec3(a0.zw, h.y);',
    '  vec3 p2 = vec3(a1.xy, h.z);',
    '  vec3 p3 = vec3(a1.zw, h.w);',
    '  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));',
    '  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;',
    '  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);',
    '  m = m * m;',
    '  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));',
    '}',
    // --- end webgl-noise ---------------------------------------------------

    'void main() {',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;',
    '  float t = uTime * 0.045;',
    // Three octaves: a broad shape, a mid ripple, and a fine grain.
    '  float f  = snoise(vec3(uv * 1.5, t));',
    '  f += 0.5  * snoise(vec3(uv * 3.1 + 4.0, t * 1.3));',
    '  f += 0.25 * snoise(vec3(uv * 6.3 - 2.0, t * 1.7));',
    '  f /= 1.75;',
    // Contours: distance to the nearest iso-line, divided by the local gradient so
    // every line keeps the same on-screen width however steep the field is.
    '  float v = f * 9.0;',
    '  float w = fract(v) - 0.5;',
    '#ifdef GL_OES_standard_derivatives',
    '  float grad = max(fwidth(v), 1e-4);',
    '#else',
    '  float grad = 0.02 * uRes.y / 600.0;',
    '#endif',
    '  float line = 1.0 - smoothstep(0.0, 1.15, abs(w) / grad);',
    // Pool the contours to the right of centre, clear of the hero copy, and
    // dissolve them into the page toward the edges.
    '  vec2 c = (uv - vec2(0.34, 0.02)) * vec2(0.72, 1.0);',
    '  float fade = smoothstep(0.95, 0.05, length(c));',
    // Premultiplied output, to match the canvas's premultipliedAlpha context and
    // the ONE / ONE_MINUS_SRC_ALPHA blend below. Emitting straight colour here
    // would make the browser scale it by alpha a second time, which washes the
    // light-on-dark theme out to almost nothing.
    '  float a = line * fade * uAlpha;',
    '  gl_FragColor = vec4(uLine * a, a);',
    '}'
  ].join('\n');

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  /** '#09090b' -> [0.035, 0.035, 0.043]; null when it cannot be parsed. */
  function rgb(value) {
    var hex = (value || '').trim();
    if (hex.charAt(0) !== '#') return null;
    if (hex.length === 4) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    if (hex.length !== 7) return null;
    var n = parseInt(hex.slice(1), 16);
    if (isNaN(n)) return null;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function start(canvas) {
    var gl = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: true });
    } catch (e) {}
    if (!gl) return;

    gl.getExtension('OES_standard_derivatives');

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // One triangle large enough to cover the clip volume; cheaper than a quad.
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(program, 'uRes');
    var uTime = gl.getUniformLocation(program, 'uTime');
    var uLine = gl.getUniformLocation(program, 'uLine');
    var uAlpha = gl.getUniformLocation(program, 'uAlpha');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    var root = document.documentElement;
    function applyTheme() {
      var styles = getComputedStyle(root);
      var line = rgb(styles.getPropertyValue('--foreground')) || [0.04, 0.04, 0.05];
      gl.uniform3f(uLine, line[0], line[1], line[2]);
      // The dark theme needs a touch more to read against near-black.
      gl.uniform1f(uAlpha, root.getAttribute('data-theme') === 'dark' ? 0.18 : 0.2);
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }

    function draw(seconds) {
      resize();
      gl.uniform1f(uTime, seconds);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    applyTheme();

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // One frame at a pleasant point in the loop, then nothing moves.
      draw(12);
      new MutationObserver(function () { applyTheme(); draw(12); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
      window.addEventListener('resize', function () { draw(12); }, { passive: true });
      return;
    }

    var running = true;
    var visible = true;
    var frame = 0;
    var startedAt = performance.now();

    function loop(now) {
      frame = 0;
      if (!running || !visible) return;
      draw((now - startedAt) / 1000);
      frame = requestAnimationFrame(loop);
    }
    function play() {
      if (!frame && running && visible) frame = requestAnimationFrame(loop);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) play();
      }, { threshold: 0 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) play();
    });
    new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    // A lost context (GPU reset, tab backgrounded for a long time) must not throw.
    canvas.addEventListener('webglcontextlost', function (event) {
      event.preventDefault();
      running = false;
      frame = 0;
    });

    play();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var canvas = document.getElementById('hero-gl');
    if (canvas) start(canvas);
  });
})();
`;
