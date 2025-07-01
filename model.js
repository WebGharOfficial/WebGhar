import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let camera, scene, renderer, controls;

// Mobile detection function
function isMobile() {
    return window.innerWidth <= 700 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

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

    // Controls with mobile-specific settings
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true; // Add auto-rotation
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = false; // Disable zoom
    
    // Mobile-specific controls
    if (isMobile()) {
        // Lock vertical rotation on mobile - only allow horizontal rotation
        controls.minPolarAngle = Math.PI / 2; // 90 degrees
        controls.maxPolarAngle = Math.PI / 2; // 90 degrees
        controls.enablePan = false; // Disable panning on mobile
        controls.autoRotateSpeed = 0.3; // Slower rotation on mobile
        controls.enableDamping = true;
        controls.dampingFactor = 0.05; // Smoother damping on mobile
        
        // Allow page scrolling when not interacting with the model
        controls.enableKeys = false;
        controls.screenSpacePanning = false;
        
        // Set default mobile view to be angled from slightly above
        camera.position.y = 0.8; // Position camera slightly above
        camera.position.z = 2.5; // Slightly closer for better mobile view
        controls.target.set(0, 0.2, 0); // Look slightly above center
        
        // Mobile-specific touch handling for page scrolling
        let startY = null;
        let startX = null;
        let isVerticalScroll = false;

        renderer.domElement.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
                startY = e.touches[0].clientY;
                startX = e.touches[0].clientX;
                isVerticalScroll = false;
                controls.enabled = true;
            }
        });

        renderer.domElement.addEventListener('touchmove', function(e) {
            if (e.touches.length === 1 && startY !== null && startX !== null) {
                const deltaY = Math.abs(e.touches[0].clientY - startY);
                const deltaX = Math.abs(e.touches[0].clientX - startX);
                // If vertical movement is greater than horizontal, treat as scroll
                if (deltaY > deltaX && deltaY > 8) {
                    controls.enabled = false; // Let the page scroll
                    isVerticalScroll = true;
                } else if (!isVerticalScroll) {
                    controls.enabled = true; // Allow model rotation
                }
            }
        });

        renderer.domElement.addEventListener('touchend', function(e) {
            controls.enabled = true; // Re-enable after touch ends
            startY = null;
            startX = null;
            isVerticalScroll = false;
        });
    } else {
        // Desktop controls - allow full rotation
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI;
        controls.enablePan = true;
        controls.autoRotateSpeed = 0.5;
        controls.dampingFactor = 0.05;
    }

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
            model.position.y -= sizeVec.y * -0.3; // Move up by 18% of height
            
            // Scale model and adjust camera to fit
            const size = box.getSize(new THREE.Vector3()).length();
            const fov = camera.fov * (Math.PI / 180);
            const cameraZ = Math.abs(size / 2 / Math.tan(fov / 2));
            
            if (isMobile()) {
                // Mobile-specific camera positioning
                camera.position.z = cameraZ * 0.5; // Closer for mobile
                camera.position.y = cameraZ * 0.3; // Higher angle for mobile
                controls.target.set(0, 2, 0); // Look slightly above center
            } else {
                // Desktop camera positioning
                camera.position.z = cameraZ * 0.6; // Zoom in even more
                camera.position.y = cameraZ * 0.23; // Slightly above the model
                controls.target.set(0, 0, 0); // Look at the center
            }
            
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

    // Handle window resize with mobile detection
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    const container = document.getElementById('model-container');
    if (!container || !camera || !renderer) return;

    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    
    // Update controls for mobile/desktop switch
    if (controls) {
        if (isMobile()) {
            // Lock vertical rotation on mobile
            controls.minPolarAngle = Math.PI / 2;
            controls.maxPolarAngle = Math.PI / 2;
            controls.enablePan = false;
            controls.autoRotateSpeed = 0.3;
            controls.enableKeys = false;
            controls.screenSpacePanning = false;
            
            // Maintain mobile camera angle
            camera.position.y = 0.8;
            controls.target.set(0, 0.2, 0);
        } else {
            // Allow full rotation on desktop
            controls.minPolarAngle = 0;
            controls.maxPolarAngle = Math.PI;
            controls.enablePan = true;
            controls.autoRotateSpeed = 0.5;
            controls.enableKeys = true;
            controls.screenSpacePanning = true;
            
            // Reset to desktop camera angle
            camera.position.y = 0.23;
            controls.target.set(0, 0, 0);
        }
        controls.update();
    }
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