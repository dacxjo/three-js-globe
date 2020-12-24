import * as THREE from 'https://unpkg.com/three@0.123.0/build/three.module.js';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://threejs.org/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://threejs.org/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'https://threejs.org/examples/jsm/postprocessing/GlitchPass.js';

const Globe = {
	setup() {
		const container = Vue.ref(null);
		const globe = Vue.ref(null);

		const globeRadius = 100;
		const globeWidth = 4098 / 2;
		const globeHeight = 1968 / 2;

		function hasWebGL() {
			const gl = globe.value.getContext('webgl') || globe.value.getContext('experimental-webgl');
			if (gl && gl instanceof WebGLRenderingContext) {
				return true;
			} else {
				return false;
			}
		}

		function convertFlatCoordsToSphereCoords(x, y) {
			let latitude = (x - globeWidth) / globeWidth * -180;
			let longitude = (y - globeHeight) / globeHeight * -90;
			latitude = latitude * Math.PI / 180;
			longitude = longitude * Math.PI / 180;
			const radius = Math.cos(longitude) * globeRadius;

			return {
				x: Math.cos(latitude) * radius,
				y: Math.sin(longitude) * globeRadius,
				z: Math.sin(latitude) * radius
			};
		}

		function init(points) {
			const canvas = globe.value;

			const { width, height } = container.value.getBoundingClientRect();
			// 1. Setup scene
			const scene = new THREE.Scene();
			// 2. Setup camera
			const camera = new THREE.PerspectiveCamera(45, width / height);
			// 3. Setup renderer

			const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
			renderer.setSize(width, height);

			const composer = new EffectComposer(renderer);

			const renderPass = new RenderPass(scene, camera);
			composer.addPass(renderPass);

			const glitchPass = new GlitchPass();
			composer.addPass(glitchPass);

			// Single geometry to contain all points.
			const mergedGeometry = new THREE.Geometry();
			// Material that the points will be made of.
			const pointGeometry = new THREE.SphereGeometry(0.5, 1, 1);
			const pointMaterial = new THREE.MeshBasicMaterial({
				color: '#888'
			});

			for (let point of points) {
				const { x, y, z } = convertFlatCoordsToSphereCoords(point.x, point.y, width, height);
				pointGeometry.translate(x, y, z);
				mergedGeometry.merge(pointGeometry);
				pointGeometry.translate(-x, -y, -z);
				if (x && y && z) {
					pointGeometry.translate(x, y, z);
					mergedGeometry.merge(pointGeometry);
					pointGeometry.translate(-x, -y, -z);
				}
			}

			const globeShape = new THREE.Mesh(mergedGeometry, pointMaterial);
			scene.add(globeShape);

			camera.orbitControls = new OrbitControls(camera, canvas);
			camera.orbitControls.enableKeys = false;
			camera.orbitControls.enablePan = false;
			camera.orbitControls.enableZoom = false;
			camera.orbitControls.enableDamping = false;
			camera.orbitControls.enableRotate = true;
			camera.orbitControls.autoRotate = true;
			camera.position.z = -265;

			// 4. Use requestAnimationFrame to recursively draw the scene in the DOM.
			function animate() {
				camera.orbitControls.update();
				requestAnimationFrame(animate);
				//	renderer.render(scene, camera);
				composer.render();
			}
			animate();
		}

		Vue.onMounted(() => {
			if (hasWebGL()) {
				window.fetch('./assets/points.json').then((response) => response.json()).then((data) => {
					init(data.points);
				});
			}
		});

		return {
			container,
			globe
		};
	}
};

Vue.createApp(Globe).mount('#app');
