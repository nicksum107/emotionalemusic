import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Vector3 } from 'three';
import { SphereGeometry, MeshBasicMaterial, Mesh } from 'three';
import { Flower, Land, Piano, Keys, Marble } from 'objects';
import { BasicLights } from 'lights';
import mary from '../example_scenes/mary.json';

const SIM_SPEED = 2;

function loadJSON(url, callback) {   
    var xobj = new XMLHttpRequest();
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
            'Marble Vel z': 1.04,
            presetScene: 'mary',
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

        // Create marble folder
        const marbleFolder = this.state.gui.addFolder('Create Marble');
        marbleFolder.add(this.state, 'Marble x', -5, 5, 0.01);
        marbleFolder.add(this.state, 'Marble y', -5, 20, 0.01);
        marbleFolder.add(this.state, 'Marble z', -5, 5, 0.01);
        marbleFolder.add(this.state, 'Marble Vel x', -5, 5, 0.01);
        marbleFolder.add(this.state, 'Marble Vel y', -5, 5, 0.01);
        marbleFolder.add(this.state, 'Marble Vel z', -5, 5, 0.01);
        // Button to create marble
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

        // Preset scenes
        const sceneFolder = this.state.gui.addFolder('Preset Scenes')
        const presetScenes = ['mary']
        const presetSceneMap = {
            'mary': mary,
        };
        sceneFolder.add(this.state, 'presetScene', presetScenes);
        
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
                            // Find the desired key
                            for (let k of scene.keys.keys) {
                                if (k.name === note.value) {
                                    // Compute quantities
                                    let marblePos = k.mesh.position.clone().add(new Vector3(0,3,0)).add(scene.keys.position)
                                    if (k.keyType()==="white") {
                                        marblePos.add(new Vector3(-0.4,0,0))
                                    } else {
                                        marblePos.add(new Vector3(0,0,0.01))
                                    }
                                    marblePos.add(new Vector3(1,0,0))
                                    let marbleVel = new Vector3(-1, 0, 0)

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
        sceneFolder.add(playSceneButton, 'playScene');
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
