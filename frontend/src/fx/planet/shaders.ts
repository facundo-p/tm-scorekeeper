// Copia literal de docs/redesign/mockup/js/fx/planet-shaders.js (F27, FX-01). No editar a mano:
// el test de deriva (src/test/fx/planetShaders.test.ts) exige que sea idéntica al mockup.
// GLSL for the Mars globe. Bake pass: an equirectangular surface computed once
// (elevation, albedo, slopes, masks). Render pass: a lit, terraformable globe with
// the 61-space Terraforming Mars board projected over the focused region.

export const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const COMMON = `
#define PI 3.14159265359
vec3 sph(float lat, float lon) { return vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon)); }
vec3 sphd(float latd, float lond) { return sph(radians(latd), radians(lond)); }
float angTo(vec3 a, vec3 b) { return acos(clamp(dot(a, b), -1.0, 1.0)); }
float bumpd(vec3 p, vec3 c, float r) { float d = angTo(p, c) / r; return exp(-d * d); }
`;

// Simplex noise 3D: Ian McEwan / Ashima Arts (MIT)
const NOISE = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
float fbm(vec3 p, int oct) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 7; i++) {
    if (i >= oct) break;
    s += a * snoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return s;
}
vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
`;

export const BAKE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
layout(location = 0) out vec4 oSurf;
layout(location = 1) out vec4 oAux;
layout(location = 2) out vec4 oCloud;
uniform vec2 uTexel;
${COMMON}
${NOISE}

float volcano(vec3 p, vec3 c, float r, float hgt) {
  float d = angTo(p, c) / r;
  float cone = hgt * pow(max(0.0, 1.0 - d), 1.7);
  float caldera = hgt * 0.32 * exp(-pow(d / 0.11, 2.0));
  return cone - caldera;
}
float basin(vec3 p, vec3 c, float r, float depth) {
  float d = angTo(p, c) / r;
  float bowl = depth * (1.0 - smoothstep(0.0, 1.0, d));
  float rim = depth * 0.2 * exp(-pow((d - 1.05) / 0.13, 2.0));
  return bowl - rim;
}
float canyon(vec3 p) {
  float lat = asin(clamp(p.y, -1.0, 1.0));
  float lon = atan(p.x, p.z);
  float t = (lon - radians(-96.0)) / (radians(-36.0) - radians(-96.0));
  float win = smoothstep(0.0, 0.07, t) * (1.0 - smoothstep(0.86, 1.0, t));
  if (win <= 0.0) return 0.0;
  float center = radians(-8.5) + 0.04 * sin(t * 8.0) + 0.018 * sin(t * 23.0) - t * 0.03;
  float w = mix(0.014, 0.045, smoothstep(0.25, 0.85, t));
  float d = (lat - center) / w;
  float side = (lat - center - 0.06) / (w * 0.7);
  return 0.34 * exp(-d * d) * win + 0.1 * exp(-side * side) * win * step(0.4, t);
}
float craters(vec3 p, float scale, float density) {
  vec3 q = p * scale;
  vec3 i = floor(q);
  vec3 f = fract(q);
  float h = 0.0;
  for (int x = -1; x <= 1; x++)
  for (int y = -1; y <= 1; y++)
  for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 cell = i + g;
    vec3 rnd = hash33(cell);
    if (rnd.z > density) continue;
    vec3 c = g + rnd * 0.8 + 0.1 - f;
    float rad = 0.16 + 0.3 * hash33(cell + 7.1).x;
    float d = length(c) / rad;
    if (d < 1.45) {
      float bowl = -(1.0 - d * d) * step(d, 1.0);
      float rim = exp(-pow((d - 1.0) / 0.15, 2.0)) * 0.38;
      h += (bowl * 0.9 + rim) * rad;
    }
  }
  return h;
}
float northMask(vec3 p) {
  float dn = fbm(p * 2.2 + 4.1, 3);
  return smoothstep(-0.12, 0.42, p.y + dn * 0.22);
}
float elevation(vec3 p) {
  float north = northMask(p);
  float h = fbm(p * 1.7 + 2.3, 5) * 0.32 + fbm(p * 5.3 + 11.3, 4) * 0.1;
  h -= north * 0.3;
  h += 0.38 * bumpd(p, sphd(2.0, -108.0), 0.5);
  h += 0.12 * bumpd(p, sphd(-28.0, -95.0), 0.35);
  h += 0.08 * bumpd(p, sphd(40.0, -110.0), 0.2);
  h += volcano(p, sphd(18.6, -134.0), 0.12, 0.62);
  h += volcano(p, sphd(-8.3, -120.5), 0.065, 0.36);
  h += volcano(p, sphd(1.2, -112.8), 0.06, 0.34);
  h += volcano(p, sphd(11.9, -104.4), 0.06, 0.36);
  h += volcano(p, sphd(24.8, 146.9), 0.07, 0.3);
  h -= canyon(p);
  h -= basin(p, sphd(-42.4, 70.5), 0.37, 0.62);
  h -= basin(p, sphd(-49.7, -43.0), 0.2, 0.35);
  h -= basin(p, sphd(46.7, 117.5), 0.5, 0.16);
  h -= basin(p, sphd(4.0, 88.0), 0.22, 0.12);
  float hi = 1.0 - north * 0.75;
  h += craters(p, 9.0, 0.55) * 0.55 * hi;
  h += craters(p, 23.0, 0.6) * 0.35 * hi;
  h += craters(p, 52.0, 0.5) * 0.15;
  return h;
}
vec3 albedo(vec3 p, float e) {
  vec3 basalt = vec3(0.24, 0.12, 0.08);
  vec3 rust = vec3(0.6, 0.27, 0.13);
  vec3 ochre = vec3(0.78, 0.47, 0.27);
  vec3 dust = vec3(0.88, 0.66, 0.47);
  vec3 c = mix(basalt, rust, smoothstep(0.18, 0.42, e));
  c = mix(c, ochre, smoothstep(0.45, 0.7, e));
  c = mix(c, dust, smoothstep(0.72, 0.95, e));
  float alb = fbm(p * 3.1 + 21.7, 4);
  c *= 0.82 + 0.36 * (alb * 0.5 + 0.5);
  float dark = 0.75 * bumpd(p, sphd(9.0, 69.0), 0.26)
    + 0.55 * bumpd(p, sphd(46.0, -29.0), 0.3)
    + 0.45 * bumpd(p, sphd(-14.0, 0.0), 0.35)
    + 0.4 * bumpd(p, sphd(-28.0, -88.0), 0.18)
    + 0.35 * bumpd(p, sphd(-10.0, 140.0), 0.3);
  dark *= smoothstep(-0.2, 0.6, fbm(p * 7.0 + 3.3, 3) + 0.25);
  c = mix(c, vec3(0.2, 0.11, 0.08), clamp(dark, 0.0, 0.75));
  float bright = 0.4 * bumpd(p, sphd(5.0, -110.0), 0.45) + 0.3 * bumpd(p, sphd(20.0, 10.0), 0.4);
  c = mix(c, dust, clamp(bright * 0.6, 0.0, 0.5));
  return c;
}
float toE01(float h) { return clamp(h * 0.42 + 0.48, 0.0, 1.0); }
float encSlope(float s) { float k = s * 0.22; return 0.5 + 0.5 * (k / (1.0 + abs(k))); }

void main() {
  float lon = (vUv.x - 0.5) * 2.0 * PI;
  float lat = (vUv.y - 0.5) * PI;
  vec3 p = sph(lat, lon);
  float eps = uTexel.x * 2.0 * PI;
  vec3 E = vec3(cos(lon), 0.0, -sin(lon));
  vec3 N = vec3(-sin(lat) * sin(lon), cos(lat), -sin(lat) * cos(lon));
  float h0 = elevation(p);
  float he = elevation(normalize(p + E * eps));
  float hn = elevation(normalize(p + N * eps));
  float e01 = toE01(h0);
  oSurf = vec4(albedo(p, e01), e01);
  float veg = fbm(p * 3.4 + 40.0, 5) * 0.5 + 0.5;
  vec3 lq = p * 38.0;
  vec3 lc = floor(lq);
  float lights = 0.0;
  for (int x = -1; x <= 1; x++)
  for (int y = -1; y <= 1; y++)
  for (int z = -1; z <= 1; z++) {
    vec3 cell = lc + vec3(float(x), float(y), float(z));
    vec3 r = hash33(cell * 1.37);
    if (r.x > 0.11) continue;
    float d = length(cell + r - lq);
    lights += exp(-d * d * 9.0) * (0.5 + r.y);
  }
  oAux = vec4(encSlope((he - h0) / eps * 0.02), encSlope((hn - h0) / eps * 0.02), veg, clamp(lights, 0.0, 1.0));
  float c1 = fbm(p * vec3(4.0, 7.0, 4.0) + 50.0, 5) * 0.5 + 0.5;
  float c2 = fbm(p * vec3(9.0, 15.0, 9.0) + 80.0, 4) * 0.5 + 0.5;
  float frost = fbm(p * 10.0 + 5.0, 3) * 0.5 + 0.5;
  oCloud = vec4(c1, c2, 0.0, frost);
}`;

export const RENDER_FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uSurf;
uniform sampler2D uAux;
uniform sampler2D uCloud;
uniform vec3 uPlanet;
uniform vec3 uLight;
uniform float uYaw;
uniform float uPitch;
uniform float uTime;
uniform float uTerra;
uniform vec4 uFocus;
uniform vec2 uHex;
uniform float uBright;
uniform float uGlow;
${COMMON}

vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c); }
vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); }
float decSlope(float e) { float d = e * 2.0 - 1.0; return d / max(1.0 - abs(d), 0.02) / 0.22; }
float hexDist(vec2 p) { p = abs(p); return max(dot(p, normalize(vec2(1.0, 1.7320508))), p.x); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}

vec3 board(vec3 s, float viewZ, float day) {
  vec3 c = sph(uFocus.x, uFocus.y);
  float cd = dot(s, c);
  if (cd < 0.6) return vec3(0.0);
  vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), c));
  vec3 north = cross(c, east);
  vec3 v = s / cd;
  vec2 g = vec2(dot(v, east), dot(v, north)) / uHex.x;
  vec2 rr = vec2(1.0, 1.7320508);
  vec2 hh = rr * 0.5;
  vec2 a = mod(g, rr) - hh;
  vec2 b = mod(g - hh, rr) - hh;
  vec2 gv = dot(a, a) < dot(b, b) ? a : b;
  vec2 id = g - gv;
  float row = floor(id.y / 0.8660254 + 0.5);
  float qa = floor(id.x - row * 0.5 + 0.5);
  float dist = max(max(abs(qa), abs(row)), abs(qa + row));
  if (dist > 4.5) return vec3(0.0);
  float edge = 0.5 - hexDist(gv);
  float px = fwidth(g.x);
  float line = 1.0 - smoothstep(0.0, px * 1.4 + 0.012, edge);
  vec2 key = vec2(qa, row) + vec2(uFocus.y * 7.13, uFocus.x * 3.71);
  float r1 = hash12(key);
  float r2 = hash12(key + 19.7);
  float r3 = hash12(key + 41.3);
  bool oceanSpace = r1 < 0.2;
  float placed = step(r2, uHex.y);
  vec3 tile = vec3(0.0);
  float fillA = 0.0;
  if (placed > 0.5) {
    if (oceanSpace) { tile = vec3(0.1, 0.42, 0.78); fillA = 0.55; }
    else if (r3 < 0.7) { tile = vec3(0.3, 0.62, 0.22); fillA = 0.5; }
    else { tile = vec3(0.62, 0.64, 0.7); fillA = 0.5; }
  }
  float inner = smoothstep(0.035, 0.06, edge);
  float pulse = exp(-pow((dist - mod(uTime * 1.1, 7.0) + 1.0) / 0.55, 2.0));
  vec3 lineCol = oceanSpace ? vec3(0.45, 0.72, 1.0) : vec3(1.0, 0.82, 0.55);
  float fade = smoothstep(0.04, 0.3, viewZ) * uFocus.w;
  vec3 col = lineCol * line * (0.5 + 0.5 * pulse) * 0.75;
  col += tile * fillA * inner * (0.55 + 0.45 * day);
  col += lineCol * pulse * inner * 0.06;
  if (dist < 0.5) col += vec3(1.0, 0.85, 0.5) * 0.08 * inner;
  return col * fade * mix(0.55, 1.0, day);
}

void main() {
  vec2 q = (gl_FragCoord.xy - uPlanet.xy) / uPlanet.z;
  float r = length(q);
  vec3 Lv = normalize(uLight);
  vec3 atm = mix(vec3(0.98, 0.58, 0.36), vec3(0.42, 0.68, 1.0), smoothstep(0.15, 0.95, uTerra));
  float aa = 1.6 / uPlanet.z;
  if (r > 1.0 + aa) {
    float d = r - 1.0;
    float g = exp(-d * 10.0) * (1.0 - smoothstep(0.22, 0.4, d));
    float side = clamp(dot(normalize(q), normalize(Lv.xy + 0.0001)) * 0.6 + 0.45, 0.0, 1.0);
    float al = g * side * 0.6 * uGlow;
    o = vec4(atm * al, al);
    return;
  }
  float z = sqrt(max(0.0, 1.0 - r * r));
  vec3 n = vec3(q, z);
  vec3 s = rotY(rotX(n, -uPitch), -uYaw);
  vec3 Lp = rotY(rotX(Lv, -uPitch), -uYaw);
  vec3 Vp = rotY(rotX(vec3(0.0, 0.0, 1.0), -uPitch), -uYaw);
  float lat = asin(clamp(s.y, -1.0, 1.0));
  float lon = atan(s.x, s.z);
  vec2 uv = vec2(lon / (2.0 * PI) + 0.5, lat / PI + 0.5);
  vec4 S = texture(uSurf, uv);
  vec4 A = texture(uAux, uv);
  vec4 C = texture(uCloud, uv);
  float h = S.a;
  vec3 col = S.rgb;
  vec3 E = vec3(cos(lon), 0.0, -sin(lon));
  vec3 N = vec3(-sin(lat) * sin(lon), cos(lat), -sin(lat) * cos(lon));

  float sea = mix(0.02, 0.5, pow(uTerra, 0.85));
  float water = smoothstep(sea + 0.004, sea - 0.012, h) * step(0.002, uTerra);
  float depth = clamp((sea - h) / 0.25, 0.0, 1.0);
  float capLat = radians(mix(73.0, 83.0, uTerra));
  float ice = smoothstep(capLat, capLat + radians(4.0), abs(lat) + (C.a - 0.5) * 0.12);
  float coast = 1.0 - smoothstep(sea, sea + 0.04 + 0.12 * uTerra, h);
  float lowland = 1.0 - smoothstep(0.32, 0.6, h);
  float temperate = 1.0 - smoothstep(radians(48.0), radians(68.0), abs(lat));
  float vegMask = smoothstep(0.6 - 0.28 * uTerra, 0.74 - 0.28 * uTerra, A.b);
  float veg = max(coast, lowland * 0.45 * uTerra) * vegMask * temperate * (1.0 - water) * (1.0 - ice) * smoothstep(0.05, 0.3, uTerra);
  col = mix(col, mix(vec3(0.13, 0.29, 0.11), vec3(0.3, 0.44, 0.17), A.b), veg * 0.85);
  col = mix(col, vec3(0.86, 0.86, 0.84), ice);
  col = mix(col, mix(vec3(0.07, 0.32, 0.45), vec3(0.02, 0.09, 0.2), depth), water);

  vec2 sl = vec2(decSlope(A.r), decSlope(A.g));
  vec3 sn = normalize(s - (E * sl.x + N * sl.y) * 0.9 * (1.0 - water) * (1.0 - ice * 0.6));
  // Close-up globes (login, ceremony) get procedural micro-relief the baked map can't hold.
  float detailAmt = smoothstep(380.0, 900.0, uPlanet.z) * (1.0 - water) * (1.0 - ice * 0.7);
  if (detailAmt > 0.001) {
    float dn = vnoise(s * 70.0) * 0.65 + vnoise(s * 185.0) * 0.35;
    col *= mix(1.0, 0.87 + 0.26 * dn, detailAmt);
    vec2 dd = vec2(dFdx(dn), dFdy(dn));
    sn = normalize(sn + rotY(rotX(vec3(-dd * 1.6, 0.0), -uPitch), -uYaw) * detailAmt);
  }
  float ndl = dot(sn, Lp);
  float ndlS = dot(s, Lp);
  float day = smoothstep(-0.08, 0.3, ndlS);
  float diff = max(ndl, 0.0);
  vec3 lit = col * (0.03 + vec3(1.0, 0.95, 0.88) * diff * 1.18 * day);
  vec3 H = normalize(Lp + Vp);
  lit += vec3(1.0, 0.92, 0.8) * pow(max(dot(s, H), 0.0), 80.0) * water * day * 0.8;

  float cn = texture(uCloud, uv + vec2(uTime * 0.0032, 0.0)).r * 0.65 + texture(uCloud, uv + vec2(uTime * 0.0057, 0.01)).g * 0.35;
  float cloud = smoothstep(0.6 - 0.2 * uTerra, 0.88, cn) * mix(0.16, 0.75, uTerra);
  lit = mix(lit, vec3(1.0, 0.97, 0.93) * (0.03 + diff * day), cloud * (day * 0.9 + 0.1));

  float night = 1.0 - smoothstep(-0.25, 0.04, ndlS);
  lit += vec3(1.0, 0.66, 0.3) * A.a * night * mix(0.35, 1.0, uTerra) * (1.0 - water) * (1.0 - cloud) * 1.7;

  float fres = pow(1.0 - z, 3.0);
  lit += atm * fres * (0.2 + 0.65 * day) * uGlow;
  if (uFocus.w > 0.001) lit += board(s, z, day);
  lit = lit / (1.0 + lit * 0.12);
  lit *= uBright;
  float alpha = smoothstep(1.0 + aa, 1.0 - aa, r);
  o = vec4(lit * alpha, alpha);
}`;
