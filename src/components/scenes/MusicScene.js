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
            octave: 3
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
        // this.add(piano, lights, this.keys);

        // Add marble
        const marble = new Marble(this, 0.2, 1, new Vector3(0, 0, 0), new Vector3(0, 1, 0));
        // const geometry = new SphereGeometry(0.1, 32, 32);
        // const material = new MeshBasicMaterial({ color: 0x3300aa });
        // const sphere = new Mesh(geometry, material);
        // this.add(sphere);

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
        
        this.state.gui.add(this.state, 'octave', 2, 5, 1);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
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

        this.keys.playKey(toplay)
    }
}

export default MusicScene;
