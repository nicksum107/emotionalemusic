import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import MODEL from './model.gltf';

class Piano extends Group {
    constructor() {
        // Call parent Group() constructor
        super();

        const loader = new GLTFLoader();

        this.name = 'piano';
        this.scale.multiplyScalar(3)
        

        loader.load(MODEL, (gltf) => {
            this.add(gltf.scene);
        });
    }
}

export default Piano;
