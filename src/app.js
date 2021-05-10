/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3, AudioListener } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MusicScene } from 'scenes';

console.log(window)
// Initialize core ThreeJS components
const camera = new PerspectiveCamera(); 
const audiolist = new AudioListener()
camera.add(audiolist)
const scene = new MusicScene(camera, audiolist, window);
const renderer = new WebGLRenderer({ antialias: true });

// Set up camera
camera.position.set(-7, 10, 11);
camera.lookAt(new Vector3(0, 30, 0));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

// Set up controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 4;
controls.maxDistance = 20;
controls.update();

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    controls.update();
    renderer.render(scene, camera);
    scene.update && scene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);

const keyDownHandler = function(event) {
    scene.keyDownHandler(event)
}
window.addEventListener('keydown', keyDownHandler, false);

