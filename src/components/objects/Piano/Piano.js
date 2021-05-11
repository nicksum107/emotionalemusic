import { Mesh } from 'three';
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
        
        let p = this 
        
        var temp 

        loader.load(MODEL, (gltf) => {
            // this.add(gltf.scene);
            gltf.scene.traverse(function(child) {
                if (child instanceof Mesh) {
                    // console.log(child)
                    p.mesh = child
                    temp = child 
                    p.add(child)
                }
            });
        });

        // console.log(temp)
        // this.add(temp)
    }
}

export default Piano;
