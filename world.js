/* A small, dependency-free landscape. The portfolio owns the camera's scroll position. */
(() => {
  'use strict';

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;
    varying vec2 v_uv;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform float u_progress;
    uniform float u_time;
    uniform float u_detail;

    #define PI 3.14159265359

    mat2 rotate2(float a) {
      float c = cos(a), s = sin(a);
      return mat2(c, -s, s, c);
    }

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
                 mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x), f.y);
    }

    float fbm(vec2 p) {
      float f = 0.53 * noise(p);
      p = rotate2(0.61) * p * 2.12;
      f += 0.26 * noise(p);
      p = rotate2(0.61) * p * 2.12;
      f += 0.13 * noise(p);
      return f;
    }

    float box(vec3 p, vec3 b) {
      vec3 q = abs(p) - b;
      return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
    }

    float capsule(vec3 p, vec3 a, vec3 b, float r) {
      vec3 pa = p - a, ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * h) - r;
    }

    // Five chapters share the same space, so the camera never has to cut.
    vec4 weights() {
      float w = smoothstep(0.28, 0.43, u_progress) * (1.0 - smoothstep(0.48, 0.58, u_progress));
      float g = smoothstep(0.48, 0.61, u_progress) * (1.0 - smoothstep(0.67, 0.77, u_progress));
      float p = smoothstep(0.67, 0.79, u_progress) * (1.0 - smoothstep(0.89, 0.98, u_progress));
      float r = smoothstep(0.08, 0.18, u_progress) * (1.0 - smoothstep(0.27, 0.39, u_progress));
      return vec4(r, w, g, p);
    }

    vec3 accent() {
      vec4 w = weights();
      vec3 color = vec3(1.0, 0.38, 0.13);
      color = mix(color, vec3(0.73, 0.88, 0.36), w.x * 0.92);
      color = mix(color, vec3(0.88, 0.68, 0.41), w.y * 0.7);
      color = mix(color, vec3(0.56, 0.44, 0.97), w.z * 0.72);
      color = mix(color, vec3(0.94, 0.56, 0.25), w.w * 0.7);
      return color;
    }

    vec2 sculpture(vec3 p) {
      vec4 w = weights();
      vec3 q = p - vec3(1.7, 1.88, -0.4);
      q.xz = rotate2(-0.31 + u_progress * 0.38) * q.xz;
      q.yz = rotate2(0.16 + 0.06 * sin(u_progress * PI * 2.0)) * q.yz;
      float a = atan(q.y, q.x);
      float organic = sin(a * 3.0 + 0.4) * w.x * 0.12;
      float radius = 1.48 + organic;
      float ring = length(vec2(length(q.xy) - radius, q.z)) - (0.235 + organic * 0.2);
      // A second, very fine inner lip catches light along the opening.
      float inner = length(vec2(length(q.xy) - radius + 0.025, q.z + 0.055)) - 0.185;
      ring = min(ring, inner);

      vec3 slabPoint = q;
      slabPoint.xz = rotate2(0.15) * slabPoint.xz;
      float monolith = box(slabPoint, vec3(0.72, 1.65, 0.18)) - 0.06;
      float d = mix(ring, monolith, w.y);
      float material = 1.0;

      // The orbit opens into a small evidence constellation.
      if (w.z > 0.001) {
        float graph = 100.0;
        vec3 previous = vec3(0.0);
        for (int i = 0; i < 7; i++) {
          float fi = float(i);
          float angle = fi * 2.39996;
          vec3 node = vec3(cos(angle) * (0.55 + fi * 0.15), sin(angle) * (0.55 + fi * 0.15), sin(fi * 1.9) * 0.55);
          float sphere = length(q - node) - (0.12 + 0.055 * sin(fi * 3.4 + 1.0));
          graph = min(graph, sphere);
          if (i > 0) graph = min(graph, capsule(q, previous, node, 0.012));
          previous = node;
        }
        d = mix(d, graph, w.z);
      }

      if (w.w > 0.001) {
        float structure = 100.0;
        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          vec3 blockP = q - vec3(sin(fi * 1.7) * 0.24, -1.25 + fi * 0.61, 0.0);
          blockP.xz = rotate2((fi - 2.0) * 0.18) * blockP.xz;
          structure = min(structure, box(blockP, vec3(0.91 - fi * 0.075, 0.19, 0.4)) - 0.04);
        }
        d = mix(d, structure, w.w);
      }

      // A detached satellite balances the large sculpture without clutter.
      vec3 orbP = p - vec3(-0.55, 0.59 + sin(u_time * 0.25) * 0.035, 0.8);
      float orb = length(orbP) - 0.26;
      if (orb < d) { d = orb; material = 2.0; }
      return vec2(d, material);
    }

    vec3 objectNormal(vec3 p) {
      vec2 e = vec2(0.0015, 0.0);
      float d = sculpture(p).x;
      return normalize(vec3(d - sculpture(p - e.xyy).x, d - sculpture(p - e.yxy).x, d - sculpture(p - e.yyx).x));
    }

    vec3 sky(vec3 rd) {
      vec4 w = weights();
      vec3 top = vec3(0.022, 0.033, 0.045);
      vec3 horizon = vec3(0.55, 0.285, 0.14);
      horizon = mix(horizon, vec3(0.35, 0.39, 0.23), w.x * 0.75);
      horizon = mix(horizon, vec3(0.22, 0.16, 0.30), w.z);
      float h = pow(clamp(1.0 - max(rd.y, 0.0), 0.0, 1.0), 4.2);
      vec3 color = mix(top, horizon, h);
      vec3 sunDirection = normalize(vec3(-0.3, 0.16, -1.0));
      float sunDot = max(dot(rd, sunDirection), 0.0);
      color += accent() * pow(sunDot, 18.0) * 0.27;
      color += vec3(1.0, 0.72, 0.41) * pow(sunDot, 640.0) * 0.52;
      color += accent() * exp(-abs(rd.y - 0.015) * 35.0) * 0.075;
      // Fine, broad clouds carry the warm horizon into the dark upper field.
      float cloud = fbm(rd.xz * 3.4 / max(rd.y + 0.5, 0.15) + vec2(u_time * 0.003, 0.0));
      color += vec3(0.07, 0.06, 0.05) * cloud * smoothstep(0.0, 0.55, rd.y);
      return color;
    }

    vec2 marchObject(vec3 ro, vec3 rd, float maxDistance, int quality) {
      // Most sky rays miss this bound and never enter the SDF loop.
      vec3 boundOrigin = ro - vec3(1.05, 1.8, -0.2);
      float b = dot(boundOrigin, rd);
      float c = dot(boundOrigin, boundOrigin) - 8.41;
      float discriminant = b * b - c;
      if (discriminant < 0.0) return vec2(-1.0);
      float t = max(0.0, -b - sqrt(discriminant));
      float boundEnd = min(maxDistance, -b + sqrt(discriminant));
      float material = 0.0;
      for (int i = 0; i < 76; i++) {
        if (i >= quality) break;
        vec2 hit = sculpture(ro + rd * t);
        if (hit.x < 0.0017 * max(1.0, t * 0.15)) return vec2(t, hit.y);
        t += hit.x * 0.83;
        if (t > boundEnd) break;
      }
      return vec2(-1.0, material);
    }

    vec3 metal(vec3 p, vec3 rd, float material) {
      vec3 n = objectNormal(p);
      vec3 reflection = reflect(rd, n);
      float fresnel = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);
      vec3 light = normalize(vec3(-0.65, 0.8, 0.65));
      float diff = max(dot(n, light), 0.0);
      vec3 base = vec3(0.27, 0.29, 0.29);
      vec3 reflected = sky(reflection) * 1.6;
      // High-contrast strip reflections read as polished metal even at small sizes.
      float ribbon = pow(max(0.0, dot(reflection, normalize(vec3(-0.7, 0.7, 0.3)))), 19.0);
      float silverBand = smoothstep(0.08, 0.19, reflection.y) * (1.0 - smoothstep(0.42, 0.56, reflection.y));
      silverBand *= smoothstep(-0.5, 0.45, reflection.z);
      float edgeStrip = pow(max(0.0, dot(reflection, normalize(vec3(0.65, 0.32, 0.8)))), 48.0);
      float warmRibbon = pow(max(0.0, dot(reflection, normalize(vec3(-0.4, 0.15, -1.0)))), 24.0);
      vec3 color = base * (0.07 + diff * 0.22) + reflected * 0.52;
      color += vec3(0.96, 1.0, 1.02) * (ribbon * 2.8 + silverBand * 0.95 + edgeStrip * 1.7);
      color += accent() * warmRibbon * 1.35;
      color += vec3(0.42, 0.46, 0.48) * fresnel * 0.23;
      // The inner edge holds the warm light while the outer surface stays silver.
      vec3 local = p - vec3(1.7, 1.88, -0.4);
      float inward = max(dot(n.xy, -normalize(local.xy)), 0.0);
      color += accent() * pow(inward, 7.0) * (0.92 + weights().x * 0.3);
      if (material > 1.5) color = mix(color, accent() * (0.16 + diff * 0.75) + reflected * 0.3, 0.7);
      float ao = clamp(sculpture(p + n * 0.12).x / 0.12, 0.35, 1.0);
      return color * ao;
    }

    vec3 landscape(vec3 ro, vec3 rd, out float groundDistance) {
      vec3 color = sky(rd);
      groundDistance = 100.0;

      // Distant silhouettes use world-space samples, retaining true camera parallax.
      if (rd.y < 0.14) {
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float depth = 56.0 - fi * 16.0;
          float t = (-depth - ro.z) / rd.z;
          vec3 mountainP = ro + rd * t;
          float ridge = fbm(vec2(mountainP.x * (0.11 + fi * 0.025), fi * 7.1)) * (8.6 - fi * 0.45) - 0.75;
          if (mountainP.y < ridge && t > 0.0) {
            vec3 mountainColor = mix(vec3(0.12, 0.13, 0.13), vec3(0.065, 0.073, 0.075), fi * 0.4);
            mountainColor = mix(mountainColor, sky(vec3(rd.x, 0.0, rd.z)), 0.55 - fi * 0.18);
            color = mountainColor;
          }
        }
      }

      if (rd.y < -0.002) {
        float t = -ro.y / rd.y;
        groundDistance = t;
        vec3 p = ro + rd * t;
        float ripples = sin(p.z * 13.0 + sin(p.x * 5.0) + u_time * 0.45) * 0.005;
        vec3 n = normalize(vec3(sin(p.x * 2.0 + u_time * 0.17) * 0.012, 1.0, ripples));
        vec3 reflectedRay = reflect(rd, n);
        vec3 reflection = sky(reflectedRay);
        float fresnel = pow(1.0 - max(dot(-rd, n), 0.0), 4.0);
        float sand = fbm(p.xz * 0.2);
        vec3 floorColor = mix(vec3(0.13, 0.12, 0.10), vec3(0.27, 0.22, 0.17), sand);
        float water = smoothstep(-0.75, 0.25, p.x - sin(p.z * 0.09) * 2.5);
        color = mix(floorColor, reflection * 0.76 + vec3(0.015), water * (0.4 + fresnel * 0.6));

        // The sculpture has a real perspective reflection in the dark liquid.
        if (water > 0.45 && t < 28.0) {
          vec2 mirrorHit = marchObject(p + n * 0.025, reflectedRay, 18.0, 38);
          if (mirrorHit.x > 0.0) {
            vec3 mirrorP = p + n * 0.025 + reflectedRay * mirrorHit.x;
            vec3 reflectedObject = metal(mirrorP, reflectedRay, mirrorHit.y);
            color = mix(color, reflectedObject, water * (0.27 + fresnel * 0.42));
          }
        }
        // Broad contact darkness grounds the hovering structure.
        float shadow = exp(-length((p.xz - vec2(1.7, -0.4)) / vec2(1.8, 1.05)) * 1.8);
        color *= 1.0 - shadow * 0.52;
        float groundFog = 1.0 - exp(-t * 0.025);
        color = mix(color, sky(vec3(rd.x, 0.0, rd.z)), groundFog * 0.64);
      }
      return color;
    }

    void main() {
      vec2 uv = (v_uv * u_resolution - 0.5 * u_resolution) / u_resolution.y;
      float aspect = u_resolution.x / u_resolution.y;
      float mobile = 1.0 - smoothstep(0.65, 1.1, aspect);
      float progress = u_progress;
      vec3 ro = vec3(-0.1 + u_pointer.x * 0.13 + sin(progress * PI) * 0.45,
                     1.62 + u_pointer.y * 0.07 + sin(progress * PI * 2.0) * 0.18,
                     7.8 - progress * 2.8 + mobile * (9.5 - progress * 1.6));
      vec3 target = vec3(mix(0.2, 0.65, mobile), 1.47, -0.4);
      vec3 forward = normalize(target - ro);
      vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
      vec3 up = cross(right, forward);
      vec3 rd = normalize(forward * 1.65 + right * uv.x + up * uv.y);

      float groundDistance;
      vec3 color = landscape(ro, rd, groundDistance);
      vec2 hit = marchObject(ro, rd, min(groundDistance, 35.0), 76);
      if (hit.x > 0.0) {
        vec3 p = ro + rd * hit.x;
        vec3 shaded = metal(p, rd, hit.y);
        color = mix(shaded, sky(vec3(rd.x, 0.0, rd.z)), 1.0 - exp(-hit.x * 0.018));
      }

      // A gentle radial falloff and subtle film grain keep the landscape photographic.
      float vignette = 1.0 - dot(uv * vec2(0.42, 0.6), uv * vec2(0.42, 0.6));
      color *= clamp(vignette, 0.55, 1.0);
      color = color / (color + 0.74);
      color = pow(max(color, 0.0), vec3(0.84));
      float grain = hash21(gl_FragCoord.xy + 0.5) - 0.5;
      color += grain * 0.013;
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `;

  let gl = null;
  let canvas = null;
  let program = null;
  let buffer = null;
  let uniforms = null;
  let frameId = 0;
  let resizeObserver = null;
  let initialized = false;
  let contextLost = false;
  let userPaused = false;
  let targetProgress = 0;
  let currentProgress = 0;
  let targetPointer = [0, 0];
  let currentPointer = [0, 0];
  let lastFrame = 0;
  let animationUntil = 0;
  let elapsed = 0;
  let needsResize = true;
  let reduceMotion = false;
  let motionQuery = null;
  const mobileDevice = () => window.matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(log || 'Landscape shader could not compile.');
    }
    return shader;
  }

  function resize() {
    if (!canvas || !gl) return;
    const rect = canvas.getBoundingClientRect();
    const mobile = mobileDevice();
    // Raymarch at a deliberate photographic resolution, then let the canvas upscale.
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    const maxPixels = mobile ? 330000 : 680000;
    const scale = Math.min(pixelRatio, Math.sqrt(maxPixels / Math.max(rect.width * rect.height, 1)));
    const width = Math.max(1, Math.round(rect.width * scale));
    const height = Math.max(1, Math.round(rect.height * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    needsResize = false;
  }

  function requestRender(duration = 700) {
    if (!initialized || contextLost || document.hidden) return;
    animationUntil = Math.max(animationUntil, performance.now() + duration);
    if (!frameId) frameId = requestAnimationFrame(render);
  }

  function render(now) {
    frameId = 0;
    if (!initialized || contextLost || document.hidden) return;
    const paused = userPaused || reduceMotion;
    const interval = mobileDevice() ? 1000 / 24 : 1000 / 30;
    if (!paused && now - lastFrame < interval - 1) {
      frameId = requestAnimationFrame(render);
      return;
    }
    const delta = Math.min((now - lastFrame) / 1000 || 0.016, 0.06);
    lastFrame = now;
    if (!paused) elapsed += delta;
    const ease = paused ? 1 : 1 - Math.exp(-delta * 9);
    currentProgress += (targetProgress - currentProgress) * ease;
    currentPointer[0] += (targetPointer[0] - currentPointer[0]) * ease;
    currentPointer[1] += (targetPointer[1] - currentPointer[1]) * ease;
    if (needsResize) resize();
    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.pointer, currentPointer[0], currentPointer[1]);
    gl.uniform1f(uniforms.progress, currentProgress);
    gl.uniform1f(uniforms.time, elapsed);
    gl.uniform1f(uniforms.detail, mobileDevice() ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (!paused && (now < animationUntil || Math.abs(targetProgress - currentProgress) > 0.0001)) {
      frameId = requestAnimationFrame(render);
    }
  }

  function onResize() {
    needsResize = true;
    requestRender(500);
  }

  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else {
      lastFrame = performance.now();
      requestRender(500);
    }
  }

  function onMotionChange(event) {
    reduceMotion = event.matches;
    requestRender(500);
  }

  function setAvailability(available) {
    if (!canvas) return;
    canvas.classList.toggle('world-unavailable', !available);
    canvas.dataset.world = available ? 'ready' : 'unavailable';
    canvas.closest('.world')?.classList.toggle('has-webgl', available);
  }

  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frameId);
    frameId = 0;
    setAvailability(false);
  }

  function onContextRestored() {
    const element = canvas;
    destroy();
    init(element);
  }

  function init(element) {
    if (initialized) return true;
    canvas = element || document.getElementById('world-canvas');
    if (!canvas) return false;
    try {
      gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference: 'low-power',
        preserveDrawingBuffer: false
      });
      if (!gl) {
        setAvailability(false);
        return false;
      }
      const vertex = compile(gl.VERTEX_SHADER, vertexSource);
      const highPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      const source = highPrecision && highPrecision.precision > 0 ? fragmentSource : fragmentSource.replace('precision highp float;', 'precision mediump float;');
      const fragment = compile(gl.FRAGMENT_SHADER, source);
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uniforms = {
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        pointer: gl.getUniformLocation(program, 'u_pointer'),
        progress: gl.getUniformLocation(program, 'u_progress'),
        time: gl.getUniformLocation(program, 'u_time'),
        detail: gl.getUniformLocation(program, 'u_detail')
      };
      initialized = true;
      contextLost = false;
      needsResize = true;
      motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      reduceMotion = motionQuery.matches;
      if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
      window.addEventListener('resize', onResize, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(canvas);
      }
      setAvailability(true);
      requestRender(2200);
      return true;
    } catch (error) {
      console.warn('The landscape is unavailable; the portfolio remains fully usable.', error);
      setAvailability(false);
      destroy();
      return false;
    }
  }

  function destroy() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    if (motionQuery && motionQuery.removeEventListener) motionQuery.removeEventListener('change', onMotionChange);
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = null;
    if (canvas) {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
    }
    if (gl && !contextLost) {
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    }
    initialized = false;
    gl = null;
    program = null;
    buffer = null;
    uniforms = null;
  }

  window.PortfolioWorld = {
    init,
    setProgress(value) {
      const number = Number(value);
      if (!Number.isFinite(number)) return;
      const next = clamp(number, 0, 1);
      if (Math.abs(next - targetProgress) < 0.00001) return;
      targetProgress = next;
      requestRender(700);
    },
    setPointer(x, y) {
      if (userPaused || reduceMotion) return;
      targetPointer = [clamp(Number(x) || 0, -1, 1), clamp(Number(y) || 0, -1, 1)];
      requestRender(600);
    },
    setPaused(value) {
      userPaused = Boolean(value);
      requestRender(userPaused ? 0 : 1000);
    },
    destroy,
    get supported() { return initialized && !contextLost; }
  };
})();
