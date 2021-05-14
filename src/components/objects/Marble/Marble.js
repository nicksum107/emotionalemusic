import { SphereGeometry } from 'three';
import { MeshBasicMaterial } from 'three';
import { Raycaster } from 'three';
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
const COLLISION_TOLERANCE = 5; // 0 = no extra tolerance
const NUM_COLLISION_RAYS = 100 
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
        this.foundCollision = null 

        this.scene = parent

        // Add to parent's update list
        parent.addToUpdateList(this);
        // console.log(this)

        // Drum intersection
        this.prevDrumIntersection = null;
        this.collisionCheckCount = 0;
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

        let deltaT = (timeStamp - this.prevTime) / 1000 // ms
        this.prevTime = timeStamp
        if (this.foundCollision!= null) {
            this.previous = this.mesh.position.clone()
            this.mesh.position.sub(this.mesh.position).add(this.foundCollision)
            this.foundCollision = null 
            return 
        }

        // Update position
        let diff = this.prevVelocity.clone().multiplyScalar(deltaT);
        if (diff.length() < EPS) diff = new Vector3(); // Floating point weirdness
        this.previous = this.mesh.position.clone()
        this.mesh.position.add(diff)

        // Compute new Velocity
        const newVelocity = this.prevVelocity.clone().add(this.forces.clone().multiplyScalar(deltaT / this.mass))
        this.prevVelocity = newVelocity.add(this.addnVelocity);
        this.addnVelocity = new Vector3()

        // collisions with the floor in the scene
        if (this.mesh.position.y < this.scene.floorHeight + this.radius + EPS) {
            this.floorBounces++;
            // Delete if we hit floor enough times
            if (this.floorBounces >= NUM_FLOOR_BOUNCES) {
                this.scene.remove(this.mesh);
                this.mesh.geometry.dispose();
                this.mesh.material.dispose();
                this.scene.removeFromUpdateList(this);
                return;
            }

            this.mesh.position.setY(this.scene.floorHeight + this.radius);
            this.prevVelocity.setY(-this.prevVelocity.y * 0.95)
        }

        // Check collision; if collided, restore floorBounces to 0
        if (this.checkCollision()) this.floorBounces = 0;
    }

    // checks if there is a collision with objects
    checkCollision() {
        if (this.checkKeyCollision()) {
            return true 
        }
        if (this.checkDrumCollision()) {
            return true 
        }
        if (this.scene.state.pianoCollisions) {
            if (this.checkMeshCollision()) {
                return true
            }
        }
        return false
    }
    checkDrumCollision() {
        // Check collisions with drum
        const drum = this.scene.drum;
        const surfaceOrigin = this.mesh.position.clone().add(this.prevVelocity.clone().setLength(this.radius))
        const normalizedVelocity = this.prevVelocity.clone().normalize();

        // Check forward intersections ("in front of" the marble)
        const raycaster = new Raycaster(surfaceOrigin, normalizedVelocity);
        const forwardIntersections = raycaster.intersectObject(drum.mesh);
        // drumIntersections is sorted in increasing distance, so only need to check the first intersection
        if (forwardIntersections.length > 0 && forwardIntersections[0].distance <= this.radius * COLLISION_TOLERANCE) {
            // Figure out if it is side of drum or not, play sound
            let isSide = false;
            const normalNonY = forwardIntersections[0].face.normal.clone();
            normalNonY.y = 0;
            // Top and bottom faces are flat, all others are not
            if (normalNonY.length() > EPS) {
                isSide = true;
            }
            drum.playsound(this.prevVelocity, isSide);

            // Put marble roughly where it would be on the surface of the drum
            // const newPos = forwardIntersections[0].point.clone().sub(this.prevVelocity.clone().setLength(this.radius));
            // this.mesh.position.copy(newPos);

            // Update velocity
            const faceNormal = forwardIntersections[0].face.normal.clone();
            const reverseVelocity = this.prevVelocity.clone().multiplyScalar(-1);
            const newVelocity = faceNormal.clone().multiplyScalar(2 * faceNormal.dot(reverseVelocity)).sub(reverseVelocity);
            this.prevVelocity.copy(newVelocity);
            return true;
        }
    }
    checkKeyCollision() {
        let localpos = this.mesh.position.clone().sub(this.scene.keys.position)
        for (let k of this.scene.keys.keys) {
            k.mesh.geometry.computeBoundingBox()
            let bb = k.mesh.geometry.boundingBox.clone()
            bb.expandByScalar(EPS)

            let keytopy = bb.max.y + k.mesh.position.y
            let keybottomy = bb.min.y + k.mesh.position.y
            // Check for collision
            if (localpos.y - this.radius < keytopy &&
                localpos.y + this.radius > keybottomy &&
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
                this.prevVelocity.y = v1

                // Key's final velocity
                k.collision(new Vector3(0, v2, 0))

                // Marble should be above key
                this.mesh.position.y = this.scene.keys.position.y + keytopy + this.radius;

                // Bandaid solution for incorrectly calculating multiple collisions
                return true;
            }
        }
        return false; 
    }

    // sigma = 1 
    gaussian(x) {
        return Math.pow(Math.E,-Math.pow(x,2)/2)/Math.sqrt(2*Math.PI)
    }
    sampleDirection() {
        let x = this.gaussian(Math.random() * 6 - 3)
        let y = this.gaussian(Math.random() * 6 - 3)
        let z = this.gaussian(Math.random() * 6 - 3)
        
        return new Vector3(x,y,z).normalize()

    }
    // general mesh collisions
    checkMeshCollision() {
        // bandaid fix do not do collisions with mesh when above the keys
        
        let localpos = this.mesh.position.clone().sub(this.scene.keys.position)

        if (localpos.y > -0.25-EPS && 
            localpos.x > -0.1 && localpos.x < 0.7 + 0.1) {
            return false 
        }
        
        let origin = this.mesh.position.clone() 

        let v = this.prevVelocity.clone()
        for (let i = 0; i < NUM_COLLISION_RAYS; i++) {
            if (i == 0) { // prefer direction of motion
                var dir = v.clone().normalize()
            } else {
                var dir = this.sampleDirection()
            }
            // get all collisions of this ray until the radius
            let ray = new Raycaster(origin, dir.normalize())
            var result = ray.intersectObject(this.scene.collidablemeshes[0].mesh)
            
            if (result.length > 0) {
                // this.potentialCollision = result[0]
                
                // difficulties with too large of step size
                if (result[0].distance < v.length()*0.05 + this.radius +EPS&& 
                    result[0].distance > this.radius -EPS&& 
                    v.dot(result[0].face.normal)  < -0.3 ) { // check going right direction
                    
                    
                    // bounce across the normal
                    this.foundCollision = result[0].point
                    this.foundCollision.add(dir.multiplyScalar(-this.radius))
                    this.scene.collidablemeshes[0].playsound(this.prevVelocity)

                    this.prevVelocity.reflect(result[0].face.normal)
                    this.prevVelocity.multiplyScalar(0.95)

                    return true 
                }
            }
        }
    }
    // try to do max
    // checkMeshCollision() {
    //     let origin = this.mesh.position.clone() 

    //     let v = this.prevVelocity.clone()
    //     let mindist = Number.POSITIVE_INFINITY
    //     let min = null
    //     for (let i = 0; i < NUM_COLLISION_RAYS; i++) {
    //         if (i == 0) {
    //             var dir = v.clone().normalize()
    //         } else {
    //             var dir = this.sampleDirection()
    //         }
    //         // get all collisions of this ray until the radius
    //         let ray = new Raycaster(origin, dir.normalize())
    //         var result = ray.intersectObject(this.scene.collidablemeshes[0].mesh)
            
    //         if (result.length > 0) {
    //             // this.potentialCollision = result[0]
    //             if (result.distance < mindist &&
    //                 result.distance > this.radius - EPS ) {
    //                 min = result[0]
    //                 mindist = result.distance
    //             }       
                
    //         }
    //     }
    //     // difficulties with too large of step size
    //     if (mindist < v.length()*0.05 + this.radius +EPS&& 
    //         v.dot(min.face.normal)  < -0.3 ) { // check going right direction
            
    //         // bounce across the normal
    //         this.foundCollision = min.point
    //         this.foundCollision.add(dir.multiplyScalar(-this.radius))
    //         this.prevVelocity.reflect(min.face.normal)
    //         this.prevVelocity.multiplyScalar(0.95)
    //     }
    //     return 
    // }
}


export default Marble
