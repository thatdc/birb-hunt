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
    sceneConfig = await (await fetch("config.json")).json();

    // Download the models
    models = await downloadModels(sceneConfig.models);

    // Insert additional data from the JSON
    for (const modelConfig of sceneConfig.models) {
        let name = modelConfig.name;
        models[name].type = modelConfig.type
        // TODO: Add data according to type (e.g. attach points for trees ...)
    }

    // Attach models to the global Scene object
    scene.models = models;
}

window.onload = main