import { CylinderGeometry } from 'three';
import { MeshBasicMaterial } from 'three';
import { Vector3 } from 'three';
import { Mesh } from 'three';
import { Object3D } from 'three';

import { AudioLoader } from 'three';
import { PositionalAudio } from 'three';
import drumsound from '../../sounds/percussion/drum.mp3'

const RADIAL_SEGMENTS = 32;
const HEIGHT_SEGMENTS = 1;
const NUM_SOUNDS = 15;
class Drum extends Object3D {
    constructor(parent, radiusBottom, radiusTop, height, position) {
        super()

        let d = this 
        
        // Create mesh
        this.radiusTop = radiusTop;
        const geometry = new CylinderGeometry(radiusTop, radiusBottom, height, RADIAL_SEGMENTS, HEIGHT_SEGMENTS);
        // Set colors (random on the outsides, drum-ish color on the top and bottom)
        for (let i = 0; i < geometry.faces.length; i++) {
            if (i < 2 * RADIAL_SEGMENTS * HEIGHT_SEGMENTS) {
                geometry.faces[i].color.setHex(Math.random() * 0xffffff)
            } else {
                geometry.faces[i].color.setHex(0xf1f2eb)
            }
        }
        const material = new MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
        this.mesh = new Mesh(geometry, material);
        this.mesh.position.copy(position);
        parent.add(this.mesh)
        
        // No need to add to update list or initialize physical values because this is a fixed object
        this.scene = parent

        // Load audio
        this.sounds = new Array(NUM_SOUNDS)
        const audioLoader = new AudioLoader()
        for (let i = 0; i < this.sounds.length; i++) {
            this.sounds[i] = new PositionalAudio(parent.audiolist)
            audioLoader.load(drumsound, function(buffer){
                d.sounds[i].setBuffer(buffer)
                d.sounds[i].setRefDistance(20)
                // k.sounds[i].detune = -1200
                // k.sounds[i].setPlaybackRate(2)
                // k.sounds[i].duration = 1 // Cut off sound at 1 second
            })
            
        }
    }

    playsound(velocity) {
        // velocity = -6 = 1
        // change sound volume wrt velocity
        // let scaledvel = -1 * velocity.y - 5 incorrect
        // console.log(velocity)
        for (let s of this.sounds){ 
            if (!s.isPlaying) {
                // volume goes from 0 to 20 without sounding bad
                // console.log(scaledvel, s.getVolume())

                s.setVolume(-1 * velocity.y * 6)
                s.play()
                break 
            }
        }        
    }
}

export default Drum
