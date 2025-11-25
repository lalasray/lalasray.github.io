// Three.js portfolio placeholder scene
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.display = 'block';
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.8, 2.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 1.2;
controls.maxDistance = 6;

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemi.position.set(0, 2, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(2, 2, 2);
scene.add(dir);

// Avatar group
const avatar = new THREE.Group();
scene.add(avatar);

const icoGeo = new THREE.IcosahedronGeometry(0.65, 4);
const icoMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.2, roughness: 0.3 });
const icosa = new THREE.Mesh(icoGeo, icoMat);
avatar.add(icosa);

// Thin wireframe overlay for style
const wire = new THREE.Mesh(icoGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, opacity: 0.08, transparent: true }));
avatar.add(wire);

// Subtle floating platform
const ringGeo = new THREE.TorusGeometry(0.9, 0.02, 16, 80);
const ringMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.6 });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
ring.position.y = -0.9;
scene.add(ring);

// Particles background
const particles = new THREE.BufferGeometry();
const count = 1400;
const positions = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  const r = 1.6 + Math.random() * 4.0;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
  positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.6;
  positions[i * 3 + 2] = Math.cos(phi) * r;
}
particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const pMat = new THREE.PointsMaterial({ color: 0xc7d2fe, size: 0.01, opacity: 0.6, transparent: true });
const points = new THREE.Points(particles, pMat);
scene.add(points);

// Interaction
const pointer = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// Animation loop
let t = 0;
function animate() {
  requestAnimationFrame(animate);
  t += 0.01;

  // gentle idle animation
  avatar.rotation.y += 0.0025 + pointer.x * 0.01;
  avatar.rotation.x = -pointer.y * 0.15 + Math.sin(t) * 0.02;
  avatar.position.y = Math.sin(t * 0.8) * 0.02;

  // subtle particle motion
  points.rotation.y += 0.0009;

  controls.update();
  renderer.render(scene, camera);
}
animate();

// Expose some debug in console
console.log('Three.js portfolio placeholder initialized');
