import math

def get_landing_hero_html() -> str:
    """
    Returns a self-contained HTML string containing the Three.js 3D hero visualization.
    Follows all coding rules:
    - No indentation inside HTML strings
    - No HTML comments
    - Capped pixel ratio at 2
    - Pause when tab is hidden
    - Earth texture with procedural fallback
    - Smooth 1s morph between Orbit (microgravity) and Earth (1g)
    """
    html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ignis Atelier Hero</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body, html { width: 100%; height: 100%; overflow: hidden; background: #050811; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #f0f4f8; }
#canvas-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
.overlay { position: absolute; z-index: 10; pointer-events: none; }
.top-left { top: 24px; left: 28px; max-width: 520px; }
.title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.badge { display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 4px; }
h1.hero-title { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7); }
p.tagline { font-size: 16px; font-weight: 500; color: #cbd5e1; margin-top: 4px; line-height: 1.4; text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8); }
p.subline { font-size: 13px; color: #94a3b8; margin-top: 6px; line-height: 1.4; }
.controls { position: absolute; top: 24px; right: 28px; z-index: 20; display: flex; gap: 8px; pointer-events: auto; }
.btn { background: rgba(15, 23, 42, 0.75); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.25); padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; backdrop-filter: blur(8px); }
.btn:hover { background: rgba(30, 41, 59, 0.9); color: #f8fafc; border-color: rgba(56, 189, 248, 0.5); }
.btn.active { background: rgba(14, 116, 144, 0.85); color: #ffffff; border-color: #38bdf8; box-shadow: 0 0 14px rgba(56, 189, 248, 0.4); }
.caption { position: absolute; bottom: 16px; right: 24px; z-index: 10; font-size: 11px; color: #64748b; letter-spacing: 0.04em; pointer-events: none; }
.flame-tooltip { position: absolute; bottom: 20px; left: 28px; z-index: 15; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #e2e8f0; max-width: 380px; line-height: 1.4; pointer-events: auto; backdrop-filter: blur(6px); }
.flame-tooltip span.hl { color: #38bdf8; font-weight: 600; }
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
<div id="canvas-container"></div>
<div class="overlay top-left">
<div class="title-row">
<h1 class="hero-title">Ignis Atelier</h1>
<span class="badge">NASA BASS-II Lab</span>
</div>
<p class="tagline">On Earth, fire rises. In orbit, it becomes a sphere.</p>
<p class="subline">Explore what real ISS flame experiments measured, and exactly where the evidence stops.</p>
</div>
<div class="controls">
<button id="btn-orbit" class="btn active" onclick="setMode('orbit')">Orbit (microgravity)</button>
<button id="btn-earth" class="btn" onclick="setMode('earth')">Earth (1 g)</button>
</div>
<div class="flame-tooltip">
<span class="hl">Eye of Fire (Ignis Atelier):</span> Without buoyancy, hot combustion products do not rise. Flames spread out as slow, round, blue spheres governed purely by diffusion.
</div>
<div class="caption">Illustrative visual, not a physical simulation.</div>

<script>
let currentMode = 'orbit';
let targetMorph = 0.0;
let currentMorph = 0.0;
let isPaused = false;

function setMode(mode) {
currentMode = mode;
targetMorph = (mode === 'earth') ? 1.0 : 0.0;
document.getElementById('btn-orbit').classList.toggle('active', mode === 'orbit');
document.getElementById('btn-earth').classList.toggle('active', mode === 'earth');
}

document.addEventListener('visibilitychange', function() {
isPaused = document.hidden;
});

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050811, 0.04);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 7.8);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x223344, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

const starGeo = new THREE.BufferGeometry();
const starCount = 600;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
starPos[i] = (Math.random() - 0.5) * 80;
starPos[i+1] = (Math.random() - 0.5) * 80;
starPos[i+2] = -15 - Math.random() * 40;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.15, transparent: true, opacity: 0.8 });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

const earthGroup = new THREE.Group();
earthGroup.position.set(-1.85, -0.15, 0);
scene.add(earthGroup);

const earthGeo = new THREE.SphereGeometry(1.65, 48, 48);
let earthMat = new THREE.MeshPhongMaterial({
color: 0x1d4ed8,
emissive: 0x091e42,
specular: 0x3b82f6,
shininess: 18,
flatShading: false
});

const textureLoader = new THREE.TextureLoader();
textureLoader.load(
'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
function(texture) {
earthMat.map = texture;
earthMat.needsUpdate = true;
},
undefined,
function() {
const canvas = document.createElement('canvas');
canvas.width = 256; canvas.height = 128;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#0f2b5c'; ctx.fillRect(0, 0, 256, 128);
ctx.fillStyle = '#1e5f38';
ctx.beginPath(); ctx.arc(70, 50, 35, 0, Math.PI*2); ctx.fill();
ctx.beginPath(); ctx.arc(150, 70, 45, 0, Math.PI*2); ctx.fill();
ctx.beginPath(); ctx.arc(200, 40, 25, 0, Math.PI*2); ctx.fill();
const fallbackTex = new THREE.CanvasTexture(canvas);
earthMat.map = fallbackTex;
earthMat.needsUpdate = true;
}
);

const earthMesh = new THREE.Mesh(earthGeo, earthMat);
earthGroup.add(earthMesh);

const atmoGeo = new THREE.SphereGeometry(1.76, 32, 32);
const atmoMat = new THREE.MeshBasicMaterial({
color: 0x38bdf8,
transparent: true,
opacity: 0.22,
blending: THREE.AdditiveBlending,
side: THREE.BackSide
});
const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
earthGroup.add(atmoMesh);

const orbitGroup = new THREE.Group();
orbitGroup.rotation.x = 0.55;
orbitGroup.rotation.y = 0.3;
earthGroup.add(orbitGroup);

const orbitPts = [];
const orbitRadius = 2.45;
for (let i = 0; i <= 64; i++) {
const theta = (i / 64) * Math.PI * 2;
orbitPts.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius));
}
const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
const orbitMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
const orbitLine = new THREE.Line(orbitGeo, orbitMat);
orbitGroup.add(orbitLine);

const issGroup = new THREE.Group();
const trussGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8);
const trussMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
const truss = new THREE.Mesh(trussGeo, trussMat);
truss.rotation.z = Math.PI / 2;
issGroup.add(truss);

const modGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 10);
const modMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
const moduleCore = new THREE.Mesh(modGeo, modMat);
issGroup.add(moduleCore);

const panelGeo = new THREE.BoxGeometry(0.5, 0.012, 0.16);
const panelMat = new THREE.MeshStandardMaterial({ color: 0xc27803, roughness: 0.3, metalness: 0.6 });
const leftPanel = new THREE.Mesh(panelGeo, panelMat);
leftPanel.position.set(-0.35, 0, 0);
issGroup.add(leftPanel);

const rightPanel = new THREE.Mesh(panelGeo, panelMat);
rightPanel.position.set(0.35, 0, 0);
issGroup.add(rightPanel);

issGroup.scale.set(0.65, 0.65, 0.65);
orbitGroup.add(issGroup);

const eyeGroup = new THREE.Group();
eyeGroup.position.set(2.0, 0.0, 0.0);
scene.add(eyeGroup);

const ringGeo = new THREE.TorusGeometry(1.65, 0.016, 16, 96);
const ringMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.45 });
const eyeRing = new THREE.Mesh(ringGeo, ringMat);
eyeGroup.add(eyeRing);

const outerRingGeo = new THREE.TorusGeometry(1.74, 0.008, 12, 72);
const outerRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 });
const eyeOuterRing = new THREE.Mesh(outerRingGeo, outerRingMat);
eyeGroup.add(eyeOuterRing);

const flameGroup = new THREE.Group();
eyeGroup.add(flameGroup);

const blueHaloGeo = new THREE.SphereGeometry(0.9, 32, 32);
const blueHaloMat = new THREE.MeshBasicMaterial({
color: 0x0284c7,
transparent: true,
opacity: 0.35,
blending: THREE.AdditiveBlending
});
const blueHalo = new THREE.Mesh(blueHaloGeo, blueHaloMat);
flameGroup.add(blueHalo);

const blueMidGeo = new THREE.SphereGeometry(0.65, 32, 32);
const blueMidMat = new THREE.MeshBasicMaterial({
color: 0x06b6d4,
transparent: true,
opacity: 0.55,
blending: THREE.AdditiveBlending
});
const blueMid = new THREE.Mesh(blueMidGeo, blueMidMat);
flameGroup.add(blueMid);

const coreGeo = new THREE.SphereGeometry(0.35, 24, 24);
const coreMat = new THREE.MeshBasicMaterial({
color: 0xe0f2fe,
transparent: true,
opacity: 0.85,
blending: THREE.AdditiveBlending
});
const flameCore = new THREE.Mesh(coreGeo, coreMat);
flameGroup.add(flameCore);

const sparkCount = 40;
const sparkGeo = new THREE.BufferGeometry();
const sparkPositions = new Float32Array(sparkCount * 3);
const sparkVelocities = [];
for (let i = 0; i < sparkCount; i++) {
sparkPositions[i*3] = (Math.random() - 0.5) * 0.4;
sparkPositions[i*3+1] = (Math.random() - 0.5) * 0.4;
sparkPositions[i*3+2] = (Math.random() - 0.5) * 0.4;
sparkVelocities.push({
x: (Math.random() - 0.5) * 0.015,
y: 0.02 + Math.random() * 0.035,
z: (Math.random() - 0.5) * 0.015,
life: Math.random()
});
}
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
const sparkMat = new THREE.PointsMaterial({
color: 0xf59e0b,
size: 0.08,
transparent: true,
opacity: 0.0,
blending: THREE.AdditiveBlending
});
const sparks = new THREE.Points(sparkGeo, sparkMat);
flameGroup.add(sparks);

let mouseX = 0, mouseY = 0;
let targetTiltX = 0, targetTiltY = 0;
let currentTiltX = 0, currentTiltY = 0;

window.addEventListener('mousemove', function(e) {
mouseX = (e.clientX / window.innerWidth) * 2 - 1;
mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
targetTiltX = mouseY * 0.25;
targetTiltY = mouseX * 0.35;
});

window.addEventListener('resize', function() {
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth, window.innerHeight);
});

let clock = new THREE.Clock();
let issAngle = 0;

function animate() {
requestAnimationFrame(animate);
if (isPaused) return;

const delta = clock.getDelta();
const time = clock.getElapsedTime();

currentTiltX += (targetTiltX - currentTiltX) * 0.05;
currentTiltY += (targetTiltY - currentTiltY) * 0.05;
earthGroup.rotation.x = currentTiltX;
earthGroup.rotation.y = currentTiltY + time * 0.08;

issAngle += delta * 0.55;
issGroup.position.x = Math.cos(issAngle) * orbitRadius;
issGroup.position.z = Math.sin(issAngle) * orbitRadius;
issGroup.rotation.y = -issAngle;

currentMorph += (targetMorph - currentMorph) * (delta * 2.8);
const m = Math.max(0, Math.min(1, currentMorph));

const orbitPulse = 1.0 + Math.sin(time * 2.2) * 0.05;
const earthFlickerY = 1.0 + (Math.sin(time * 14.0) + Math.cos(time * 27.0)) * 0.06;
const earthFlickerX = 1.0 + Math.sin(time * 18.0) * 0.03;

const scaleX = (1.0 * (1 - m) + 0.55 * m) * (1 - m ? orbitPulse : earthFlickerX);
const scaleY = (1.0 * (1 - m) + 2.1 * m) * (1 - m ? orbitPulse : earthFlickerY);
const scaleZ = (1.0 * (1 - m) + 0.65 * m) * (1 - m ? orbitPulse : earthFlickerX);

flameGroup.scale.set(scaleX, scaleY, scaleZ);
flameGroup.position.y = m * 0.35;

const haloColor = new THREE.Color(0x0284c7).lerp(new THREE.Color(0xd97706), m);
blueHaloMat.color.copy(haloColor);
blueHaloMat.opacity = 0.32 * (1 - m) + 0.55 * m;

const midColor = new THREE.Color(0x06b6d4).lerp(new THREE.Color(0xf59e0b), m);
blueMidMat.color.copy(midColor);
blueMidMat.opacity = 0.55 * (1 - m) + 0.75 * m;

const coreColor = new THREE.Color(0xe0f2fe).lerp(new THREE.Color(0xffedd5), m);
flameCoreMat = flameCore.material;
flameCoreMat.color.copy(coreColor);

eyeRing.rotation.z = time * 0.15;
eyeOuterRing.rotation.z = -time * 0.1;

sparkMat.opacity = m * 0.85;
if (m > 0.05) {
const pos = sparkGeo.attributes.position.array;
for (let i = 0; i < sparkCount; i++) {
sparkVelocities[i].life += delta * 1.2;
if (sparkVelocities[i].life > 1.0) {
sparkVelocities[i].life = 0.0;
pos[i*3] = (Math.random() - 0.5) * 0.25;
pos[i*3+1] = -0.3;
pos[i*3+2] = (Math.random() - 0.5) * 0.25;
} else {
pos[i*3] += sparkVelocities[i].x;
pos[i*3+1] += sparkVelocities[i].y * (1.2 + m);
pos[i*3+2] += sparkVelocities[i].z;
}
}
sparkGeo.attributes.position.needsUpdate = true;
}

renderer.render(scene, camera);
}

animate();
</script>
</body>
</html>"""
    return html
