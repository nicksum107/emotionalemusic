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
const NUM_FLOOR_BOUNCES = 3
class Marble extends Object3D {
    constructor(parent, radius, mass, initialPos, initialVelocity) {
        super()

        let m = this 
        
        // Create mesh
        this.radius = radius
        const geometry = new SphereGeometry(radius, WIDTH_SEGMENTS, HEIGHT_SEGMENTS);
        const material = new MeshBasicMaterial({ color: 0x444444 });
        this.mesh = new Mesh(geometry, material);
        this.mesh.position.copy(initialPos);
        // this.position.copy(initialPos);
        parent.add(this.mesh)
        
        // Initialize physical info
        this.forces = new Vector3(0, GRAVITY * this.mass, 0)
        this.prevVelocity = initialVelocity.clone()
        this.addnVelocity = new Vector3() // velocity from collisions TODO: replace this
        this.prevTime = -1
        this.mass = mass
        this.floorBounces = 0;

        this.scene = parent 

        // Add to parent's update list
        parent.addToUpdateList(this);
        // console.log(this)
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
        this.previous = this.mesh.position.clone()
        this.mesh.position.add(diff)

        // Compute new Velocity
        const newVelocity = this.prevVelocity.clone().add(this.forces.clone().multiplyScalar(deltaT / this.mass))
        this.prevVelocity = newVelocity.add(this.addnVelocity);
        this.addnVelocity = new Vector3()

        // simulates an invisible floor at y = 0
        if (this.mesh.position.y < 0) {
            this.floorBounces++;
            // Delete if we hit floor enough times
            if (this.floorBounces >= NUM_FLOOR_BOUNCES) {
                this.scene.remove(this.mesh);
                this.mesh.geometry.dispose();
                this.mesh.material.dispose();
                this.scene.removeFromUpdateList(this);
                return;
            }

            this.mesh.position.setY(0);
            this.prevVelocity.setY(-this.prevVelocity.y * 0.95)
        }

        this.checkCollision()
    }

    // checks if there is a collision with objects
    checkCollision() {
        // for now just check collisiosn with known objects
        let localpos = this.mesh.position.clone().sub(this.scene.keys.position)
        for (let k of this.scene.keys.keys) {
            k.mesh.geometry.computeBoundingBox()
            let bb = k.mesh.geometry.boundingBox.clone()
            bb.expandByScalar(EPS)
            
            let keytopy = bb.max.y + k.mesh.position.y
            // Check for collision
            if (localpos.y - this.radius < keytopy && 
                localpos.x < bb.max.x + k.mesh.position.x && localpos.x > bb.min.x + k.mesh.position.x && 
                localpos.z < bb.max.z + k.mesh.position.z && localpos.z > bb.min.z + k.mesh.position.z) { 
                
                // Compute elastic collision approximation (conservation of momentum and energy)
                // u -> velocity before, v -> after, 1 -> marble, 2 -> key
                const m1 = this.mass;
                const m2 = k.mass;
                const u1 = this.prevVelocity.y;
                const u2 = k.prevVelocity.y * 0;
                const v1 = (m1 - m2) / (m1 + m2) * u1 + (2 * m2) / (m1 + m2) * u2;
                const v2 = (2 * m1) / (m1 + m2) * u1 + (m2 - m1) / (m1 + m2) * u2;

                // Marble's final velocity in y direction
                // const b = 2 * marbleM * marbleM * marbleV0;
                // const a = marbleM * keyM + marbleM * marbleM;
                // const c = Math.pow(marbleM * marbleV0, 2) - marbleM * keyM * Math.pow(marbleV0, 2);
                // const marbleVf = (-b + Math.sqrt(b*b - 4*a*c)) / 2*a;
                // console.log(this.prevVelocity)
                this.prevVelocity.y = v1
                // console.log(a, b, c, this.prevVelocity)
                // this.mesh.position.y = keytopy + EPS + this.scene.keys.position.y + this.radius

                // Key's final velocity
                // const keyVf = marbleM * (marbleV0 + marbleVf) / keyM;
                k.collision(new Vector3(0, v2, 0))

                // Marble should be above key
                this.mesh.position.y = this.scene.keys.position.y + keytopy + this.radius;

                // Bandaid solution for incorrectly calculating multiple collisions
                break;
            }
        }
        // i think it woudl be cool to do 
    }

    // update the velocity of the key given the incoming mass and velocity
    collision(incVelocity, incMass) {
        //TODO: must make incoming object much much greater mass so that we have good bouncing motion.

        // do the update to the velocity here based on elastic colision? 
        // not sure what to do
        // assume collisions only give force in the y direction 
    }
}

export default Marble
