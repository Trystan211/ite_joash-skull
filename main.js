import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js";

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a); // Deep dark blue for spookiness
scene.fog = new THREE.FogExp2(0x050505, 0.015); // Fog for a misty atmosphere

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);
scene.add(camera);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Dynamic Flickering Light
const dynamicLight = new THREE.PointLight(0x00ff44, 2, 50); // Eerie green light
dynamicLight.position.set(0, 10, 0);
scene.add(dynamicLight);

// Revolving White Light
const revolvingLight = new THREE.PointLight(0xffffff, 1, 30); // White light
revolvingLight.position.set(0, 5, 0); // Initial position
scene.add(revolvingLight);

// Ocean Geometry
const geometry = new THREE.PlaneGeometry(75, 75, 300, 300);
geometry.rotateX(-Math.PI / 2);

// Gooey Acid Shader Material
const oceanMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        waveHeight: { value: 1.2 }, // Adjusted for gooey texture
        waveFrequency: { value: 1.0 },
        deepColor: { value: new THREE.Color(0x002200) }, // Dark acid green
        glowColor: { value: new THREE.Color(0x00ff00) }, // Bright acid green
    },
    vertexShader: `
        uniform float time;
        uniform float waveHeight;
        uniform float waveFrequency;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 pos = position;
            pos.y += sin(pos.x * waveFrequency + time) * waveHeight * 0.8;
            pos.y += cos(pos.z * waveFrequency + time * 1.5) * waveHeight * 0.8;
            pos.y += sin((pos.x + pos.z) * waveFrequency + time * 0.5) * waveHeight * 0.5;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 deepColor;
        uniform vec3 glowColor;
        varying vec3 vPosition;
        void main() {
            float intensity = abs(sin(vPosition.y * 10.0));
            vec3 color = mix(deepColor, glowColor, intensity * 0.5);
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    transparent: true,
});

// Add Gooey Ocean Mesh
const ocean = new THREE.Mesh(geometry, oceanMaterial);
scene.add(ocean);

// Load Skeleton Model
const loader = new GLTFLoader();
let skeleton = null;
loader.load(
    'https://trystan211.github.io/ite_joash-skull/low_poly_skull.glb',
    (gltf) => {
        skeleton = gltf.scene;
        skeleton.position.set(1, -3.5, 1);
        scene.add(skeleton);
        skeleton.scale.set(6, 6, 6);
    },
    undefined,
    (error) => console.error("Error loading skeleton:", error)
);

// Rain Geometry
const rainCount = 10000;
const rainGeometry = new THREE.BufferGeometry();
const rainPositions = [];
const rainVelocities = [];

for (let i = 0; i < rainCount; i++) {
    const x = (Math.random() - 0.5) * 100;
    const y = Math.random() * 50;
    const z = (Math.random() - 0.5) * 100;
    rainPositions.push(x, y, z);
    rainVelocities.push(-0.3 - Math.random() * 0.5);
}

rainGeometry.setAttribute("position", new THREE.Float32BufferAttribute(rainPositions, 3));

// Acid Rain Material
const rainMaterial = new THREE.PointsMaterial({
    color: 0x00ff44, // Neon acid green
    size: 0.1,
    transparent: true,
    opacity: 0.6,
});

// Add Acid Rain Particles
const rain = new THREE.Points(rainGeometry, rainMaterial);
scene.add(rain);

// Animation Loop
const clock = new THREE.Clock();
function animate() {
    const elapsedTime = clock.getElapsedTime();

    // Update Ocean
    oceanMaterial.uniforms.time.value = elapsedTime;

    // Update Rain
    const positions = rain.geometry.attributes.position.array;
    for (let i = 0; i < rainCount; i++) {
        positions[i * 3 + 1] += rainVelocities[i];
        if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 50;
        }
    }
    rain.geometry.attributes.position.needsUpdate = true;

    // Flickering Light
    dynamicLight.intensity = 2 + Math.sin(elapsedTime * 10) * 0.5;

    // Revolving Light Movement
    const lightRadius = 8; // Distance from the skull
    revolvingLight.position.x = Math.sin(elapsedTime) * lightRadius + (skeleton ? skeleton.position.x : 0);
    revolvingLight.position.z = Math.cos(elapsedTime) * lightRadius + (skeleton ? skeleton.position.z : 0);
    revolvingLight.position.y = 3 + Math.sin(elapsedTime * 2); // Subtle up-down motion

    // Move Skeleton
    if (skeleton) {
        skeleton.position.x = Math.sin(elapsedTime) * 2;
        skeleton.position.z = Math.cos(elapsedTime) * 2;
    }

    // Render Scene
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Handle Resizing
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
