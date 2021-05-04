import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Flower, Land, Piano, Keys } from 'objects';
import { BasicLights } from 'lights';

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
        const flower = new Flower(this);
        const piano = new Piano()
        const lights = new BasicLights();
        this.keys = new Keys(this)
        this.add(flower, piano, lights, this.keys);
        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
        
        this.state.gui.add(this.state, 'octave', 3, 5, 1);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { rotationSpeed, updateList } = this.state;
        this.rotation.y  = (rotationSpeed * timeStamp) / 10000;

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
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
