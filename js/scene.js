// Reusable Three.js scene initializer
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

export default function initScene(containerId = 'canvas-container'){
  const container = document.getElementById(containerId);
  if(!container) throw new Error(`Container #${containerId} not found`);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071129);

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

  // Avatar / placeholder geometry
  const avatar = new THREE.Group();
  scene.add(avatar);

  const icoGeo = new THREE.IcosahedronGeometry(0.65, 4);
  const icoMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.2, roughness: 0.3 });
  const icosa = new THREE.Mesh(icoGeo, icoMat);
  avatar.add(icosa);

  const wire = new THREE.Mesh(icoGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, opacity: 0.08, transparent: true }));
  avatar.add(wire);

  const ringGeo = new THREE.TorusGeometry(0.9, 0.02, 16, 80);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.6 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.9;
  scene.add(ring);

  // Particles
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

  const pointer = { x: 0, y: 0 };
  function onPointerMove(e){
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }
  window.addEventListener('pointermove', onPointerMove);

  // Scroll-driven params
  let maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
  function recalcScroll(){ maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight); }
  window.addEventListener('resize', recalcScroll);

  // Theme colors per section id
  const themeMap = {
    experience: new THREE.Color(0x60a5fa), // blue
    research: new THREE.Color(0x34d399), // teal
    papers: new THREE.Color(0xa78bfa), // purple
    contact: new THREE.Color(0xf59e0b), // amber
    default: new THREE.Color(0x60a5fa)
  };
  let currentTheme = themeMap.default.clone();
  let targetTheme = themeMap.default.clone();

  // helper to set target theme by section id
  function setThemeForSection(id){
    targetTheme = (themeMap[id] || themeMap.default).clone();
  }

  // Section-based theme switching (scrollspy for themes)
  const sections = Array.from(document.querySelectorAll('section[id]'));
  let lastSection = null;
  function onScrollTheme(){
    const offset = window.scrollY + window.innerHeight * 0.35;
    let current = '';
    for (const s of sections) if (s.offsetTop <= offset) current = s.id;
    if (current !== lastSection){
      lastSection = current;
      setThemeForSection(current);
    }
  }
  window.addEventListener('scroll', onScrollTheme, { passive: true });
  onScrollTheme();

  // Click / pointerdown interaction: pulse avatar and spin ring
  let pulse = { value: 1, target: 1 };
  function onPointerDown(e){
    pulse.target = 1.45;
    ring.rotation.z += 0.4;
    // small temporary emissive flash
    icoMat.emissive = icoMat.emissive || new THREE.Color(0x000000);
    icoMat.emissive.setHex(0x1e293b);
    setTimeout(()=>{ if(icoMat) icoMat.emissive.setHex(0x000000); }, 160);
  }
  window.addEventListener('pointerdown', onPointerDown);

  function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onWindowResize);

  let t = 0;
  let rafId = null;
  function animate(){
    rafId = requestAnimationFrame(animate);
    t += 0.01;

    // Idle + pointer influence
    avatar.rotation.y += 0.0025 + pointer.x * 0.01;
    avatar.rotation.x = -pointer.y * 0.15 + Math.sin(t) * 0.02;
    avatar.position.y = Math.sin(t * 0.8) * 0.02;

    // Smooth pulse
    pulse.value += (pulse.target - pulse.value) * 0.14;
    if (Math.abs(pulse.target - pulse.value) < 0.01) pulse.target = 1;
    avatar.scale.setScalar(pulse.value);

    // Scroll-driven camera/parallax
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
    // map progress -> camera position and avatar scale
    camera.position.z = THREE.MathUtils.lerp(2.6, 1.6, progress);
    camera.position.y = THREE.MathUtils.lerp(0.8, -0.2, progress);
    const s = THREE.MathUtils.lerp(1, 1.12, progress);
    avatar.scale.setScalar(s * pulse.value);

    // Animate theme color towards targetTheme
    currentTheme.lerp(targetTheme, 0.03);
    icoMat.color.lerp(currentTheme, 0.06);
    pMat.color.lerp(currentTheme, 0.02);

    points.rotation.y += 0.0009 + progress * 0.002;
    ring.rotation.y += 0.0006 + progress * 0.001;

    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  function destroy(){
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('resize', recalcScroll);
    window.removeEventListener('scroll', onScrollTheme);
    controls.dispose();
    renderer.dispose();
    if(renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  }

  return { scene, camera, renderer, controls, destroy };
}
