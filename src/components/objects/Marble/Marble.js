import { SphereGeometry } from 'three';
import { MeshBasicMaterial } from 'three';
import { Vector3 } from 'three';
import { Mesh } from 'three';
import { Object3D } from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import MODEL from './model.gltf';
const GRAVITY = -5
const DAMPING = 0.01
const EPS = 0.00001
const WIDTH_SEGMENTS = 32
const HEIGHT_SEGMENTS = 32
class Marble extends Object3D {
    constructor(parent, radius, mass, initialPos, initialVelocity) {
        super()

        let m = this 
        
        // Create mesh
        const geometry = new SphereGeometry(radius, WIDTH_SEGMENTS, HEIGHT_SEGMENTS);
        const material = new MeshBasicMaterial({ color: 0x444444 });
        this.mesh = new Mesh(geometry, material);
        this.mesh.position.copy(initialPos);
        this.position.copy(initialPos);
        parent.add(this.mesh)
        
        // Initialize physical info
        this.forces = new Vector3(0, GRAVITY * this.mass, 0)
        this.prevVelocity = initialVelocity.clone()
        this.addnVelocity = new Vector3() // velocity from collisions TODO: replace this
        this.prevTime = -1
        this.mass = mass

        // Add to parent's update list
        parent.addToUpdateList(this);
        console.log(this)
    }
    updateForces() {
        // update all forces on the marble
        this.forces = new Vector3(0, GRAVITY * this.mass, 0)

        if (this.forces.length() < EPS) {
            this.forces = new Vector3()
        }
    }

    // Euler Integration
    // TODO: Iteratively do this if timeStamp is large
    update(timeStamp) {
        this.updateForces()

        if (this.prevTime == -1) {
            this.prevTime = timeStamp 
            this.previous = this.mesh.position
            return
        }
        
        let deltaT = (timeStamp-this.prevTime)/1000 // ms
        this.prevTime = timeStamp
        
        // Update position
        let diff = this.prevVelocity.clone().multiplyScalar(deltaT);
        if (diff.length() < EPS) diff = new Vector3(); // Floating point weirdness
        this.mesh.position.add(diff)
        this.previous = this.mesh.position.clone()

        // Compute new Velocity
        const newVelocity = this.prevVelocity.clone().add(this.forces.clone().multiplyScalar(deltaT / this.mass))
        this.prevVelocity = newVelocity.add(this.addnVelocity);
        this.addnVelocity = new Vector3()

        // For testing - simulates an invisible floor at y = -1
        if (this.mesh.position.y < -1) {
            this.mesh.position.setY(-1);
            this.prevVelocity.setY(-this.prevVelocity.y * 0.95)
        }

        // TODO: Delete if out of bounds
    }
    playsound(velocity) {
        // velocity = -6 = 1
        // change sound volume wrt velocity
        // let scaledvel = -1 * velocity.y - 5 incorrect
        for (let s of this.sounds){ 
            if (!s.isPlaying) {
                // volume goes from 0 to 20 without sounding bad
                // console.log(scaledvel, s.getVolume())
                s.play()
                break 
            }
        }        
    }

    // update the velocity of the key given the incoming mass and velocity
    collision(incVelocity, incMass) {
        // do the update to the velocity here based on elastic colision? 
        // not sure what to do
        // assume collisions only give force in the y direction 
    }
}

export default Marble
