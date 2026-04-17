/* ---------- Virus Bus — Vortex shader (vanilla WebGL, no CDN) ---------- */
(function () {
  const canvas = document.getElementById('vortex-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
  if (!gl) {
    console.warn('WebGL unavailable, vortex disabled.');
    return;
  }

  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  const vsrc = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  // ---------- "Star Nest" volumetric space tunnel ----------
  // Original shader by Pablo Roman Andrioli (CC-BY-NC-SA). Ported and
  // re-tinted for Virus Bus' deep-blue portal aesthetic.
  const fsrc = `
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    varying vec2 vUv;

    #define ITER 15
    #define VOLSTEPS 18
    #define FORMU 0.53
    #define STEPSZ 0.1
    #define ZOOM 0.80
    #define TILE 0.85
    #define SPEED 0.012
    #define BRIGHT 0.0018
    #define DARK 0.30
    #define FADE 0.73
    #define SAT 0.85

    void main() {
      vec2 uv = vUv - 0.5;
      uv.x *= uResolution.x / uResolution.y;

      vec3 dir = vec3(uv * ZOOM, 1.0);
      float t = uTime * SPEED + 0.25;

      // Gentle rotation driven by mouse
      float a1 = 0.5 + uMouse.x * 0.6;
      float a2 = 0.8 + uMouse.y * 0.6;
      mat2 rot1 = mat2(cos(a1), sin(a1), -sin(a1), cos(a1));
      mat2 rot2 = mat2(cos(a2), sin(a2), -sin(a2), cos(a2));
      dir.xz *= rot1;
      dir.xy *= rot2;

      vec3 from = vec3(1.0, 0.5, 0.5);
      from += vec3(t * 2.0, t, -2.0);
      from.xz *= rot1;
      from.xy *= rot2;

      // Volumetric integration through a Kaleidoscopic IFS
      float s = 0.1;
      float fade = 1.0;
      vec3 v = vec3(0.0);
      for (int r = 0; r < VOLSTEPS; r++) {
        vec3 p = from + s * dir * 0.5;
        p = abs(vec3(TILE) - mod(p, vec3(TILE * 2.0)));
        float pa = 0.0, a = 0.0;
        for (int i = 0; i < ITER; i++) {
          p = abs(p) / dot(p, p) - FORMU;
          a += abs(length(p) - pa);
          pa = length(p);
        }
        float dm = max(0.0, DARK - a * a * 0.001);
        a *= a * a;
        if (r > 6) fade *= 1.0 - dm;
        v += fade;
        v += vec3(s * s * s * s, s * s, s) * a * BRIGHT * fade;
        fade *= FADE;
        s += STEPSZ;
      }

      // Desaturate slightly
      v = mix(vec3(length(v)), v, SAT);

      // Rebalance to blue/cyan palette (Virus Bus)
      vec3 col = v * 0.01;
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      vec3 deep = vec3(0.08, 0.30, 0.72);
      vec3 cyan = vec3(0.42, 0.80, 1.00);
      vec3 warm = vec3(0.85, 0.93, 1.00);
      vec3 tinted = mix(deep, cyan, smoothstep(0.15, 0.55, lum));
      tinted = mix(tinted, warm, smoothstep(0.55, 0.95, lum));
      col = tinted * lum * 1.2;

      // Gentle vignette
      float vign = smoothstep(1.2, 0.25, length(uv));
      col *= 0.4 + 0.6 * vign;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vsrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsrc);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  // Fullscreen triangle (covers viewport, one triangle is enough)
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPosition');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uRes = gl.getUniformLocation(prog, 'uResolution');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');

  let targetMx = 0, targetMy = 0, mx = 0, my = 0;
  window.addEventListener('mousemove', (e) => {
    targetMx = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMy = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const w = window.innerWidth * DPR;
    const h = window.innerHeight * DPR;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  const start = performance.now();
  function tick() {
    const t = (performance.now() - start) * 0.001;
    gl.uniform1f(uTime, t);
    mx += (targetMx - mx) * 0.06;
    my += (targetMy - my) * 0.06;
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(tick);
  }
  tick();
})();
