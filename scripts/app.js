/** @type {WebGL2RenderingContext} */
var gl;
/** @type {Scene} */
var scene;
var app;
var keyPressed = {};
var startTime;
var lastFrame;

/**
 * Main function.
 * Justs sets up the basic UI to select the scene
 */
async function main() {
    let scenes = [
        {
            "name": "valley",
            "displayName": "Valley"
        },
        {
            "name": "sunset",
            "displayName": "Sunset"
        },
        {
            "name": "sleepyhollow",
            "displayName": "Night"
        },
        {
            "name": "divine",
            "displayName": "Divine"
        },
    ];

    // Create the app
    app = {};
    configureApp(app, {});

    // Create the user interface
    app.ui = new UserInterface();
    app.ui.init(app.options, scenes);
}

/**
 * Starts the game with the given scene name
 * @param {string} sceneName 
 */
async function startGame(sceneName) {
    // Initialize WebGL
    let canvas = document.createElement("canvas");
    let canvasContainer = document.getElementById("canvas-container");
    app.ui.mainPanel.hidden = true;
    canvasContainer.hidden = false;
    canvasContainer.appendChild(canvas);
    gl = initializeWebGL(canvas);

    // Create the scene
    scene = new Scene();
    await configureScene(scene, sceneName);

    // Initialize the part of the UI that needs a scene
    app.ui.initSceneControls(scene);

    // Unhide the help text
    app.ui.helpPanel.hidden = false;

    // Configure event listeners
    document.addEventListener("keydown", (e) => {
        // If a single letter is pressed, save it as lowercase
        // otherwise it causes problems when shift is also pressed to run 
        let key = e.key.length == 1 ? e.key.toLowerCase() : e.key;
        keyPressed[key] = true;
    });
    document.addEventListener("keyup", (e) => {
        let key = e.key.length == 1 ? e.key.toLowerCase() : e.key;
        delete keyPressed[key];
    });
    document.addEventListener("keydown", onOverlayKeys);

    document.addEventListener("click", checkWin);

    // Configure Pointer Lock
    initPointerLock(canvas);

    // Start the rendering cycle
    window.requestAnimationFrame(frame);
}


/**
 * Initialize the WebGL library and canvas
 * @param {HTMLElement} canvas
 * @returns {WebGLRenderingContext} the WebGL context
 */
function initializeWebGL(canvas) {
    /** @type {WebGL2RenderingContext} */
    let gl = canvas.getContext("webgl2");
    if (!gl) {
        console.error("GL context not opened");
        return;
    }

    // Resize canvas to fill page
    utils.resizeCanvasToDisplaySize(gl.canvas);

    // Set global options
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // so the skybox passes the test at 1.0

    return gl;
}

/**
 * Initialize the pointer lock logic
 * @param {HTMLElement} canvas 
 */
function initPointerLock(canvas) {
    canvas.onclick = () => {
        canvas.requestPointerLock();
    };
    document.addEventListener("pointerlockchange", (e) => {
        e.bubbles = false;
        e.preventDefault();
        if (document.pointerLockElement === canvas) { // enter game
            document.removeEventListener("keydown", onOverlayKeys);
            app.ui.toggleOverlay(false);
            document.addEventListener("mousemove", mouseMovement);
            document.addEventListener("keydown", onKeydownInGame);
        } else { // exit game
            document.removeEventListener("keydown", onKeydownInGame);
            document.removeEventListener("mousemove", mouseMovement);
            document.addEventListener("keydown", onOverlayKeys);
        }
    });
}

/**
 * Moves the camera based on the currently pressed keys
 * @param {Camera} camera
 * @param {DOMHighResTimeStamp} timeDelta
 */
function keyboardMovement(camera, timeDelta) {
    // Move only if the player is interacting with the canvas
    if (document.pointerLockElement !== gl.canvas) {
        return;
    }
    timeDelta *= .001; // convert to seconds
    // Run if shift is pressed
    let posStep = (keyPressed["Shift"] ? 20 : 5) * timeDelta;
    let rotStep = 20 * timeDelta;

    if (keyPressed["w"]) {
        camera.move([0, 0, -posStep], !app.options.freeCamera);
    }
    if (keyPressed["s"]) {
        camera.move([0, 0, +posStep], !app.options.freeCamera);
    }
    if (keyPressed["d"]) {
        camera.move([+posStep, 0, 0], !app.options.freeCamera);
    }
    if (keyPressed["a"]) {
        camera.move([-posStep, 0, 0], !app.options.freeCamera);
    }
    if (keyPressed["ArrowUp"]) {
        camera.rotate([+rotStep, 0, 0]);
    }
    if (keyPressed["ArrowDown"]) {
        camera.rotate([-rotStep, 0, 0]);
    }
    if (keyPressed["ArrowRight"]) {
        camera.rotate([0, +rotStep, 0]);
    }
    if (keyPressed["ArrowLeft"]) {
        camera.rotate([0, -rotStep, 0]);
    }
}

/**
 * Handles camera rotation on mouse movement
 * @param {MouseEvent} e 
 */
function mouseMovement(e) {
    // Move only if the player is interacting with the canvas
    if (document.pointerLockElement !== gl.canvas) {
        return;
    }
    let camera = scene.camera;
    let step = 0.2;
    let deltaX = step * e.movementX;
    let deltaY = -step * e.movementY;

    camera.rotate([
        Math.abs(camera.rotation[0] + deltaY) > 85 ? 0 : deltaY,
        deltaX,
        0
    ]);
}

/**
 * Handles controls of the game overlay panels on keyboard events
 * @param {KeyboardEvent} e 
 */
function onOverlayKeys(e) {
    // Help menu
    if (e.altKey && e.key === "h") {
        console.log("Hey");
        let helpPanel = document.getElementById("help-panel");
        helpPanel.hidden = !helpPanel.hidden;
        e.preventDefault();
        return;
    }
    // Options menu
    if (e.altKey && e.key === "o") {
        let optPanel = document.getElementById("options-panel");
        optPanel.hidden = !optPanel.hidden;
        e.preventDefault();
        return;
    }
    // Side panel
    if (e.altKey && e.key === "s") {
        let sidePanel = document.getElementById("side-panel");
        sidePanel.hidden = !sidePanel.hidden;
        e.preventDefault();
        return;
    }
}

/**
 * Called when a game is pressed while the mouse is locked on the canvas
 * @param {KeyboardEvent} e 
 */
function onKeydownInGame(e) {
    // Toggle flashlight
    if (e.key === "l") {
        let torch = scene.spotLights["0"];
        torch.isActive = !torch.isActive;
        e.preventDefault();
        return;
    }
    // Toggle help arrow
    if (e.key === "h") {
        let arrow = scene.nodes.get("help_arrow");
        arrow.isVisible = !arrow.isVisible;
        e.preventDefault();
        return;
    }
    // Toggle viefinder
    if (e.key === "v") {
        app.ui.toggleViewFinder();
    }
}

/**
 * Initializes the app options with the values provided by the config.
 * Non-specified options will get default values.
 * @param {Object} customOptions
 */
function configureApp(app, customOptions) {
    // Default options
    app.options = {
        showFrameRate: false,
        showCollisionMeshes: false,
        freeCamera: false,
        showPosition: false,
    };
    Object.assign(app.options, customOptions);
}

/**
 * Configure the scene according to the JSON.
 * 
 * Will download the models, materials and textures and insert them into the
 * scene.
 * @param {Scene} scene 
 * @param {string} sceneName
 */
async function configureScene(scene, sceneName) {
    // Initialize the programs
    scene.programs.set("solid", new SolidColorProgram().init());
    scene.programs.set("blinn", new BlinnProgram().init());
    scene.programs.set("depth_map", new DepthMapProgram().init());

    // Download scene configuration (JSON)
    let sceneConfig = await (await fetch(`scenes/${sceneName}/config.json`)).json();

    // Download the models
    let models = await downloadModels(sceneConfig.models);

    // Set up each model
    for (let modelConfig of sceneConfig.models) {
        // Get the model by name
        let name = modelConfig.name;
        let model = models[name];

        // Insert into the dictionary of scene models
        if (!scene.models.has(name)) {
            scene.models.set(name, model);
        } else {
            console.error(`Model \"${name}}\" already exists`);
        }

        // Attach points
        model.attachPoints = modelConfig.attach_points;

        // Add type of this model (tree, bird, ...)
        model.type = modelConfig.type;
        // TODO: Add data according to type (e.g. attach points for trees ...)
        model.isSelectable = (model.type == "bird"); //|| (model.type == "tree"); // TODO: For debug only

        // Remove non-assigned maps from the materials
        for (let mtl of Object.values(model.materialsByIndex)) {
            // Iterate over the properties of each material
            for (let key in mtl) {
                // If a map exists, but has no texture assigned, then it is useless
                if (key.startsWith("map") && !mtl[key].texture) {
                    delete mtl[key];
                }
            }
        }

        // Select the rendering program
        let program = scene.programs.get(modelConfig.program ?? sceneConfig.defaultProgram);
        model.program = program;

        // Create the VAO
        model.vao = program.createVAO(model);
        // Create an element array buffer for each material
        model.indexBufferPerMaterial = program.createElementArrayBuffers(model);
        // Create the textures
        program.createTextures(model);

        // Select the type of collision mesh
        let cmClass;
        switch (modelConfig.collisionMesh) {
            case false: {
                cmClass = null;
                break;
            }
            default: {
                cmClass = CollisionMesh;
            }
        }
        // Create the collision mesh
        if (cmClass) {
            /** @type {CollisionMesh} */
            let cm = cmClass.forMesh(model);
            cm.program = scene.programs.get("solid");
            cm.vao = cm.program.createVAO(cm);
            cm.indexBufferPerMaterial = cm.program.createElementArrayBuffers(cm);
            model.collisionMesh = cm;

        }
    }

    let sceneGraphConfig = await (await fetch(`scenes/${sceneName}/scene-graph.json`)).json();

    // Build the scene graph from the root downwards
    scene.rootNode = buildSceneGraph(scene, sceneGraphConfig);

    // Set up ambient light color
    scene.ambientLight = sceneConfig.ambientLight;

    // Set up directional lights
    scene.directionalLights = new Array();
    for (let lConfig of sceneConfig.directionalLights) {
        let l = new DirectionalLight(lConfig.name, lConfig.color, lConfig.rotation, lConfig.isActive,
            lConfig.projectionOptions, lConfig.shadowMapSize);
        scene.directionalLights.push(l);
    }

    // Set up point lights
    scene.pointLights = new Array();
    for (let lConfig of sceneConfig.pointLights) {
        let l = new PointLight(lConfig.name, lConfig.color, lConfig.position, lConfig.target, lConfig.decay, lConfig.isActive);
        scene.pointLights.push(l);
    }

    // Set up spot lights
    scene.spotLights = new Array();
    for (let lConfig of sceneConfig.spotLights) {
        let l = new SpotLight(lConfig.name, lConfig.color, lConfig.position, lConfig.rotation,
            lConfig.innerCone, lConfig.outerCone, lConfig.target, lConfig.decay, lConfig.isActive, lConfig.projectionOptions, lConfig.shadowMapSize);
        scene.spotLights.push(l);
    }

    // Setup all the lamps in the scene

    // Init the target bird
    initBird();

    // Initialize the player camera and the objects attached to it
    initPlayer(scene, sceneConfig);

    initAnimations(scene, sceneName);

    // Create the skybox
    scene.skybox = await new Skybox().init(sceneConfig.skybox);
}

/**
 * Initializes the player (i.e. the camera)
 * and attaches objects to it.
 * @param {Scene} scene
 * @param {Object} sceneConfig
 */
function initPlayer(scene, sceneConfig) {
    // Put the camera in its initial position
    let camera = new Camera(
        sceneConfig.camera.position,
        sceneConfig.camera.rotation,
        sceneConfig.camera.fov_y,
        gl.canvas.clientWidth / gl.canvas.clientHeight,
        sceneConfig.camera.near_plane,
        sceneConfig.camera.far_plane
    );
    scene.camera = camera;

    // Add the camera to the scene graph
    scene.camera.setParent(scene.rootNode);

    // Add the torch as child of the camera
    scene.spotLights[0].setParent(scene.camera);

    // Create the help arrow and add it as a child to the player
    let arrow = new SceneObject(
        "help_arrow",
        scene.models.get("help_arrow"),
        [0, -1, -2.25],
        [0, 0, 0],
        [.75, .75, .75]
    );
    scene.nodes.set("help_arrow", arrow);
    arrow.isVisible = false;
    arrow.castsShadows = false;
    arrow.setParent(camera);

    // Force the arrow to always look at the bird
    arrow.lookAtTarget = app.targetObject;
}

/**
 * Place the bird randomy
 */
function initBird() {
    app.win = false;

    // Find all models of the birds
    let birdModels = [...scene.models.values()].filter(m => m.type == "bird");

    // Select one at random
    let birdModel = birdModels[Math.floor(Math.random() * birdModels.length)];
    let birdNode = null;
    if (!app.targetObject) {
        // Create Bird node
        birdNode = new AnimatedNode(
            "bird",
            [0, 0, 0],
            [0, 0, 0],
            [0.5, 0.5, 0.5],
            true,
            birdModel
        );
        scene.nodes.set("bird_animated", birdNode.animatedChild);
        app.targetObject = birdNode.animatedChild;
    } else {
        let animatedBird = app.targetObject;
        animatedBird.model = birdModel;
        birdNode = animatedBird.parent;
    }

    // Create list of trees
    let trees = [...scene.nodes.values()].filter(n => n instanceof SceneObject && n.model.type == "tree");

    let randomTree = trees[Math.floor(Math.random() * trees.length)];
    let attachPoint = randomTree.model.attachPoints[Math.floor(Math.random() * randomTree.model.attachPoints.length)];

    birdNode.position = attachPoint.position;
    birdNode.rotation = attachPoint.rotation;

    birdNode.setParent(randomTree);
}

/**
 * Initialize animations based on the current scene
 * @param {Scene} scene 
 * @param {string} sceneName 
 */
function initAnimations(scene, sceneName) {
    if (sceneName == "divine") {
        suzanne_circles = scene.nodes.get("suzannes_circle");
        suzanne_1 = scene.nodes.get("suzanne_1");
        suzanne_2 = scene.nodes.get("suzanne_2");
        suzanne_3 = scene.nodes.get("suzanne_3");

        suzanne_circles.setParent();
        suzanne_1.setParent();
        suzanne_2.setParent();
        suzanne_3.setParent();

        suzanne_circles = new AnimatedNode("suzannes_circle", suzanne_circles.position, suzanne_circles.rotation, suzanne_circles.scale, true, null, "rotate");
        suzanne_1 = new AnimatedNode("suzanne_1", suzanne_1.position, suzanne_1.rotation, suzanne_1.scale, true, suzanne_1.model, "hover");
        suzanne_2 = new AnimatedNode("suzanne_2", suzanne_2.position, suzanne_2.rotation, suzanne_2.scale, true, suzanne_2.model, "hover");
        suzanne_3 = new AnimatedNode("suzanne_3", suzanne_3.position, suzanne_3.rotation, suzanne_3.scale, true, suzanne_3.model, "hover");

        suzanne_1.setParent(suzanne_circles.animatedChild);
        suzanne_2.setParent(suzanne_circles.animatedChild);
        suzanne_3.setParent(suzanne_circles.animatedChild);

        scene.nodes.set("suzannes_circle", suzanne_circles);
        scene.nodes.set("suzanne_1", suzanne_1);
        scene.nodes.set("suzanne_2", suzanne_2);
        scene.nodes.set("suzanne_3", suzanne_3);

        suzanne_circles.setParent(scene.rootNode);
    }
}

/**
 * Builds the scene graph given the scene and the JSON configuration.
 * The nodes are also inserted into scene.nodes dictionary.
 * 
 * This function can be called recursively to generate a subtree of the graph.
 * 
 * @param {Scene} scene the scene to build the scene graph for
 * @param {Object} nodeConfig JSON configuration of the scene graph
 * @returns {Node} Root node of the scene graph
 */
function buildSceneGraph(scene, nodeConfig) {
    if (!nodeConfig) {
        return undefined;
    }
    let models = scene.models;

    // Create the current node/object
    let current;
    if (nodeConfig.model) {
        let model = models.get(nodeConfig.model);
        current = new SceneObject(
            nodeConfig.name,
            model,
            nodeConfig.position,
            nodeConfig.rotation,
            nodeConfig.scale,
            nodeConfig.isVisible ?? true,
            nodeConfig.isSelectable ?? model.isSelectable
        );
    } else {
        current = new SceneNode(
            nodeConfig.name,
            nodeConfig.position,
            nodeConfig.rotation,
            nodeConfig.scale,
            nodeConfig.isVisible ?? true,
        );
    }
    scene.nodes.set(current.name, current);

    // Create the children
    for (let childCfg of (nodeConfig.children ?? [])) {
        // Build the child tree recursively
        let child = buildSceneGraph(scene, childCfg);
        // Set the parent (will also add this node to the parent's children)
        child.setParent(current);
    }

    return current;
}

/**
 * Function called at every frame
 * @param {DOMHighResTimeStamp} time 
 */
function frame(time) {
    // Time interval
    if (startTime === undefined) {
        startTime = time;
        lastFrame = time;
    }
    let timeDelta = time - lastFrame;

    // Update UI
    app.ui.updateFrameRate(1 / (timeDelta * .001));
    app.ui.updatePosition(scene.camera.getWorldPosition());

    // Update the camera
    keyboardMovement(scene.camera, timeDelta);
    scene.camera.aspect_ratio = gl.canvas.clientWidth / gl.canvas.clientHeight;

    // Update the world matrices of all the objects in the graph, recursively
    scene.rootNode.updateWorldMatrix(null, time);

    // Perform raycasting
    rayCasting(scene);

    // Draw
    scene.draw(app.options.showCollisionMeshes);

    // Save timestamp for next call
    lastFrame = time;

    // Reschedule at next frame
    window.requestAnimationFrame(frame);
}

/**
 * Perform raycasting
 * @param {Scene} scene 
 * @param {Scene} maxDistance maximum distance between the camera and the center of the object 
 */
function rayCasting(scene, maxDistance = 20) {
    if (document.pointerLockElement !== gl.canvas) {
        return;
    }
    let camera = scene.camera;
    let ray_origin = camera.getWorldPosition();
    let ray_dir = camera.getDirection();

    let selectedObject = null;
    let minDistance = maxDistance;
    for (let [_, object] of scene.nodes) {
        if (!object instanceof SceneObject || !object.isSelectable || !object.isVisible || !object.model.collisionMesh) {
            continue;
        }
        // Reset selection state
        object.deselect();

        // Early reject if the object center is very far away
        if (utils.distance(camera.getWorldPosition(), object.getWorldPosition()) > maxDistance) {
            continue;
        }

        // Intersect the camera ray with the collision mesh
        /** @type {CollisionMesh} */
        let collisionMesh = object.model.collisionMesh;
        let d = collisionMesh.rayIntersect(ray_origin, ray_dir, object.worldMatrix);

        // Choose object with the minimum distance
        if (d !== false && d < minDistance) { // nearest intersection so far
            selectedObject = object;
            minDistance = d;
        }
    }

    // Update selection state of selecte object
    if (selectedObject) {
        selectedObject.select();
    }
}

function checkWin() {
    if (document.getElementById("win-panel").hidden == false) {
        initBird();
        document.getElementById("win-panel").hidden = true;
        return;
    }
    if (app.targetObject.isSelected == true) {
        document.getElementById("win-panel").hidden = false;
        app.win = true;
    }
}

window.onload = main;