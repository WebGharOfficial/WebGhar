import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let camera, scene, renderer, controls;

function init() {
    const container = document.getElementById('model-container');
    if (!container) {
        console.error("The #model-container div was not found in the HTML.");
        return;
    }

    // Add loading indicator
    container.innerHTML = '<div class="model-loading">Loading 3D Model...</div>';

    // Scene setup
    scene = new THREE.Scene();
    
    // Camera - zoomed in slightly
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.z = 3; // Closer than before (was 5)

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true; // Add auto-rotation
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = false; // Disable zoom

    // Load 3D model
    const loader = new GLTFLoader();
    loader.load(
        'models/boudhanath_stupa_-_pointcloud.glb',
        (gltf) => {
            const model = gltf.scene;
            
            // Apply black material overlay to invert colors
            model.traverse((child) => {
                if (child.isMesh) {
                    // Create a solid black material
                    const blackMaterial = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        transparent: false,
                        opacity: 1.0
                    });
                    
                    // Apply the black material
                    child.material = blackMaterial;
                }
            });
            
            // Center the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);

            // Offset model upward so the base is visible
            const sizeVec = box.getSize(new THREE.Vector3());
            model.position.y -= sizeVec.y * 0.18; // Move up by 18% of height
            
            // Scale model and adjust camera to fit
            const size = box.getSize(new THREE.Vector3()).length();
            const fov = camera.fov * (Math.PI / 180);
            const cameraZ = Math.abs(size / 2 / Math.tan(fov / 2));
            
            camera.position.z = cameraZ * 0.6; // Zoom in even more
            
            controls.update();
            scene.add(model);
            
            // Remove loading indicator
            const loadingDiv = container.querySelector('.model-loading');
            if (loadingDiv) {
                loadingDiv.remove();
            }
        },
        (progress) => {
            // Show loading progress
            const loadingDiv = container.querySelector('.model-loading');
            if (loadingDiv) {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                loadingDiv.textContent = `Loading 3D Model... ${percent}%`;
            }
        },
        (error) => {
            console.error('An error happened while loading the model:', error);
            const container = document.getElementById('model-container');
            if (container) {
                container.innerHTML = '<div class="model-loading" style="color: #ff6b6b;">Error loading 3D model. Please refresh the page.</div>';
            }
        }
    );

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    const container = document.getElementById('model-container');
    if (!container || !camera || !renderer) return;

    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

// Start everything
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
animate(); 