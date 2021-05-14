import { BoxGeometry } from 'three';
import { MeshBasicMaterial } from 'three';
import { AudioLoader } from 'three';
import { Object3D } from 'three';
import { Plane } from 'three';
import { PositionalAudio } from 'three';
import { Vector3 } from 'three';
import { Mesh } from 'three';
import { Group } from 'three';

// Yucky webpack imports
// A
import a2 from '../../sounds/notes/a2.mp3'
import as2 from '../../sounds/notes/a-2.mp3'
import a3 from '../../sounds/notes/a3.mp3'
import as3 from '../../sounds/notes/a-3.mp3'
import a4 from '../../sounds/notes/a4.mp3'
import as4 from '../../sounds/notes/a-4.mp3'
import a5 from '../../sounds/notes/a5.mp3'
import as5 from '../../sounds/notes/a-5.mp3'
// B
import b2 from '../../sounds/notes/b2.mp3'
import b3 from '../../sounds/notes/b3.mp3'
import b4 from '../../sounds/notes/b4.mp3'
import b5 from '../../sounds/notes/b5.mp3'
// C
import c2 from '../../sounds/notes/c2.mp3'
import cs2 from '../../sounds/notes/c-2.mp3'
import c3 from '../../sounds/notes/c3.mp3'
import cs3 from '../../sounds/notes/c-3.mp3'
import c4 from '../../sounds/notes/c4.mp3'
import cs4 from '../../sounds/notes/c-4.mp3'
import c5 from '../../sounds/notes/c5.mp3'
import cs5 from '../../sounds/notes/c-5.mp3'
// D
import d2 from '../../sounds/notes/d2.mp3'
import ds2 from '../../sounds/notes/d-2.mp3'
import d3 from '../../sounds/notes/d3.mp3'
import ds3 from '../../sounds/notes/d-3.mp3'
import d4 from '../../sounds/notes/d4.mp3'
import ds4 from '../../sounds/notes/d-4.mp3'
import d5 from '../../sounds/notes/d5.mp3'
import ds5 from '../../sounds/notes/d-5.mp3'
// E
import e2 from '../../sounds/notes/e2.mp3'
import e3 from '../../sounds/notes/e3.mp3'
import e4 from '../../sounds/notes/e4.mp3'
import e5 from '../../sounds/notes/e5.mp3'
// F
import f2 from '../../sounds/notes/f2.mp3'
import fs2 from '../../sounds/notes/f-2.mp3'
import f3 from '../../sounds/notes/f3.mp3'
import fs3 from '../../sounds/notes/f-3.mp3'
import f4 from '../../sounds/notes/f4.mp3'
import fs4 from '../../sounds/notes/f-4.mp3'
import f5 from '../../sounds/notes/f5.mp3'
import fs5 from '../../sounds/notes/f-5.mp3'
// G
import g2 from '../../sounds/notes/g2.mp3'
import gs2 from '../../sounds/notes/g-2.mp3'
import g3 from '../../sounds/notes/g3.mp3'
import gs3 from '../../sounds/notes/g-3.mp3'
import g4 from '../../sounds/notes/g4.mp3'
import gs4 from '../../sounds/notes/g-4.mp3'
import g5 from '../../sounds/notes/g5.mp3'
import gs5 from '../../sounds/notes/g-5.mp3'

// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import MODEL from './model.gltf';
const GRAVITY = -5
const K = 50
const DAMPING = 0.01
const EPS = 0.00001
const KEY_MASS = 4.5
const PLAY_DISTANCE = 0.04;
// Webpack stuff
const KEY_NAME_TO_FILENAME_MAP = {
    'a2': a2,
    'a-2': as2,
    'a3': a3,
    'a-3': as3,
    'a4': a4,
    'a-4': as4,
    'a5': a5,
    'a-5': as5,
    // B
    'b2': b2,
    'b3': b3,
    'b4': b4,
    'b5': b5,
    // C
    'c2': c2,
    'c-2': cs2,
    'c3': c3,
    'c-3': cs3,
    'c4': c4,
    'c-4': cs4,
    'c5': c5,
    'c-5': cs5,
    // D
    'd2': d2,
    'd-2': ds2,
    'd3': d3,
    'd-3': ds3,
    'd4': d4,
    'd-4': ds4,
    'd5': d5,
    'd-5': ds5,
    // E
    'e2': e2,
    'e3': e3,
    'e4': e4,
    'e5': e5,
    // F
    'f2': f2,
    'f-2': fs2,
    'f3': f3,
    'f-3': fs3,
    'f4': f4,
    'f-4': fs4,
    'f5': f5,
    'f-5': fs5,
    // G
    'g2': g2,
    'g-2': gs2,
    'g3': g3,
    'g-3': gs3,
    'g4': g4,
    'g-4': gs4,
    'g5': g5,
    'g-5': gs5,
}
class Key extends Object3D {
    constructor(octave, note, name, audiolist) {
        super()
        let k = this 
        this.octave = octave
        this.note = note
        this.name = name + String(octave);

        // need rotating sounds to play multiple of this note at the same time
        this.sounds = new Array(15)
        
        const audioLoader = new AudioLoader()
        for (let i = 0; i < this.sounds.length; i++) {
            this.sounds[i] = new PositionalAudio(audiolist)
            if (octave >= 2 && octave <= 5) {
                // console.log('/src/notes/'+name+String(octave)+'.mp3')
                audioLoader.load(KEY_NAME_TO_FILENAME_MAP[name + String(octave)], function(buffer){
                    k.sounds[i].setBuffer(buffer)
                    k.sounds[i].setRefDistance(20)
                    // k.sounds[i].detune = -1200
                    // k.sounds[i].setPlaybackRate(2)
                    k.sounds[i].duration = 0.7 // Cut off sound at 0.7 seconds
                })
            }
        }
        this.prevTime = -1
        this.mass = KEY_MASS

        this.forces = new Vector3(0, GRAVITY * this.mass, 0)
        this.addnVelocity = new Vector3() // velocity from collisions
        this.prevVelocity = new Vector3()
    }
    updateForces() {
        // update all forces on the key
        this.forces = new Vector3(0, GRAVITY * this.mass, 0)

        let vab = new Vector3().add(this.restPosition).sub(this.mesh.position)

        this.forces.add(vab.multiplyScalar(K))

        if (this.forces.length() < EPS) {
            this.forces = new Vector3()
        }
    }
    update(timeStamp) {
        this.updateForces()

        if (this.prevTime == -1) {
            this.prevTime = timeStamp 
            this.previous = this.mesh.position
            return
        }
        
        let deltaT = (timeStamp-this.prevTime)/1000 // ms
        this.prevTime = timeStamp
        
        this.prevVelocity.add(this.addnVelocity);
        // Newton's method
        let diff = this.prevVelocity.clone().multiplyScalar(deltaT);
        if (diff.length() < EPS) diff = new Vector3(); // Floating point weirdness
        this.previous = this.mesh.position.clone()
        this.mesh.position.add(diff)

        // play sound when derivative passes
        if (this.previous.y > this.playY && 
            this.mesh.position.y < this.playY) {
            let velocity = new Vector3().add(diff).divideScalar(deltaT)
            this.playsound(velocity)
        }

        // Compute new Velocity
        const newVelocity = this.prevVelocity.clone().add(this.forces.clone().multiplyScalar(deltaT / this.mass))
        this.prevVelocity = newVelocity;
        this.addnVelocity = new Vector3()


        // clamp the y coordinate 
        if (this.mesh.position.y >= this.maxY) {
            this.mesh.position.y = this.maxY - EPS;
            this.prevVelocity.y = 0;
        } else if (this.mesh.position.y <= this.minY) {
            this.mesh.position.y = this.minY + EPS;
            if (this.prevVelocity.y < 0) this.prevVelocity.y = 0;
        }
    }
    playsound(velocity) {
        // change sound volume wrt velocity
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

    // update the velocity of the key given the incoming mass and velocity
    collision(velocity) {
        // this.playsound(new Vector3(0,-0.5,0))
        this.addnVelocity.add(velocity)

        // do the update to the velocity here based on elastic colision? 
        // not sure what to do
        // assume collisions only give force in the y direction 
    }
}
class BlackKey extends Key {
    constructor(octave, note, name, audiolist) {
        super(octave, note, name, audiolist);

        this.mesh = new Mesh(
            new BoxGeometry(0.7, 0.25, 0.2),
            new MeshBasicMaterial({ color: 0x000000 })
        )
        this.mesh.position.add(new Vector3(this.mesh.geometry.parameters.width / 2, this.mesh.geometry.parameters.height / 2, this.mesh.geometry.parameters.depth / 2))
        this.mesh.position.add(new Vector3(0.52, 0, 0.15))
        this.mesh.position.add(new Vector3(0, 0, 1.89).multiplyScalar(this.octave - 2))
        switch(note) {
            case 1: break 
            case 3: 
                this.mesh.position.add(new Vector3(0,0,0.28))
                break
            case 6: 
                this.mesh.position.add(new Vector3(0,0,0.82))
                break 
            case 8:
                this.mesh.position.add(new Vector3(0,0,0.27+0.82))
                break
            case 10: 
                this.mesh.position.add(new Vector3(0,0,0.27*2+0.82))
                break
            default:
                console.log('not black key')            
        }
        this.restPosition = new Vector3().add(this.mesh.position).add(new Vector3(0,1,0))
        this.maxY = this.mesh.position.y 
        this.playY = this.mesh.position.y - PLAY_DISTANCE
        this.minY = this.mesh.position.y - 0.1
    }
    keyType() {
        return "black"
    }
}
class WhiteKey extends Key {
    constructor(octave, note, name, audiolist) {
        super(octave, note, name, audiolist);
        this.mesh = new Mesh(
            new BoxGeometry(1.21, 0.15, 0.25),
            new MeshBasicMaterial({ color: 0xffffff }))
        this.mesh.position.add(new Vector3(this.mesh.geometry.parameters.width / 2, this.mesh.geometry.parameters.height / 2, this.mesh.geometry.parameters.depth / 2))
        this.mesh.position.add(new Vector3(0, 0, 1.89).multiplyScalar(this.octave - 2))
        switch(note) {
            case 0: break 
            case 2: 
                this.mesh.position.add(new Vector3(0,0,0.27))
                break
            case 4: 
                this.mesh.position.add(new Vector3(0,0,0.27 *2))
                break 
            case 5:
                this.mesh.position.add(new Vector3(0,0,0.27 *3))
                break 
            case 7:
                this.mesh.position.add(new Vector3(0,0,0.27 *4))
                break 
            case 9:
                this.mesh.position.add(new Vector3(0,0,0.27 *5))
                break 
            case 11:
                this.mesh.position.add(new Vector3(0,0,0.27 *6))
                break 
            default:
                console.log('not white key')   
        }
        this.restPosition = new Vector3().add(this.mesh.position).add(new Vector3(0,1,0))
        this.maxY = this.mesh.position.y 
        this.playY = this.mesh.position.y - PLAY_DISTANCE
        this.minY = this.mesh.position.y - 0.1
    } 
    keyType() {
        return "white"
    }
}

class Keys extends Group {
    constructor(parent) {
        super()

        this.keys = new Array(48) 

        this.position.add(new Vector3(-2.35, 4.92, -0.54))
        // this.maxx()

        // instantiate each key
        for (let i = 0; i < this.keys.length; i++) {
            switch (i % 12) {
                case 0:
                    this.keys[i] = new WhiteKey(~~(i / 12 + 2), 0, 'c', parent.audiolist)
                    break
                case 1:
                    this.keys[i] = new BlackKey(~~(i / 12 + 2), 1, 'c-', parent.audiolist)
                    break
                case 2:
                    this.keys[i] = new WhiteKey(~~(i / 12 + 2), 2, 'd', parent.audiolist)
                    break
                case 3:
                    this.keys[i] = new BlackKey(~~(i / 12 + 2), 3, 'd-', parent.audiolist)
                    break
                case 4:
                    this.keys[i] = new WhiteKey(~~(i / 12 + 2), 4, 'e', parent.audiolist)
                    break
                case 5:
                    this.keys[i] = new WhiteKey(~~(i / 12 + 2), 5, 'f', parent.audiolist)
                    break
                case 6:
                    this.keys[i] = new BlackKey(~~(i / 12 + 2), 6, 'f-', parent.audiolist)
                    break
                case 7:
                    this.keys[i] = new WhiteKey(~~(i / 12 + 2), 7, 'g', parent.audiolist)
                    break
                case 8:
                    this.keys[i] = new BlackKey(~~(i / 12 + 2), 8, 'g-', parent.audiolist)
                    break
                case 9:
                    this.keys[i] = new WhiteKey(~~(i / 12 + 2), 9, 'a', parent.audiolist)
                    break
                case 10:
                    this.keys[i] = new BlackKey(~~(i / 12 + 2), 10, 'a-', parent.audiolist)
                    break
                case 11:
                    this.keys[i] = new WhiteKey(~~(i / 12 + 2), 11, 'b', parent.audiolist)
                    break
                default:
                    console.log('something went wrong')
            }
        }
        // console.log(this.keys)
        for (let k of this.keys) {            
            this.add(k.mesh)
            for (let s of k.sounds) {
                k.mesh.add(s)
            }
            parent.addToUpdateList(k)

            k.mesh.geometry.computeBoundingBox()
        }

    }
    playKey(key) {
        for (let k of this.keys) {
            if (k.name == key) {
                // k.playsound()
                // k.mesh.position.sub(new Vector3(0,0.15,0))
                // impart a small velocity to play the note
                // velocity of -2.05 is the smallest and -4 the largest
                // from rest position
                k.addnVelocity.add(new Vector3(0,-1.5,0))
            }
        }
    }
}

export default Keys
