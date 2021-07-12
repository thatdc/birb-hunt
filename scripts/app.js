var gl;
var scene;
var keyPressed = {};

async function main() {
    let canvas = document.getElementById("c");
    gl = initializeWebGL(canvas);

    // Create the scene
    scene = new Scene();
    await configureScene(scene);

    // Configure event listeners
    document.addEventListener("keydown", (e) => { keyPressed[e.key] = true });
    document.addEventListener("keyup", (e) => { delete keyPressed[e.key] });

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
    /** @type {WebGLRenderingContext} */
    gl = canvas.getContext("webgl2");
    if (!gl) {
        console.error("GL context not opened");
        return;
    }

    // Resize canvas to fill page
    utils.resizeCanvasToDisplaySize(gl.canvas);

    // Set global options
    gl.enable(gl.DEPTH_TEST);

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
 */
function keyboardMovement(camera) {
    // TODO: Use elapsed time
    let posStep = keyPressed["Shift"] ? 1 : 0.2;
    let rotStep = 1;

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
    }

    let sceneGraphConfig = await (await fetch("scene-graph.json")).json();

    // Build the scene graph from the root downwards
    scene.rootNode = buildSceneGraph(scene.models, sceneGraphConfig);

    // Put the camera in its initial position
    scene.camera = new Camera(
        sceneConfig.camera.position,
        sceneConfig.camera.rotation,
        sceneConfig.camera.fov_y,
        gl.canvas.width / gl.canvas.height,
        sceneConfig.camera.near_plane,
        sceneConfig.camera.far_plane
    );
}

/**
 * Builds the scene graph given the models and the JSON configuration.
 * 
 * This function can be called recursively to generate a subtree of the graph.
 * 
 * @param {Map<String, Mesh} models dictionary of all available models
 * @param {Object} nodeConfig JSON configuration of the scene graph
 * @returns {Node} Root node of the scene graph
 */
function buildSceneGraph(models, nodeConfig) {
    if (!nodeConfig) {
        return undefined;
    }

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
        let child = buildSceneGraph(models, childCfg);
        // Set the parent (will also add this node to the parent's children)
        child.setParent(current);
    }

    return current;
}

/**
 * Function called at every frame
 * @param {Scene} scene 
 */
function frame(scene) {
    // Update the camera
    keyboardMovement(scene.camera);
    scene.camera.aspect_ratio = gl.canvas.width / gl.canvas.height;

    // Get the view-projection matrix
    let viewProjectionMatrix = scene.camera.getViewProjectionMatrix();

    // Clear and resize the viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(1, 1, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw
    scene._drawTree(viewProjectionMatrix, scene.rootNode);

    // Reschedule at next frame
    window.requestAnimationFrame(() => frame(scene));
}

window.onload = main