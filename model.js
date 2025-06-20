import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
const container = document.getElementById('model-container');
const containerWidth = container.offsetWidth;
const containerHeight = container.offsetHeight;
const camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(containerWidth, containerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Camera position
camera.position.z = 5;

// Load 3D model
const loader = new GLTFLoader();
let loadedModel = null;
let baseCameraZ = camera.position.z;

loader.load(
    'models/boudhanath_stupa_-_pointcloud.glb',
    function (gltf) {
        const model = gltf.scene;
        scene.add(model);
        loadedModel = model;

        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Adjust camera to fit model
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
        camera.position.z = cameraZ * 1.5;
        baseCameraZ = camera.position.z;
        controls.target.set(0, 0, 0);
        controls.update();
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error happened:', error);
    }
);

// Scroll-based interaction
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY || window.pageYOffset;
    // Rotate model if loaded
    if (loadedModel) {
        loadedModel.rotation.y = scrollY * 0.005;
    }
    // Zoom camera in/out
    camera.position.z = baseCameraZ - scrollY * 0.01;
    camera.position.z = Math.max(camera.position.z, 2); // Prevent too close
    controls.update();
});

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth, containerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate(); 