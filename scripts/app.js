/** @type {WebGL2RenderingContext} */
var gl;
var scene;
var keyPressed = {};
var startTime;
var lastFrame;

async function main() {
    let canvas = document.getElementById("c");
    gl = initializeWebGL(canvas);

    // Create the scene
    scene = new Scene();
    await configureScene(scene);

    // Configure event listeners
    document.addEventListener("keydown", (e) => {
        // If a single letter is pressed, save it as lowercase
        // otherwise it causes problems when shift is also pressed to run 
        let key = e.key.length == 1 ? e.key.toLowerCase() : e.key;
        keyPressed[key] = true;
    });
    document.addEventListener("keyup", (e) => {
        let key = e.key.length == 1 ? e.key.toLowerCase() : e.key;
        delete keyPressed[key]
    });

    // Configure Pointer Lock
    initPointerLock(canvas);

    // Start the rendering cycle
    window.requestAnimationFrame(() => frame(scene));
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
    }
    document.addEventListener("pointerlockchange", () => {
        if (document.pointerLockElement === canvas) {
            document.addEventListener("mousemove", mouseMovement);
        } else {
            document.removeEventListener("mousemove", mouseMovement);
        }
    })
}

/**
 * Moves the camera based on the currently pressed keys
 * @param {Camera} camera
 * @param {DOMHighResTimeStamp} timeDelta
 */
function keyboardMovement(camera, timeDelta) {
    timeDelta *= .001; // convert to seconds
    // Run if shift is pressed
    let posStep = (keyPressed["Shift"] ? 20 : 5) * timeDelta;
    let rotStep = 1 * timeDelta;

    if (keyPressed["w"]) {
        camera.move([0, 0, -posStep]);
    }
    if (keyPressed["s"]) {
        camera.move([0, 0, +posStep]);
    }
    if (keyPressed["d"]) {
        camera.move([+posStep, 0, 0]);
    }
    if (keyPressed["a"]) {
        camera.move([-posStep, 0, 0]);
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
 * @param {Camera} camera 
 */
function mouseMovement(e) {
    let camera = scene.camera;
    let step = 0.2;
    let deltaX = step * e.movementX;
    let deltaY = -step * e.movementY;

    camera.rotate([
        deltaY,
        Math.abs(camera.rotation + deltaX) > 85 ? 0 : deltaX,
        0
    ]);
}

/**
 * Configure the scene according to the JSON.
 * 
 * Will download the models, materials and textures and insert them into the
 * scene.
 * @param {Scene} scene 
 */
async function configureScene(scene) {
    // Initialize the programs
    scene.programs.set("lambert", new LambertProgram().init());

    // Download scene configuration (JSON)
    let sceneConfig = await (await fetch("config.json")).json();

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

        // Add type of this model (tree, bird, ...)
        model.type = modelConfig.type
        // TODO: Add data according to type (e.g. attach points for trees ...)

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

        // TODO: Finish collision mesh creation
        model.collisionMesh = BoundingBox.forMesh(model);
    }

    let sceneGraphConfig = await (await fetch("scene-graph.json")).json();

    // Build the scene graph from the root downwards
    scene.rootNode = buildSceneGraph(scene, sceneGraphConfig);

    // Put the camera in its initial position
    scene.camera = new Camera(
        sceneConfig.camera.position,
        sceneConfig.camera.rotation,
        sceneConfig.camera.fov_y,
        gl.canvas.clientWidth / gl.canvas.clientHeight,
        sceneConfig.camera.near_plane,
        sceneConfig.camera.far_plane
    );

    // Set up directional lights
    scene.directionalLights = new Array();
    for (let lConfig of sceneConfig.directionalLights) {
        let l = new DirectionalLight(lConfig.name, lConfig.color, lConfig.direction);
        scene.directionalLights.push(l);
    }

    // Create the skybox
    scene.skybox = await new Skybox().init(sceneConfig.skybox);
}

/**
 * Builds the scene graph given the scene and the JSON configuration.
 * The objects are also inserted into scene.objects dictionary.
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
            nodeConfig.scale
        );
        scene.objects.set(current.name, current);
    } else {
        current = new SceneNode(
            nodeConfig.name,
            nodeConfig.position,
            nodeConfig.rotation,
            nodeConfig.scale
        );
    }

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

    // Update the camera
    keyboardMovement(scene.camera, timeDelta);
    scene.camera.aspect_ratio = gl.canvas.clientWidth / gl.canvas.clientHeight;

    // Perform raycasting
    rayCasting(scene);

    // Clear and resize the viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(1, 1, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw
    scene.draw();

    // Save timestamp for next call
    lastFrame = time;

    // Reschedule at next frame
    window.requestAnimationFrame(frame);
}

/**
 * Perform raycasting
 * @param {Scene} scene 
 */
function rayCasting(scene) {
    if (document.pointerLockElement !== gl.canvas) {
        return;
    }
    let camera = scene.camera;
    let ray_origin = camera.position;
    let ray_dir = camera.getDirection();

    let selectedObject = null;
    let minDistance = 10e18;
    for (let [_, object] of scene.objects) {
        // Reset selection state
        object.deselect();

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

window.onload = main