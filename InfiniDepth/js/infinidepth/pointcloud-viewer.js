/**
 * Point Cloud Viewer using Three.js
 * Supports interactive rotation, zoom, and pan
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';

(function() {
    let scene, camera, renderer, controls, currentPointCloud;
    const container = document.getElementById('pointcloud-container');
    const loading = document.getElementById('pointcloud-loading');

    // Initialize Three.js scene
    function initPointCloudViewer() {
        console.log('Initializing Point Cloud Viewer...');

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        // Camera
        camera = new THREE.PerspectiveCamera(
            60,
            container.offsetWidth / container.offsetHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 5);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // OrbitControls - full 360 degree rotation
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = true;
        controls.minDistance = 0.5;
        controls.maxDistance = 100;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight1.position.set(1, 1, 1);
        scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight2.position.set(-1, -1, -1);
        scene.add(directionalLight2);

        // Handle window resize
        window.addEventListener('resize', onWindowResize);

        // Animation loop
        animate();

        console.log('Point Cloud Viewer initialized successfully');
    }

    function onWindowResize() {
        if (!container) return;
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    // Load PLY file
    function loadPLY(filename) {
        console.log('Loading PLY file:', filename);
        if (loading) {
            loading.style.display = 'block';
        }

        // Remove existing point cloud
        if (currentPointCloud) {
            scene.remove(currentPointCloud);
            currentPointCloud.geometry.dispose();
            if (currentPointCloud.material) currentPointCloud.material.dispose();
        }

        const loader = new PLYLoader();
        const plyPath = 'images/pub/infinidepth/pointclouds/' + filename;

        loader.load(
            plyPath,
            function(geometry) {
                console.log('PLY loaded successfully, vertices:', geometry.attributes.position.count);

                // Flip X, Y and Z axes
                const positions = geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    // positions[i] = -positions[i];         // Flip X
                    positions[i + 1] = -positions[i + 1]; // Flip Y
                    positions[i + 2] = -positions[i + 2]; // Flip Z
                }
                geometry.attributes.position.needsUpdate = true;

                // Center and scale the geometry
                geometry.computeBoundingBox();
                const center = new THREE.Vector3();
                geometry.boundingBox.getCenter(center);
                geometry.translate(-center.x, -center.y, -center.z);

                // Auto-scale to fit in view
                const size = new THREE.Vector3();
                geometry.boundingBox.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3 / maxDim;
                geometry.scale(scale, scale, scale);

                // Create material
                const material = new THREE.PointsMaterial({
                    size: 0.01,
                    vertexColors: true,
                    sizeAttenuation: true
                });

                // Create point cloud
                currentPointCloud = new THREE.Points(geometry, material);
                scene.add(currentPointCloud);

                if (loading) loading.style.display = 'none';

                // Reset camera position
                camera.position.set(0, 2, 5);
                controls.target.set(0, 0, 0);
                controls.update();
            },
            function(xhr) {
                const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
                console.log('Loading progress:', percent + '%');
                // Loading animation is handled by CSS spinner
            },
            function(error) {
                console.error('Error loading PLY:', error);
                if (loading) {
                    loading.innerHTML = '<div style="color: #ff6b6b; font-size: 1rem;">Error loading point cloud</div>';
                }
            }
        );
    }

    // Setup button controls
    function setupPLYButtons() {
        const buttons = document.querySelectorAll('.ply-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Update active button
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Load corresponding PLY file
                const plyFile = btn.dataset.ply;
                loadPLY(plyFile);
            });
        });

        // Load first PLY file by default
        if (buttons.length > 0) {
            const firstPly = buttons[0].dataset.ply;
            loadPLY(firstPly);
        }
    }

    // Initialize when Point Cloud tab is shown
    const vizBtns = document.querySelectorAll('.viz-btn[data-viz="pointcloud"]');
    vizBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Point Cloud tab clicked');
            // Delay initialization to ensure container is visible
            setTimeout(() => {
                if (!renderer) {
                    initPointCloudViewer();
                    setupPLYButtons();

                    // Load first scene from showcase if available
                    if (window.VizShowcaseConfig && window.VizShowcaseConfig.pointcloud.scenes[0]) {
                        loadPLY(window.VizShowcaseConfig.pointcloud.scenes[0].plyFile);
                    }
                } else {
                    onWindowResize();
                }
            }, 100);
        });
    });

    // Listen for showcase scene changes
    window.addEventListener('loadPointCloud', (event) => {
        if (event.detail && event.detail.plyFile && renderer) {
            loadPLY(event.detail.plyFile);
        }
    });
})();
