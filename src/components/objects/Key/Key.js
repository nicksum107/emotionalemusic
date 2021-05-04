import { BoxGeometry } from 'three';
import { MeshBasicMaterial } from 'three';
import { AudioLoader } from 'three';
import { PositionalAudio } from 'three';
import { Vector3 } from 'three';
import { Mesh } from 'three';
import { Group } from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import MODEL from './model.gltf';

class Key {
    constructor(octave, note, name, audiolist) {
        let k = this 
        this.octave = octave
        this.note = note
        this.name = name + String(octave);

        this.sound = new PositionalAudio(audiolist)
        
        const audioLoader = new AudioLoader()
        // TODO: get octave 2
        if (octave > 2) {
            // console.log('/src/notes/'+name+String(octave)+'.mp3')
            audioLoader.load('/src/components/sounds/notes/'+name+String(octave)+'.mp3', function(buffer){
                k.sound.setBuffer(buffer)
                k.sound.setRefDistance(20)
            })
        }
        // TODO: add constraints so that the key doesn't go flying (on bottom and top)
        // TODO: add spring
        this.forces = new Vector3(0,-1, 0)
    }
    updateForces() {
        // update all forces on the key
    }
    update() {
        this.updateForces()
        
        // simulation here, update based on forces
        // see a5, simply move this.mesh based on it, etc. 
        // make sure not to go past the boundaries on bottom/top 
    }
    playsound() {
        this.sound.play()
    }
    // collision with a sphere
    collision(incVelocity, incMass) {
        // set a flag so that on the next update we will put some forces?
        // or do the update to the velocity here based on elastic colision? 
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
                this.mesh.position.add(new Vector3(0,0,0.81))
                break 
            case 8:
                this.mesh.position.add(new Vector3(0,0,0.27+0.81))
                break
            case 10: 
                this.mesh.position.add(new Vector3(0,0,0.27*2+0.81))
                break
            default:
                console.log('not black key')            
        }
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
    } 
}

class Keys extends Group {
    constructor(parent) {
        super()

        this.keys = new Array(48) // to do 48

        this.position.add(new Vector3(-2.35, 4.92, -0.54))
        const cubeA = new Mesh(
            new BoxGeometry(1.21, 0.15, 0.25),
            new MeshBasicMaterial({ color: 0xff0000 }))
        console.log(cubeA.geometry.parameters.width)
        cubeA.position.add(new Vector3(cubeA.geometry.parameters.width / 2, cubeA.geometry.parameters.height / 2, cubeA.geometry.parameters.depth / 2))

        this.add(cubeA)

        const cubeB = new Mesh(
            new BoxGeometry(0.7, 0.25, 0.2),
            new MeshBasicMaterial({ color: 0x00ff00 })
        )
        this.add(cubeB)
        cubeB.position.add(new Vector3(cubeB.geometry.parameters.width / 2, cubeB.geometry.parameters.height / 2, cubeB.geometry.parameters.depth / 2))
        cubeB.position.add(new Vector3(cubeA.geometry.parameters.width - 0.7 + 0.01, 0, 0.15))
        cubeB.position.add(new Vector3(0, 0, 1.89))
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
            k.mesh.add(k.sound)
            parent.addToUpdateList(k)
        }
    }
    playKey(key) {
        for (let k of this.keys) {
            if (k.name == key) {
                k.playsound()
            }
        }
    }
}

export default Keys
