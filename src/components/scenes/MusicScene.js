import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Vector3 } from 'three';
import { PlaneGeometry, MeshBasicMaterial, MeshLambertMaterial, Mesh, DoubleSide } from 'three';
import { Flower, Land, Piano, Keys, Marble, Drum } from 'objects';
import { BasicLights } from 'lights';
import mary from '../example_scenes/mary.json';
import furelise from '../example_scenes/furelise.json';
import mountainking from '../example_scenes/mountainking.json';

const SIM_SPEED = 2;
const DRUM_HALFHEIGHT = 1.25;
const DRUM_RADIUS_BOTTOM = 1.2;
const DRUM_RADIUS_TOP = 1.4;

function loadJSON(url, callback) {   
    var xobj = new XMLHttpRequest();
    // Read the json as "webpage"
    xobj.overrideMimeType("application/json");
    xobj.open('GET', url, true);
    xobj.onreadystatechange = function () {
      if (xobj.status == "200") {
          if (xobj.readyState == 4) {
            const jsonStr = JSON.parse(xobj.responseText);
            callback(jsonStr);
          }
      }
    };
    xobj.send(null);  
}

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
            'Marble Vel z': 1.62,
            presetScene: 'mary',
            drumX: -1,
            drumY: 1.57,
            drumZ: 10,
        };

        this.camera = camera
        this.audiolist = audiolist

        // Set background to a nice color
        this.background = new Color(0x7ec0ee);

        // Scope/closure stuff
        const state = this.state;
        const scene = this;

        // Add meshes to scene
        // Piano, lights, and keys are not added within constructor
        // Drum and marbles are added to scene within constructor
        const piano = new Piano()
        const lights = new BasicLights();
        this.keys = new Keys(this)
        this.drum = new Drum(this, DRUM_RADIUS_BOTTOM, DRUM_RADIUS_TOP, DRUM_HALFHEIGHT * 2, new Vector3(this.state.drumX, this.state.drumY, this.state.drumZ));
        this.add(piano, lights, this.keys);

        // Add floor and surrounding sphere
        this.floorHeight = 0.32;
        const geometry = new PlaneGeometry(5000, 5000);
        geometry.rotateX(- Math.PI / 2); // Rotate to be flat (ground)
        geometry.translate(0, this.floorHeight, 0); // Touch bottom of piano
        const material = new MeshLambertMaterial({ color: 0x47894b, side: DoubleSide });
        const plane = new Mesh(geometry, material);
        this.add(plane);

        // Populate GUI
        // this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
        this.state.gui.add(this.state, 'octave', 2, 5, 1);

        // Scene
        const sceneFolder = this.state.gui.addFolder('Scene');
        const drumXSlider = sceneFolder.add(this.state, 'drumX', -10, 10, 0.01)
        const drumYSlider = sceneFolder.add(this.state, 'drumY', 1.4, 10, 0.01)
        const drumZSlider = sceneFolder.add(this.state, 'drumZ', -10, 10, 0.01)
        const onDrumCoordsChange = function () {
            const drumPos = new Vector3(state.drumX, state.drumY, state.drumZ)
            scene.drum.mesh.position.copy(drumPos)
        }
        drumXSlider.onChange(onDrumCoordsChange)
        drumYSlider.onChange(onDrumCoordsChange)
        drumZSlider.onChange(onDrumCoordsChange)

        // User Interaction and Physical Constants
        const interactiveFolder = this.state.gui.addFolder('Interaction and Physics');
        interactiveFolder.add(this.state, 'directlyPlay', );
        interactiveFolder.add(this.state, 'marbleMass', 0.1, 10, 0.1);
        interactiveFolder.add(this.state, 'marbleRadius', 0.1, 0.5, 0.01);

        // Create marble folder
        const marbleFolder = this.state.gui.addFolder('Create Marble');
        marbleFolder.add(this.state, 'Marble x', -5, 5, 0.01);
        marbleFolder.add(this.state, 'Marble y', -5, 20, 0.01);
        marbleFolder.add(this.state, 'Marble z', -5, 20, 0.01);
        marbleFolder.add(this.state, 'Marble Vel x', -5, 5, 0.01);
        marbleFolder.add(this.state, 'Marble Vel y', -5, 5, 0.01);
        marbleFolder.add(this.state, 'Marble Vel z', -5, 5, 0.01);
        // Button to create marble
        const createMarbleButton = { 
            createMarble: function() { 
                const marblePos = new Vector3(state['Marble x'], state['Marble y'], state['Marble z'])
                const marbleVel = new Vector3(state['Marble Vel x'], state['Marble Vel y'], state['Marble Vel z']);
                const m = new Marble(scene, state.marbleRadius, state.marbleMass, marblePos, marbleVel)
            }
        };
        marbleFolder.add(createMarbleButton, 'createMarble')

        // Preset scenes
        const presetSceneFolder = this.state.gui.addFolder('Preset Scenes')
        const presetScenes = ['mary', 'furelise', 'mountainking']
        const presetSceneMap = {
            'mary': mary,
            'furelise': furelise,
            'mountainking': mountainking,
        };
        presetSceneFolder.add(this.state, 'presetScene', presetScenes);
        
        // Array of notes to play, in order of first to last
        this.queuedNotes = [];
        this.lastTimestamp = 0;

        // Button to play scene
        const playSceneButton = {
            playScene: function() {
                // Load the json according to which scene was selected
                loadJSON(presetSceneMap[state.presetScene], function(json) {
                    // Replace queuedNotes with the notes from json
                    scene.queuedNotes = [];

                    // Populate notes in the same order as JSON
                    for (let i = 0; i < json.notes.length; i++) {
                        const note = json.notes[i];
                        const timestamp = json.notes[i].timestamp + scene.lastTimestamp;
                        // Preset: 'a2', 'a-2', etc.
                        if (note.type === 'preset') {
                            // Check for drum/side of drum first
                            if (note.value === 'drum') {
                                scene.queuedNotes.push({
                                    timestamp: timestamp,
                                    pos: scene.getPresetDrumMarblePos(),
                                    vel: scene.getPresetDrumMarbleVel(),
                                });
                            }
                            if (note.value === 'sidedrum') {
                                scene.queuedNotes.push({
                                    timestamp: timestamp,
                                    pos: scene.getPresetSideDrumMarblePos(),
                                    vel: scene.getPresetSideDrumMarbleVel(),
                                });
                            }

                            // Find the desired key
                            for (let k of scene.keys.keys) {
                                if (k.name === note.value) {
                                    // Compute quantities
                                    const marblePos = scene.getPresetKeyMarblePos(k)
                                    const marbleVel = scene.getPresetKeyMarbleVel();

                                    // Object defining what kind of marble to create
                                    scene.queuedNotes.push({
                                        timestamp: timestamp,
                                        pos: marblePos,
                                        vel: marbleVel
                                    })
                                    break;
                                }
                            }
                        }
                    }
                });
            }
        }
        presetSceneFolder.add(playSceneButton, 'playScene');
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
        this.lastTimestamp = timeStamp; // For presetScenes

        // Play all queued notes
        while (this.queuedNotes.length > 0 && this.queuedNotes[0].timestamp <= timeStamp) {
            const m = new Marble(this, this.state.marbleRadius, this.state.marbleMass, this.queuedNotes[0].pos, this.queuedNotes[0].vel);
            this.queuedNotes.shift();
        }

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp * SIM_SPEED);
        }
    }

    getPresetDrumMarblePos() {
        return this.drum.mesh.position.clone().add(new Vector3(0, 3 + DRUM_HALFHEIGHT, 0))
    }

    getPresetDrumMarbleVel() {
        return new Vector3(-1, 0, 0);
    }

    getPresetSideDrumMarblePos() {
        return this.drum.mesh.position.clone().add(new Vector3(0, 1, 5 + (DRUM_RADIUS_BOTTOM + DRUM_RADIUS_TOP) / 2))
    }

    getPresetSideDrumMarbleVel() {
        return new Vector3(0, 1, -4.5)
    }

    getPresetKeyMarblePos(k) {
        let marblePos = k.mesh.position.clone().add(new Vector3(0,3,0)).add(this.keys.position)
        if (k.keyType()==="white") {
            marblePos.add(new Vector3(-0.4,0,0))
        } else {
            marblePos.add(new Vector3(0,0,0.01))
        }
        marblePos.add(new Vector3(1,0,0))
        return marblePos;
    }

    getPresetKeyMarbleVel() {
        return new Vector3(-1, 0, 0)
    }

    keyDownHandler(event) {
        console.log(event)
        // Drum
        if (String(event.key).toLowerCase() === 'p') {
            const marblePos = this.getPresetDrumMarblePos();
            const marbleVel = this.getPresetDrumMarbleVel();
            const m = new Marble(this, this.state.marbleRadius, this.state.marbleMass, marblePos, marbleVel);
            return;
        }

        // Side of drum
        if (String(event.key).toLowerCase() === 'o') {
            const marblePos = this.getPresetSideDrumMarblePos();
            const marbleVel = this.getPresetSideDrumMarbleVel();
            const m = new Marble(this, this.state.marbleRadius, this.state.marbleMass, marblePos, marbleVel);
        }

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
                const marblePos = this.getPresetKeyMarblePos(k)
                const marbleVel = this.getPresetKeyMarbleVel();
                const m = new Marble(this, this.state.marbleRadius, this.state.marbleMass, marblePos, marbleVel)
            }
        }
    }
}

export default MusicScene;
