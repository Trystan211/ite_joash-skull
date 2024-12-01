import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/loaders/GLTFLoader.js';

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8b4513); // Dark yellow-orange
scene.fog = new THREE.Fog(0x705d3d, 5, 40); // Yellowish fog, darker atmosphere

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(20, 10, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;

// Sand Floor
const sand = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ color: 0xd2b48c }) // Sandy color
);
sand.rotation.x = -Math.PI / 2;
scene.add(sand);

// Lights
const ambientLight = new THREE.AmbientLight(0xffcc88, 0.4);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xffaa66, 0.8);
sunlight.position.set(10, 20, -5);
scene.add(sunlight);

// Load Mjolnir Model
const loader = new GLTFLoader();
let mjolnirPosition = { x: 0, y: -0.5, z: 0 };

loader.load(
  'https://trystan211.github.io/ite_joash/mjolnir_thors_hammer.glb',
  (gltf) => {
    const mjolnir = gltf.scene;
    mjolnir.position.set(mjolnirPosition.x, mjolnirPosition.y, mjolnirPosition.z);
    mjolnir.scale.set(0.01, 0.01, 0.01); // Scale appropriately for the scene
    scene.add(mjolnir);
  },
  undefined,
  (error) => console.error('Error loading Mjolnir model:', error)
);

// Small Black Stones
const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

for (let i = 0; i < 50; i++) {
  const x = Math.random() * 60 - 30;
  const z = Math.random() * 60 - 30;

  const stone = new THREE.Mesh(
    new THREE.SphereGeometry(Math.random() * 0.5, 16, 16),
    stoneMaterial
  );
  stone.position.set(x, 0.2, z);
  stone.castShadow = true; // Enable shadows for stones
  scene.add(stone);
}

// Tall Pointy Rocks with Raycasting Support
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tallRocks = []; // Store references to the pointy rocks

const rockMaterial = new THREE.MeshStandardMaterial({
  color: 0x666666,
  roughness: 0.9,
  metalness: 0.1
});

for (let i = 0; i < 10; i++) {
  const x = Math.random() * 50 - 25;
  const z = Math.random() * 50 - 25;

  const tallRock = new THREE.Mesh(
    new THREE.ConeGeometry(Math.random() * 1 + 1, Math.random() * 10 + 5, 8),
    rockMaterial.clone() // Clone material for independent control
  );
  tallRock.position.set(x, Math.random() * 2, z);
  tallRock.castShadow = true;
  tallRocks.push(tallRock);
  scene.add(tallRock);
}

// Mouse Click Handler
const handleClick = (event) => {
  // Normalize mouse position
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check for intersections
  const intersects = raycaster.intersectObjects(tallRocks);

  if (intersects.length > 0) {
    const selectedRock = intersects[0].object;

    // Store the original color and scale
    const originalColor = selectedRock.material.color.clone();
    const originalScale = selectedRock.scale.clone();

    // Change color and size
    selectedRock.material.color.set(0x444444); // Darker gray
    selectedRock.scale.multiplyScalar(1.2); // Slightly larger

    // Revert after 2 seconds
    setTimeout(() => {
      selectedRock.material.color.copy(originalColor);
      selectedRock.scale.copy(originalScale);
    }, 2000);
  }
};

// Add Event Listeners
window.addEventListener('click', handleClick);

// Yellow-Orange Orbiting Particles
const particleCount = 6000; // Number of particles
const particlesGeometry = new THREE.BufferGeometry();
const positions = [];
const velocities = [];

for (let i = 0; i < particleCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 45 + 5; // Adjusted range 5 to 50
  const y = Math.random() * 12 + 2;

  positions.push(
    Math.cos(angle) * distance + mjolnirPosition.x,
    y,
    Math.sin(angle) * distance + mjolnirPosition.z
  );
  velocities.push(0.002 * (Math.random() > 0.5 ? 1 : -1)); // Random angular velocity
}

particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
particlesGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 1));

const particlesMaterial = new THREE.PointsMaterial({
  color: 0xffaa33,
  size: 0.25,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Reduced Flickering Lights around Mjolnir
const flickeringLights = [];
const lightCount = 5; // Reduced to half
const lightRadius = 10;

for (let i = 0; i < lightCount; i++) {
  const angle = (i / lightCount) * Math.PI * 2;
  const x = mjolnirPosition.x + Math.cos(angle) * lightRadius;
  const z = mjolnirPosition.z + Math.sin(angle) * lightRadius;
  const y = mjolnirPosition.y + 2 + Math.random() * 2;

  const light = new THREE.PointLight(0x33ccff, 0, 20); // Lightning blue
  light.position.set(x, y, z);
  scene.add(light);
  flickeringLights.push(light);
}

// Animation Loop
const clock = new THREE.Clock();

const animate = () => {
  // Update particles
  const positions = particlesGeometry.attributes.position.array;
  const velocities = particlesGeometry.attributes.velocity.array;

  for (let i = 0; i < particleCount; i++) {
    const xIndex = i * 3;
    const zIndex = xIndex + 2;

    const x = positions[xIndex] - mjolnirPosition.x;
    const z = positions[zIndex] - mjolnirPosition.z;

    const angle = Math.atan2(z, x) + velocities[i];
    const distance = Math.sqrt(x * x + z * z);

    positions[xIndex] = Math.cos(angle) * distance + mjolnirPosition.x;
    positions[zIndex] = Math.sin(angle) * distance + mjolnirPosition.z;
  }
  particlesGeometry.attributes.position.needsUpdate = true;

  // Flickering light effect with dynamic positions
  flickeringLights.forEach((light) => {
    light.intensity = Math.random() * 8 + 4;

    const angle = Math.random() * Math.PI * 2;
    const radius = lightRadius * Math.random();
    light.position.set(
      mjolnirPosition.x + Math.cos(angle) * radius,
      mjolnirPosition.y + 2 + Math.random() * 2,
      mjolnirPosition.z + Math.sin(angle) * radius
    );
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

// Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
