var gl;
var scene = new Scene();

async function main() {
    gl = initializeWebGL();
    configureScene(scene);
}


/**
 * Initialize the WebGL library and canvas
 * @returns {WebGLRenderingContext} the WebGL context
 */
function initializeWebGL() {
    // Get canvas and context
    var canvas = document.getElementById("c");
    /** @type {WebGLRenderingContext} */
    gl = canvas.getContext("webgl2");
    if (!gl) {
        console.error("GL context not opened");
        return;
    }

    // Resize canvas to fill page
    utils.resizeCanvasToDisplaySize(gl.canvas);

    // Set global pixelstore options
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Initialize the programs
    scene.programs.set("lambert", new LambertProgram());

    return gl;
}

/**
 * Configure the scene according to the JSON.
 * 
 * Will download the models, materials and textures and insert them into the
 * scene.
 * @param {Scene} scene 
 */
async function configureScene(scene) {
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
    }

}

window.onload = main