/* ---------- Virus Bus — three.js volumetric vortex with bloom postprocessing ---------- */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('vortex-canvas');
if (canvas) {
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  // ---------- Renderer ----------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(DPR);
  renderer.setSize(W(), H(), false);
  renderer.setClearColor(0x050810, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // ---------- Scene + camera ----------
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050810, 0.012);

  const camera = new THREE.PerspectiveCamera(72, W() / H(), 0.1, 400);
  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -1);

  // ---------- Particle tunnel ----------
  // Thousands of glowing dots distributed in a long forward-moving cylinder.
  // When a particle crosses the camera, it recycles far ahead, giving infinite warp.
  const COUNT = 4200;
  const TUNNEL_LENGTH = 280;
  const TUNNEL_RADIUS_MIN = 3;
  const TUNNEL_RADIUS_MAX = 42;

  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const seeds = new Float32Array(COUNT);

  const deepBlue  = new THREE.Color(0x1d5ea8);
  const vortex    = new THREE.Color(0x4FA8FF);
  const cyanGlow  = new THREE.Color(0x7fd9ff);
  const white     = new THREE.Color(0xe0f2ff);

  function hexa(theta) {
    // Bias angular distribution toward a soft spiral pattern (visual richness)
    return theta + 0.8 * Math.sin(theta * 3);
  }

  for (let i = 0; i < COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const tBent = hexa(theta);
    // Radial distribution: more dots near center (forms a "core")
    const rRand = Math.pow(Math.random(), 1.8);
    const radius = TUNNEL_RADIUS_MIN + rRand * (TUNNEL_RADIUS_MAX - TUNNEL_RADIUS_MIN);
    const z = -Math.random() * TUNNEL_LENGTH;
    const x = Math.cos(tBent) * radius;
    const y = Math.sin(tBent) * radius;
    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Color: deeper blue on outer ring, cyan/white near the axis.
    const rNorm = (radius - TUNNEL_RADIUS_MIN) / (TUNNEL_RADIUS_MAX - TUNNEL_RADIUS_MIN);
    const c = new THREE.Color();
    if (rNorm < 0.3) {
      c.lerpColors(white, cyanGlow, rNorm / 0.3);
    } else if (rNorm < 0.65) {
      c.lerpColors(cyanGlow, vortex, (rNorm - 0.3) / 0.35);
    } else {
      c.lerpColors(vortex, deepBlue, (rNorm - 0.65) / 0.35);
    }
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    // Size: core particles larger, periphery smaller
    sizes[i] = (1.6 - rNorm * 1.1) * (0.7 + Math.random() * 0.8);
    seeds[i] = Math.random() * 10;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  // ---------- Custom shader for soft glowing particles ----------
  const particleMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:  { value: 0 },
      uPixel: { value: DPR },
      uScreenH: { value: H() },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aSeed;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform float uPixel;
      uniform float uScreenH;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float dist = -mv.z;
        // Fade in from far, fade out at camera plane
        vAlpha = smoothstep(280.0, 80.0, dist) * smoothstep(0.5, 8.0, dist);
        float flicker = 0.85 + 0.15 * sin(uTime * 2.5 + aSeed * 7.0);
        vAlpha *= flicker;
        float size = aSize * uScreenH * 0.012 / dist * uPixel;
        gl_PointSize = max(size, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p);
        if (d > 0.5) discard;
        // Soft radial glow with a bright core
        float core = smoothstep(0.5, 0.0, d);
        float glow = pow(core, 2.4);
        vec3 col = vColor * (0.5 + glow * 1.5);
        gl_FragColor = vec4(col, glow * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  const points = new THREE.Points(geometry, particleMat);
  scene.add(points);

  // ---------- Axial beam (core light tube through the tunnel) ----------
  const beamGeom = new THREE.CylinderGeometry(0.25, 0.8, TUNNEL_LENGTH, 16, 1, true);
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float t = fract(vUv.y * 4.0 - uTime * 0.4);
        float bright = smoothstep(0.0, 1.0, t) * smoothstep(1.0, 0.0, t) * 4.0;
        vec3 col = vec3(0.25, 0.6, 1.0) * bright;
        float fade = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
        gl_FragColor = vec4(col * fade, 0.25 * fade);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beam = new THREE.Mesh(beamGeom, beamMat);
  beam.rotation.x = Math.PI / 2;
  beam.position.z = -TUNNEL_LENGTH / 2;
  scene.add(beam);

  // ---------- Post-processing: bloom ----------
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(W(), H());
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(W(), H()),
    0.95,   // strength
    0.8,    // radius
    0.12    // threshold
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // ---------- Mouse-driven camera orbit ----------
  let targetMx = 0, targetMy = 0, mx = 0, my = 0;
  window.addEventListener('pointermove', (e) => {
    targetMx = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMy = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ---------- Resize ----------
  function onResize() {
    const w = W(), h = H();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloomPass.setSize(w, h);
    particleMat.uniforms.uScreenH.value = h;
  }
  window.addEventListener('resize', onResize);

  // ---------- Animation loop ----------
  const SPEED = 12;  // world units per second
  const clock = new THREE.Clock();

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    // Advance all particles forward; recycle when past camera
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const zIdx = i * 3 + 2;
      pos[zIdx] += SPEED * dt;
      if (pos[zIdx] > 2) {
        // Recycle at far end with fresh angular position
        const theta = Math.random() * Math.PI * 2;
        const tBent = theta + 0.8 * Math.sin(theta * 3);
        const rRand = Math.pow(Math.random(), 1.8);
        const radius = TUNNEL_RADIUS_MIN + rRand * (TUNNEL_RADIUS_MAX - TUNNEL_RADIUS_MIN);
        pos[i * 3 + 0] = Math.cos(tBent) * radius;
        pos[i * 3 + 1] = Math.sin(tBent) * radius;
        pos[zIdx] = -TUNNEL_LENGTH + (Math.random() - 0.5) * 8;
      }
    }
    geometry.attributes.position.needsUpdate = true;

    // Gentle mouse-follow camera rotation
    mx += (targetMx - mx) * 0.04;
    my += (targetMy - my) * 0.04;
    camera.rotation.y = mx * 0.18;
    camera.rotation.x = my * 0.12;

    // Slow dolly oscillation for subtle breathing
    camera.position.z = Math.sin(t * 0.12) * 0.6;

    particleMat.uniforms.uTime.value = t;
    beamMat.uniforms.uTime.value = t;

    composer.render();
    requestAnimationFrame(tick);
  }
  tick();
}
