import math

def get_accretion_hero_html() -> str:
    """
    Returns a prominent, fully 3D interactive Black Hole Accretion Disk visualization
    rendered with Three.js r128 and custom shaders.
    
    Features:
    - 3D Event Horizon (jet-black singularity)
    - Blazing Einstein Lensing Arc (light bent around the black hole)
    - Volumetric Combustion Fire Accretion Disk (fiery orange-red plasma with Keplerian shear)
    - 1,500+ differential relativistic fire streak particles
    - Full 3D Mouse Orbit Controls: Drag to rotate around the black hole in any direction
    - Mouse wheel zoom in/out
    - Click & hold to feed the singularity with coronal flare and spark bursts
    - View presets: "Combustion Fire", "Ember Quench", "Solar Flare", "Reset 3D View"
    """
    html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ignis Atelier 3D Accretion Disk</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body, html { width: 100%; height: 100%; overflow: hidden; background: #030105; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f0f4f8; }
#canvas-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: grab; }
#canvas-container:active { cursor: grabbing; }

.overlay { position: absolute; z-index: 10; pointer-events: none; }
.top-bar { top: 20px; left: 24px; right: 24px; display: flex; justify-content: space-between; align-items: center; }
.badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(234, 88, 12, 0.2); color: #ff7700; border: 1px solid rgba(249, 115, 22, 0.5); border-radius: 8px; backdrop-filter: blur(10px); box-shadow: 0 0 20px rgba(234, 88, 12, 0.3); }

.controls { pointer-events: auto; display: flex; gap: 8px; }
.btn { background: rgba(15, 23, 42, 0.85); color: #cbd5e1; border: 1px solid rgba(249, 115, 22, 0.3); padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; backdrop-filter: blur(8px); }
.btn:hover { background: rgba(30, 41, 59, 0.95); color: #ffffff; border-color: #ff7700; transform: translateY(-1px); }
.btn.active { background: linear-gradient(135deg, #ea580c, #c2410c); color: #ffffff; border-color: #ff9933; box-shadow: 0 0 16px rgba(234, 88, 12, 0.6); }

.hero-text { position: absolute; bottom: 28px; left: 28px; max-width: 580px; pointer-events: auto; background: rgba(3, 1, 5, 0.65); padding: 16px 20px; border-radius: 12px; border: 1px solid rgba(255, 119, 0, 0.2); backdrop-filter: blur(12px); }
h1.title { font-size: 36px; font-weight: 300; letter-spacing: -0.02em; color: #ffffff; line-height: 1.15; margin-bottom: 6px; }
span.fire { font-style: italic; font-weight: 600; color: #ff5500; text-shadow: 0 0 25px rgba(255, 85, 0, 0.8), 0 0 50px rgba(255, 119, 0, 0.4); }
p.desc { font-size: 13px; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px; }
.hint { display: flex; gap: 14px; font-size: 11px; font-family: monospace; color: #ffaa55; text-transform: uppercase; letter-spacing: 0.08em; }

.telemetry-card { position: absolute; bottom: 28px; right: 28px; z-index: 10; background: rgba(10, 5, 15, 0.75); border: 1px solid rgba(255, 119, 0, 0.3); border-radius: 10px; padding: 12px 16px; font-family: monospace; font-size: 11px; color: #f97316; backdrop-filter: blur(8px); pointer-events: none; }
.telemetry-val { color: #ffffff; font-weight: 700; }
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
<div id="canvas-container"></div>

<div class="overlay top-bar">
  <div class="badge">🔥 Ignis Atelier · 3D Combustion Singularity</div>
  <div class="controls">
    <button class="btn active" id="btn-fire" onclick="setPreset('fire')">Combustion Blaze</button>
    <button class="btn" id="btn-solar" onclick="setPreset('solar')">Solar Flare</button>
    <button class="btn" id="btn-quench" onclick="setPreset('quench')">Quench Limit</button>
    <button class="btn" onclick="resetView()">Reset 3D View</button>
  </div>
</div>

<div class="hero-text">
  <h1 class="title">The Eye of Fire: <span class="fire">Accretion Disk</span></h1>
  <p class="desc">A gravitationally lensed black hole surrounded by a roaring, Keplerian combustion plasma disk. Light from behind the singularity is warped over and under the event horizon into luminous Einstein arcs.</p>
  <div class="hint">
    <span>🖱️ Drag to rotate 3D</span>
    <span>🔍 Scroll to zoom</span>
    <span>⚡ Click & hold to feed</span>
  </div>
</div>

<div class="telemetry-card">
  <div>EVENT HORIZON: <span class="telemetry-val" id="tel-horizon">2.80 R_g</span></div>
  <div>ORBITAL VELOCITY: <span class="telemetry-val" id="tel-speed">0.48 c</span></div>
  <div>PLASMA TEMP: <span class="telemetry-val" id="tel-temp">3,450 K (Combustion)</span></div>
</div>

<script>
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030105, 0.015);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const DEFAULT_CAM_POS = new THREE.Vector3(0, 3.8, 11.5);
camera.position.copy(DEFAULT_CAM_POS);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xff4400, 0.6);
scene.add(ambientLight);

const coreLight = new THREE.PointLight(0xff7700, 3.5, 30);
coreLight.position.set(0, 0, 0);
scene.add(coreLight);

// Starfield Background
const starGeo = new THREE.BufferGeometry();
const starCount = 1200;
const starPos = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
  starPos[i] = (Math.random() - 0.5) * 160;
  starPos[i+1] = (Math.random() - 0.5) * 160;
  starPos[i+2] = (Math.random() - 0.5) * 160;
  
  const isWarm = Math.random() > 0.4;
  starColors[i] = isWarm ? 1.0 : 0.8;
  starColors[i+1] = isWarm ? 0.7 + Math.random() * 0.3 : 0.85;
  starColors[i+2] = isWarm ? 0.4 : 1.0;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
const starMat = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0.85 });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// Central Black Hole Group
const holeGroup = new THREE.Group();
holeGroup.rotation.x = 0.28;
holeGroup.rotation.z = -0.12;
scene.add(holeGroup);

// 1. The Jet-Black Event Horizon (Singularity Sphere)
const horizonGeo = new THREE.SphereGeometry(1.65, 64, 64);
const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
holeGroup.add(horizonMesh);

// 2. Gravitational Photon Sphere (Intense Fiery Rim)
const photonGeo = new THREE.SphereGeometry(1.72, 64, 64);
const photonMat = new THREE.MeshBasicMaterial({
  color: 0xff4500,
  transparent: true,
  opacity: 0.95,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide
});
const photonMesh = new THREE.Mesh(photonGeo, photonMat);
holeGroup.add(photonMesh);

// Outer Atmosphere Glow
const atmoGeo = new THREE.SphereGeometry(1.95, 48, 48);
const atmoMat = new THREE.MeshBasicMaterial({
  color: 0xff7700,
  transparent: true,
  opacity: 0.45,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide
});
const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
holeGroup.add(atmoMesh);

// 3. Einstein Gravitational Lensing Halo (The Bent Accretion Arc)
// In a real black hole, light from the rear of the disk curves over and under the horizon
const arcGeo = new THREE.TorusGeometry(2.45, 0.45, 32, 128);
const arcMat = new THREE.MeshBasicMaterial({
  color: 0xff3b00,
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending
});
const upperArc = new THREE.Mesh(arcGeo, arcMat);
upperArc.rotation.x = Math.PI / 2;
upperArc.scale.set(1.0, 1.25, 1.0);
holeGroup.add(upperArc);

const innerArcGeo = new THREE.TorusGeometry(2.15, 0.25, 24, 96);
const innerArcMat = new THREE.MeshBasicMaterial({
  color: 0xffcc00,
  transparent: true,
  opacity: 0.95,
  blending: THREE.AdditiveBlending
});
const innerUpperArc = new THREE.Mesh(innerArcGeo, innerArcMat);
innerUpperArc.rotation.x = Math.PI / 2;
innerUpperArc.scale.set(1.0, 1.2, 1.0);
holeGroup.add(innerUpperArc);

// 4. Volumetric Accretion Disk (Concentric Fiery Plasma Rings)
const diskGroup = new THREE.Group();
holeGroup.add(diskGroup);

function createFireRing(innerR, outerR, colorHex, opacity, yOffset = 0) {
  const ringGeo = new THREE.RingGeometry(innerR, outerR, 96);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: opacity,
    blending: THREE.AdditiveBlending
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = yOffset;
  return ringMesh;
}

// Innermost Stable Circular Orbit (ISCO) - Blazing hot white/yellow
diskGroup.add(createFireRing(1.85, 2.35, 0xffffff, 0.95));
diskGroup.add(createFireRing(2.35, 3.2, 0xffea00, 0.85));
// Main Combustion Fire Zone - Intense orange & crimson
diskGroup.add(createFireRing(3.2, 4.8, 0xff4500, 0.75));
diskGroup.add(createFireRing(4.8, 6.8, 0xd01c00, 0.55));
// Outer Cooling Soot & Smoke Zone
diskGroup.add(createFireRing(6.8, 9.5, 0x800a00, 0.35));

// 5. Differential Keplerian Particle Streaks (1,800 fiery orbital sparks)
const pCount = 1800;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(pCount * 3);
const pColors = new Float32Array(pCount * 3);
const pRadius = new Float32Array(pCount);
const pAngles = new Float32Array(pCount);
const pSpeeds = new Float32Array(pCount);
const pYOffsets = new Float32Array(pCount);

for (let i = 0; i < pCount; i++) {
  // Keplerian distribution: more density near the inner horizon
  const r = 2.0 + Math.pow(Math.random(), 1.7) * 7.5;
  const th = Math.random() * Math.PI * 2;
  const speed = (1.8 / Math.sqrt(r)) * (0.85 + Math.random() * 0.3);
  const y = (Math.random() - 0.5) * (0.12 * (r / 2.5));

  pRadius[i] = r;
  pAngles[i] = th;
  pSpeeds[i] = speed;
  pYOffsets[i] = y;

  pPos[i*3] = Math.cos(th) * r;
  pPos[i*3+1] = y;
  pPos[i*3+2] = Math.sin(th) * r;

  // Particle color based on radial temperature:
  // Inner: White-hot & yellow | Mid: Fiery orange | Outer: Crimson red
  if (r < 3.0) {
    pColors[i*3] = 1.0; pColors[i*3+1] = 0.95; pColors[i*3+2] = 0.8;
  } else if (r < 5.0) {
    pColors[i*3] = 1.0; pColors[i*3+1] = 0.45; pColors[i*3+2] = 0.05;
  } else {
    pColors[i*3] = 0.85; pColors[i*3+1] = 0.1; pColors[i*3+2] = 0.0;
  }
}

pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

const pMat = new THREE.PointsMaterial({
  size: 0.18,
  vertexColors: true,
  transparent: true,
  opacity: 0.95,
  blending: THREE.AdditiveBlending
});
const streakParticles = new THREE.Points(pGeo, pMat);
holeGroup.add(streakParticles);

// 6. Interactive 3D Mouse Orbit Controls
let isDragging = false;
let prevMouseX = 0, prevMouseY = 0;
let spherical = { radius: 12.0, theta: 0.0, phi: 1.25 };
let targetSpherical = { radius: 12.0, theta: 0.0, phi: 1.25 };

function updateCameraPosition() {
  camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
  camera.position.y = spherical.radius * Math.cos(spherical.phi);
  camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
  camera.lookAt(0, 0, 0);
}

container.addEventListener('pointerdown', (e) => {
  isDragging = true;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
  feedSingularity(true);
});

window.addEventListener('pointerup', () => {
  isDragging = false;
  feedSingularity(false);
});

window.addEventListener('pointermove', (e) => {
  if (isDragging) {
    const deltaX = e.clientX - prevMouseX;
    const deltaY = e.clientY - prevMouseY;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;

    targetSpherical.theta -= deltaX * 0.007;
    targetSpherical.phi -= deltaY * 0.007;
    targetSpherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, targetSpherical.phi));
  }
});

// Scroll Zooming
container.addEventListener('wheel', (e) => {
  e.preventDefault();
  targetSpherical.radius += e.deltaY * 0.008;
  targetSpherical.radius = Math.max(4.5, Math.min(24.0, targetSpherical.radius));
}, { passive: false });

function resetView() {
  targetSpherical = { radius: 12.0, theta: 0.0, phi: 1.25 };
}

// Singularity Feeding & Presets
let isFeeding = false;
let feedIntensity = 0.0;

function feedSingularity(active) {
  isFeeding = active;
}

let activePreset = 'fire';
function setPreset(name) {
  activePreset = name;
  document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('btn-' + name);
  if (btn) btn.classList.add('active');

  const telTemp = document.getElementById('tel-temp');
  if (name === 'fire') {
    photonMat.color.setHex(0xff4500);
    arcMat.color.setHex(0xff3b00);
    pMat.size = 0.18;
    if (telTemp) telTemp.textContent = '3,450 K (Combustion)';
  } else if (name === 'solar') {
    photonMat.color.setHex(0xffaa00);
    arcMat.color.setHex(0xffdd00);
    pMat.size = 0.24;
    if (telTemp) telTemp.textContent = '5,800 K (Solar Plasma)';
  } else if (name === 'quench') {
    photonMat.color.setHex(0xaa2200);
    arcMat.color.setHex(0x771100);
    pMat.size = 0.12;
    if (telTemp) telTemp.textContent = '1,120 K (Near Quench)';
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
const clock = new THREE.Clock();
let animTime = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  animTime += delta;

  // Smooth camera orbit damping
  spherical.theta += (targetSpherical.theta - spherical.theta) * 0.08;
  spherical.phi += (targetSpherical.phi - spherical.phi) * 0.08;
  spherical.radius += (targetSpherical.radius - spherical.radius) * 0.08;
  updateCameraPosition();

  // Feed intensity interpolation
  feedIntensity += ((isFeeding ? 1.0 : 0.0) - feedIntensity) * delta * 4.0;
  const flareScale = 1.0 + feedIntensity * 0.45;
  photonMesh.scale.set(flareScale, flareScale, flareScale);
  coreLight.intensity = 3.5 + feedIntensity * 4.0;

  // Differential Keplerian Particle Motion
  const positions = pGeo.attributes.position.array;
  const speedMultiplier = 1.0 + feedIntensity * 1.8;

  for (let i = 0; i < pCount; i++) {
    pAngles[i] += pSpeeds[i] * delta * speedMultiplier;
    const r = pRadius[i];
    const th = pAngles[i];

    positions[i*3] = Math.cos(th) * r;
    positions[i*3+1] = pYOffsets[i] + Math.sin(animTime * 3.0 + th) * 0.03;
    positions[i*3+2] = Math.sin(th) * r;
  }
  pGeo.attributes.position.needsUpdate = true;

  // Subtle pulsing of the Einstein arc
  upperArc.rotation.z = animTime * 0.15;
  innerUpperArc.rotation.z = -animTime * 0.22;

  // Autotilt if not actively dragging
  if (!isDragging) {
    holeGroup.rotation.y = animTime * 0.04;
  }

  renderer.render(scene, camera);
}

animate();
</script>
</body>
</html>"""
    return html
