import { Mesh } from 'three';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import MODEL from './model.gltf';
import knock from '../../sounds/knock.mp3'
import { AudioLoader } from 'three';
import { PositionalAudio } from 'three';
class Piano extends Group {
    constructor(audiolist) {
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
                // only add the mesh
                if (child instanceof Mesh) {
                    p.mesh = child
                    temp = child 
                    p.add(child)
                }
            });
        });
        this.sounds = new Array(15)
        const audioLoader = new AudioLoader()
        for (let i = 0; i < this.sounds.length; i++) {
            this.sounds[i] = new PositionalAudio(audiolist)
            
            audioLoader.load(knock, function(buffer){
                p.sounds[i].setBuffer(buffer)
                p.sounds[i].setRefDistance(20)
                p.sounds[i].duration = 0.7 // Cut off sound at 0.7 seconds
            })
        }
    }
    playsound(velocity) {
        for (let s of this.sounds){ 
            if (!s.isPlaying) {
                // volume goes from 0 to 20 without sounding bad
                // console.log(scaledvel, s.getVolume())

                s.setVolume(-1 * velocity.length() *1)
                s.play()
                break 
            }
        }
    }
}

export default Piano;
