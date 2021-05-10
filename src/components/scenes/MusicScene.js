import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Vector3 } from 'three';
import { SphereGeometry, MeshBasicMaterial, Mesh } from 'three';
import { Flower, Land, Piano, Keys, Marble } from 'objects';
import { BasicLights } from 'lights';

const SIM_SPEED = 2;

class MusicScene extends Scene {
    constructor(camera, audiolist) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            rotationSpeed: 0,
            updateList: [],
            octave: 3,
            directlyPlay: false,
            marbleMass: 0.5,
            marbleRadius: 0.1,
            'Marble x': -2,
            'Marble y': 10,
            'Marble z': 0,
            'Marble Vel x': 0,
            'Marble Vel y': 0,
            'Marble Vel z': 1
        };

        this.camera = camera
        this.audiolist = audiolist

        // Set background to a nice color
        this.background = new Color(0x7ec0ee);

        // Add meshes to scene
        // const land = new Land();
        // const flower = new Flower(this);
        const piano = new Piano()
        const lights = new BasicLights();
        this.keys = new Keys(this)
        this.add(piano, lights, this.keys);

        // Add marble
        // const marble = new Marble(this, 0.1, 1, new Vector3(0, 0, 0), new Vector3(0, 1, 0));
        // const geometry = new SphereGeometry(0.1, 32, 32);
        // const material = new MeshBasicMaterial({ color: 0x3300aa });
        // const sphere = new Mesh(geometry, material);
        // this.add(sphere);

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
        this.state.gui.add(this.state, 'octave', 2, 5, 1);

        const interactiveFolder = this.state.gui.addFolder('Interaction and Physics');
        interactiveFolder.add(this.state, 'directlyPlay', );
        interactiveFolder.add(this.state, 'marbleMass', 0.1, 10, 0.1);
        interactiveFolder.add(this.state, 'marbleRadius', 0.1, 0.5, 0.01);

        const marbleFolder = this.state.gui.addFolder('Create Marble');
        marbleFolder.add(this.state, 'Marble x', -5, 5, 0.1);
        marbleFolder.add(this.state, 'Marble y', -5, 20, 0.1);
        marbleFolder.add(this.state, 'Marble z', -5, 5, 0.1);
        marbleFolder.add(this.state, 'Marble Vel x', -5, 5, 0.1);
        marbleFolder.add(this.state, 'Marble Vel y', -5, 5, 0.1);
        marbleFolder.add(this.state, 'Marble Vel z', -5, 5, 0.1);
        const state = this.state;
        const scene = this;
        const createMarbleButton = { 
            createMarble: function() { 
                const marblePos = new Vector3(state['Marble x'], state['Marble y'], state['Marble z'])
                const marbleVel = new Vector3(state['Marble Vel x'], state['Marble Vel y'], state['Marble Vel z']);
                const m = new Marble(scene, state.marbleRadius, state.marbleMass, marblePos, marbleVel)
            }
        };
        marbleFolder.add(createMarbleButton, 'createMarble')
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    removeFromUpdateList(object) {
        const index = this.state.updateList.indexOf(object);
        this.state.updateList.splice(index, 1);
    }

    update(timeStamp) {
        const { rotationSpeed, updateList } = this.state;
        this.rotation.y  = (rotationSpeed * timeStamp) / 10000;

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp * SIM_SPEED);
        }
    }

    keyDownHandler(event) {
        console.log(event)

        let toplay = String(event.key).toLowerCase()
        if (event.shiftKey) {
            toplay.toLowerCase()
            toplay+="-"
        }
        toplay += String(this.state.octave)

        if (this.state.directlyPlay){
            this.keys.playKey(toplay)
            return 
        } 
        
        // spawn a marble to play the note
        for (let k of this.keys.keys) {
            if (k.name == toplay) {
                let marblePos = k.mesh.position.clone().add(new Vector3(0,3,0)).add(this.keys.position)
                if (k.keyType()==="white") {
                    marblePos.add(new Vector3(-0.4,0,0))
                } else {
                    marblePos.add(new Vector3(0,0,0.01))
                }
                marblePos.add(new Vector3(1,0,0))
                let marbleVel = new Vector3(-1, 0, 0)
                const m = new Marble(this, this.state.marbleRadius, this.state.marbleMass, marblePos, marbleVel)
            }
        }
    }
}

export default MusicScene;
