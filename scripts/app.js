var scene = new Scene();

async function main() {
    configureScene(scene);
}

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