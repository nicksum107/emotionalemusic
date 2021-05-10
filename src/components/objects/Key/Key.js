import { BoxGeometry } from 'three';
import { MeshBasicMaterial } from 'three';
import { AudioLoader } from 'three';
import { Plane } from 'three';
import { PositionalAudio } from 'three';
import { Vector3 } from 'three';
import { Mesh } from 'three';
import { Group } from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import MODEL from './model.gltf';
const GRAVITY = -0.5
const K = 20
const DAMPING = 0.01
const EPS = 0.00001
const KEY_MASS = 5
const PLAY_DISTANCE = 0.04;
class Key {
    constructor(octave, note, name, audiolist) {
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
                audioLoader.load('/src/components/sounds/notes/'+name+String(octave)+'.mp3', function(buffer){
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

        // instantiate each key
        console.log(this.keys)
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
                k.addnVelocity.add(new Vector3(0,-3,0))
            }
        }
    }
}

export default Keys
