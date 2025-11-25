import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

export default function initScene(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Container not found:', containerId);
    return;
  }

  console.log('Initializing scene...');

  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a14);
  scene.fog = new THREE.Fog(0x0a0a14, 15, 100);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);
  camera.lookAt(0, 1, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowShadowMap;
  renderer.shadowMap.autoUpdate = true;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;
  controls.target.set(0, 1, 0);

  // small reusable vector for animations/controls
  const v0 = new THREE.Vector3();

  // GUI / TransformControls / Stats
  const conf = {
    followSphere: true,
    showTransform: true
  };

  let transformControls = null;
  let stats = null;
  let gui = null;
  let targetSphere = null;

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 8, 4);
  dirLight.castShadow = true;
  dirLight.shadow.camera.left = -10;
  dirLight.shadow.camera.right = 10;
  dirLight.shadow.camera.top = 10;
  dirLight.shadow.camera.bottom = -10;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  // Floor
  const floorGeo = new THREE.PlaneGeometry(20, 20);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Realistic Desk/Table
  const deskGroup = new THREE.Group();
  deskGroup.position.y = 0;

  // Desk top - larger, more realistic
  const deskTopGeo = new THREE.BoxGeometry(3.5, 0.08, 2.2);
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b6f47,
    roughness: 0.4,
    metalness: 0.05
  });
  const deskTop = new THREE.Mesh(deskTopGeo, woodMat);
  deskTop.position.y = 0.9;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  // Desk legs - four sturdy legs
  const legGeo = new THREE.BoxGeometry(0.12, 0.9, 0.12);
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.6,
    metalness: 0.2
  });

  const legPositions = [[-1.6, 0.45, -1], [1.6, 0.45, -1], [-1.6, 0.45, 1], [1.6, 0.45, 1]];
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(...pos);
    leg.castShadow = true;
    leg.receiveShadow = true;
    deskGroup.add(leg);
  });

  // Desk drawer handles (small details)
  const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 0.95, -1.05);
  handle.castShadow = true;
  deskGroup.add(handle);

  scene.add(deskGroup);

  // Realistic folder/document models
  const files = [];
  const fileConfig = [
    { name: 'profile', x: -1.2, z: 0.4, color: 0xe879f9, label: 'Profile' },
    { name: 'experience', x: -0.3, z: 0.4, color: 0x60a5fa, label: 'Experience' },
    { name: 'research', x: 0.6, z: 0.4, color: 0x34d399, label: 'Research' },
    { name: 'papers', x: 1.4, z: 0.4, color: 0xa78bfa, label: 'Papers' },
    { name: 'contact', x: 0.6, z: -0.5, color: 0xf59e0b, label: 'Contact' }
  ];

  function createRealisticFolder(name, color) {
    const group = new THREE.Group();

    // Folder back cover
    const backGeo = new THREE.BoxGeometry(0.5, 0.6, 0.02);
    const folderMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.1,
      emissive: 0x000000
    });
    const back = new THREE.Mesh(backGeo, folderMat);
    back.position.z = -0.01;
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);

    // Folder front cover (slightly offset)
    const front = new THREE.Mesh(backGeo, folderMat);
    front.position.z = 0.01;
    front.castShadow = true;
    front.receiveShadow = true;
    group.add(front);

    // Folder tab
    const tabGeo = new THREE.BoxGeometry(0.3, 0.12, 0.02);
    const tab = new THREE.Mesh(tabGeo, folderMat);
    tab.position.set(0.05, 0.3, 0.02);
    tab.castShadow = true;
    group.add(tab);

    // Label with text on canvas
    const labelTexture = createCanvasTexture(name.charAt(0).toUpperCase() + name.slice(1), '#' + color.toString(16).padStart(6, '0'));
    const labelGeo = new THREE.PlaneGeometry(0.4, 0.3);
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.z = 0.02;
    group.add(label);

    return group;
  }

  function createCanvasTexture(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.fillStyle = color || '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  fileConfig.forEach(config => {
    const folder = createRealisticFolder(config.name, config.color);
    folder.position.set(config.x, 0.98, config.z);
    folder.castShadow = true;
    folder.receiveShadow = true;
    folder.userData.sectionName = config.name;
    folder.userData.basePos = { x: config.x, y: 0.98, z: config.z };
    scene.add(folder);
    files.push(folder);
  });

  // Raycaster for click detection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let selectedFile = null;
  let pickupAnimation = { active: false, progress: 0, file: null };

  function onMouseClick(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(files, true);

    console.log('Click at', { clientX: e.clientX, clientY: e.clientY }, 'Intersects:', intersects.length, 'Animation active:', pickupAnimation.active);

    if (intersects.length > 0 && !pickupAnimation.active) {
      let file = intersects[0].object;
      while (file.parent && !files.includes(file)) {
        file = file.parent;
      }
      if (files.includes(file)) {
        selectedFile = file;
        pickupAnimation.active = true;
        pickupAnimation.progress = 0;
        pickupAnimation.file = selectedFile;
        console.log('Pickup animation started for:', selectedFile.userData.sectionName);
      }
    }
  }
  window.addEventListener('click', onMouseClick);

  // Particles background
  const particles = new THREE.BufferGeometry();
  const count = 600;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 6 + Math.random() * 8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.5 + 2;
    positions[i * 3 + 2] = Math.cos(phi) * r;
  }
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xc7d2fe, size: 0.04, opacity: 0.3, transparent: true });
  const points = new THREE.Points(particles, pMat);
  scene.add(points);

  // Draggable target sphere and UI
  targetSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.6, roughness: 0.2 })
  );
  // place it slightly above the desk near the folders (keep its height fixed)
  targetSphere.position.set(0.6, 1.05, 0.4);
  const _fixedSphereY = targetSphere.position.y; // clamp Y (height) to this value
  targetSphere.name = 'target_sphere';
  targetSphere.castShadow = true;
  targetSphere.receiveShadow = true;
  scene.add(targetSphere);

  // TransformControls for dragging the sphere (smaller, styled)
  transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.attach(targetSphere);
  // Force translate-only mode and configure gizmo to allow plane movement (XZ)
  transformControls.setMode('translate');
  transformControls.size = 0.45;
  transformControls.visible = true;
  // We'll hide individual axis handles and expose the XZ plane only (so movement is always X+Z)
  transformControls.showX = false;
  transformControls.showY = false;
  transformControls.showZ = false;
  transformControls.addEventListener('dragging-changed', function (event) {
    controls.enabled = !event.value;
  });
  scene.add(transformControls);

  // Tidy up appearance of the gizmo: axis-colored, semi-transparent and subtle
  try {
    transformControls.traverse(node => {
      const name = (node.name || '').toLowerCase();

      // Show only XZ plane handles, hide single-axis handles
      if (name.includes('x') && !name.includes('xz')) {
        node.visible = false;
      }
      if (name.includes('y') && !name.includes('xy') && !name.includes('yz')) {
        node.visible = false;
      }
      if (name.includes('z') && !name.includes('xz')) {
        node.visible = false;
      }

      // If this is the XZ plane handle, make it visible and style it
      if (name.includes('xz') || name.includes('xzplane') || name.includes('plane')) {
        node.visible = true;
        if (node.material && node.material.color) node.material.color.set(0x4d6bff);
        if (node.material) { node.material.transparent = true; node.material.opacity = 0.45; }
      }

      // thin out lines
      if ((node.isLine || node.type === 'LineSegments') && node.material) {
        node.material.opacity = 0.5;
        node.material.transparent = true;
      }
      // slightly scale down helper meshes for a neater look
      if (node.isMesh && node.name && node.name.toLowerCase().includes('gizmo')) {
        node.scale.setScalar(0.9);
      }
    });
  } catch (e) {
    console.warn('Could not style transformControls:', e);
  }

  // Highlighting and proximity helpers
  function clearHighlights() {
    files.forEach(f => {
      f.scale.set(1,1,1);
    });
  }

  function highlightNearestSphere() {
    if (!targetSphere) return;
    let nearest = null;
    let nd = Infinity;
    files.forEach(f => {
      const p = f.userData.basePos || f.position;
      const d = targetSphere.position.distanceTo(new THREE.Vector3(p.x, p.y, p.z));
      if (d < nd) { nd = d; nearest = f; }
    });
    clearHighlights();
    if (nearest && nd < 0.35) {
      nearest.scale.set(1.08,1.08,1.08);
    }
    return { nearest, distance: nd };
  }

  // On object change (while dragging) highlight nearest and clamp Y (height)
  transformControls.addEventListener('objectChange', () => {
    // clamp Y so sphere only moves in X/Z plane
    if (targetSphere) targetSphere.position.y = _fixedSphereY;
    highlightNearestSphere();
  });

  // When dragging stops, if sphere is close to a folder, trigger pickup and open modal
  transformControls.addEventListener('dragging-changed', function (event) {
    controls.enabled = !event.value;
    if (!event.value) {
      // drag ended
      const res = highlightNearestSphere();
      if (res && res.nearest && res.distance < 0.35 && !pickupAnimation.active) {
        // start pickup animation for that file
        pickupAnimation.file = res.nearest;
        pickupAnimation.active = true;
        pickupAnimation.progress = 0;
        console.log('Sphere dropped on folder, opening:', res.nearest.userData.sectionName);
      }
    }
  });

  // GUI
  try {
    gui = new GUI();
    gui.add(conf, 'followSphere').name('follow sphere');
    gui.add(conf, 'showTransform').name('show transform').onChange(v => { transformControls.visible = v; });
    // hide GUI by default (controls window shouldn't be visible)
    try { gui.domElement.style.display = 'none'; } catch(e) { /* ignore */ }
  } catch (e) {
    console.warn('GUI not available:', e);
  }

  // Stats
  try {
    stats = new Stats();
    document.body.appendChild(stats.dom);
  } catch (e) {
    console.warn('Stats not available:', e);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onWindowResize);

  // Animation loop
  let t = 0;
  let rafId = null;
  function animate() {
    rafId = requestAnimationFrame(animate);
    t += 0.016;

    // Character animation - play model animations if available
    // (removed - character model no longer loaded)

    // File pickup animation
    if (pickupAnimation.active) {
      pickupAnimation.progress = Math.min(1, pickupAnimation.progress + 0.05);
      const file = pickupAnimation.file;
      const base = file.userData.basePos;

      // Animate file upward and rotate
      const pickupHeight = 2.5;
      file.position.y = base.y + pickupAnimation.progress * (pickupHeight - base.y);
      file.rotation.x += 0.08;
      file.rotation.y += 0.12;

      // When animation complete, trigger modal
      if (pickupAnimation.progress >= 1) {
        pickupAnimation.active = false;
        const modal = document.getElementById('content-modal');
        if (modal) {
          const sectionName = file.userData.sectionName;
          window.showModal(sectionName);
          setTimeout(() => {
            file.position.set(base.x, base.y, base.z);
            file.rotation.set(0, 0, 0);
          }, 200);
        }
      }
    }

    // Rotate particles slowly
    points.rotation.y += 0.0002;

    // If followSphere is enabled, lerp orbit target toward the sphere
    if (conf.followSphere && targetSphere) {
      targetSphere.getWorldPosition(v0);
      controls.target.lerp(v0, 0.1);
    }

    controls.update();
    renderer.render(scene, camera);

    if (stats) stats.update();
  }
  animate();

  function destroy() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('click', onMouseClick);
    controls.dispose();
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  }

  return { scene, camera, renderer, controls, destroy };
}

// Modal management
function showModal(sectionName) {
  const modal = document.getElementById('content-modal');
  const title = document.getElementById('modal-title');
  const content = document.getElementById('modal-content');

  const sectionMap = {
    profile: { title: 'Your Profile', id: 'profile' },
    experience: { title: 'Experience', id: 'experience' },
    research: { title: 'Research', id: 'research' },
    papers: { title: 'Papers', id: 'papers' },
    contact: { title: 'Contact', id: 'contact' }
  };

  const section = sectionMap[sectionName];
  if (!section) return;

  title.textContent = section.title;

  const pageSection = document.getElementById(section.id);
  if (pageSection) {
    const heroInner = pageSection.querySelector('.hero__inner') || pageSection.querySelector('.card');
    if (heroInner) content.innerHTML = heroInner.innerHTML;
  }

  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('content-modal');
  modal.classList.remove('active');
}

window.showModal = showModal;
window.closeModal = closeModal;
