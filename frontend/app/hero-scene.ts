const vertexSource = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uSize;
uniform vec2 uPointer;
uniform float uCell;
uniform float uTime;
flat out float vLight;
flat out float vGrain;

uint hash(ivec3 point) {
  uvec3 p = uvec3(point);
  uint value = p.x * 1597334677u ^ p.y * 3812015801u ^ p.z * 2798796415u;
  value ^= value >> 16;
  return value * 2246822519u;
}

float gradient(ivec3 cell, vec3 offset) {
  uint value = hash(cell);
  vec3 direction = vec3(
    float(value & 255u),
    float((value >> 8) & 255u),
    float((value >> 16) & 255u)
  ) / 127.5 - 1.0;
  return dot(direction, offset);
}

float noise(vec3 point) {
  ivec3 cell = ivec3(floor(point));
  vec3 f = fract(point);
  vec3 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  float a = mix(gradient(cell, f),
    gradient(cell + ivec3(1, 0, 0), f - vec3(1, 0, 0)), w.x);
  float b = mix(gradient(cell + ivec3(0, 1, 0), f - vec3(0, 1, 0)),
    gradient(cell + ivec3(1, 1, 0), f - vec3(1, 1, 0)), w.x);
  float c = mix(gradient(cell + ivec3(0, 0, 1), f - vec3(0, 0, 1)),
    gradient(cell + ivec3(1, 0, 1), f - vec3(1, 0, 1)), w.x);
  float d = mix(gradient(cell + ivec3(0, 1, 1), f - vec3(0, 1, 1)),
    gradient(cell + ivec3(1, 1, 1), f - vec3(1, 1, 1)), w.x);
  return mix(mix(a, b, w.y), mix(c, d, w.y), w.z);
}

void main() {
  vec2 spacing = vec2(uCell * 0.84, uCell);
  int columns = int(ceil(uSize.x / spacing.x));
  ivec2 cell = ivec2(gl_VertexID % columns, gl_VertexID / columns);
  vec2 pixel = (vec2(cell) + 0.5) * spacing;
  vec2 position = (pixel - 0.5 * uSize) / uSize.y;
  vec2 field = (position - uPointer * 0.055) * vec2(1.34, 1.18);
  vec3 samplePoint = vec3(field + vec2(2.8, 3.4 - uTime * 0.14), 1.8 + uTime * 0.17);
  float phase = noise(samplePoint) * 1.75 + uTime * 0.052;
  float wave = 0.5 - 0.5 * cos(6.283185 * phase);
  vLight = smoothstep(0.46, 1.0, wave);
  vGrain = float(hash(ivec3(cell, 8)) & 65535u) / 65535.0;

  gl_Position = vec4(pixel / uSize * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uCell;
}`;

const fragmentSource = `#version 300 es
precision mediump float;

flat in float vLight;
flat in float vGrain;
uniform float uEmphasis;
out vec4 color;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  vec2 oval = p * vec2(1.8, 1.0);
  float dotInk = 1.0 - smoothstep(0.08, 0.26, length(oval));
  float slash = (1.0 - smoothstep(0.035, 0.15, abs(p.x + p.y * 0.32)))
    * (1.0 - smoothstep(0.23, 0.43, abs(p.y)));
  float ring = 1.0 - smoothstep(0.025, 0.16, abs(length(oval) - 0.24));
  float symbol = vGrain < 0.55 ? dotInk : (vGrain < 0.83 ? slash : ring);
  float ink = mix(dotInk, symbol, smoothstep(0.2, 0.92, vLight));
  float opacity = ink * (vLight * (0.12 + 0.14 * vGrain)
    + uEmphasis * (0.10 + 0.33 * vLight));
  color = vec4(0.96, 0.87, 0.39, opacity);
}`;

export function createHeroScene(canvas: HTMLCanvasElement, emphasis: number) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return null;

  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.deleteProgram(program);
    return null;
  }
  gl.shaderSource(vertex, vertexSource);
  gl.shaderSource(fragment, fragmentSource);
  gl.compileShader(vertex);
  gl.compileShader(fragment);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  gl.useProgram(program);
  const size = gl.getUniformLocation(program, "uSize");
  const pointer = gl.getUniformLocation(program, "uPointer");
  const time = gl.getUniformLocation(program, "uTime");
  const cell = gl.getUniformLocation(program, "uCell");
  gl.uniform1f(gl.getUniformLocation(program, "uEmphasis"), emphasis);
  let count = 0;

  return {
    resize(width: number, height: number) {
      const scale = Math.min(window.devicePixelRatio || 1, 1.25, Math.sqrt(1_200_000 / (width * height)));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      const cellSize = Math.max(3, 5 * scale);
      count = Math.ceil(canvas.width / (cellSize * 0.84)) * Math.ceil(canvas.height / cellSize);
      gl.uniform2f(size, canvas.width, canvas.height);
      gl.uniform1f(cell, cellSize);
    },
    draw(seconds: number, x: number, y: number) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(time, seconds);
      gl.uniform2f(pointer, x, y);
      gl.drawArrays(gl.POINTS, 0, count);
    },
    dispose() {
      gl.deleteProgram(program);
    },
  };
}
