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
    var canvas = document.getElementById("c");
    /** @type {WebGLRenderingContext} */
    gl = canvas.getContext("webgl2");
    if (!gl) {
        document.write("GL context not opened");
        return;
    }
    utils.resizeCanvasToDisplaySize(gl.canvas);

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

        // Type of this model (tree, bird, ...)
        model.type = modelConfig.type
        // TODO: Add data according to type (e.g. attach points for trees ...)

        // Insert into the dictionary of scene models
        if (!scene.models.has(name)) {
            scene.models.set(name, model);
        } else {
            console.error(`Model \"${name}}\" already exists`);
        }

        // Select the rendering program
        let program = scene.programs.get(modelConfig.program ?? sceneConfig.defaultProgram);
        model.program = program;

        // Create the VAO
        model.vao = program.createVAO(model);
    }

}

window.onload = main