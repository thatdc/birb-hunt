class SceneNode {
    /**
     * Unique of the object in the scene
     * @type {string}
     */
    name;

    /**
     * List of child nodes (will be transormed)
     * @type {SceneNode[]}
     */
    children;

    /**
     * Transform of the object w.r.t. the parent
     * @type {number[]}
     */
    localMatrix;

    /**
     * Transform of the object w.r.t. the world origin
     * @type {number[]}
     */
    worldMatrix;

    /**
     * Scale factor of this model [X Y Z]
     * @type {number[]}
     */
    scale;

    /**
     * Position in XYZ coordinates of the object
     * @type {number[]}
     */
    position;

    /**
     * Rotation of the object in XYZ Euler coordinates (in degrees)
     * @type {number[]}
     */
    rotation;

    /**
     * Pointer to the parent
     * @type {SceneNode}
     */
    parent = null;

    /**
     * Creates an empty node with no parent and no children.
     * 
     * All transformations refer to the parent node.
     * 
     * @param {string} name Unique name of this node in the scene
     * @param {number[]} position XYZ coordinates
     * @param {number[]} rotation XYZ euler angles, in degrees
     * @param {number[]} scale XYZ scaling factors
     */
    constructor(
        name,
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1]
    ) {
        this.name = name;
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.parent = null;
        this.children = [];
        this.localMatrix = this._makeLocal();
        this.worldMatrix = this.localMatrix;
    }

    /**
     * Creates a local transformation matrix from this node's
     * position, rotation and scale.
     * @returns {number[]}
     */
    _makeLocal() {
        // Translate
        let m = utils.MakeTranslateMatrix(...this.position);
        // Rotate
        m = utils.multiplyMatrices(m,
            utils.MakeRotateXYZMatrix(...this.rotation));
        // Scale
        m = utils.multiplyMatrices(m,
            utils.MakeScaleNuMatrix(...this.scale));

        return m;
    }

    /**
     * Set the parent
     * @param {SceneNode} parent 
     */
    setParent(parent) {
        if (this.parent) {
            var ndx = this.parent.children.indexOf(this);
            if (ndx >= 0) {
                this.parent.children.splice(ndx, 1);
            }
        }

        // Add us to our new parent
        if (parent) {
            parent.children.push(this);
        }
        this.parent = parent;
    }


    /**
     * Update world matrix of itself and recursively to the children
     * @param {number[][]} matrix 
     */
    updateWorldMatrix(matrix) {
        if (matrix) {
            // a matrix was passed in so do the math
            this.worldMatrix = utils.multiplyMatrices(matrix, this.localMatrix);
        } else {
            // no matrix was passed in so just copy.
            utils.copy(this.localMatrix, this.worldMatrix);
        }

        // now process all the children
        var worldMatrix = this.worldMatrix;
        this.children.forEach(function (child) {
            child.updateWorldMatrix(worldMatrix);
        });
    };
}

class SceneObject extends SceneNode {
    /** Model associated to this object.
     * @type {Mesh}
     */
    model;

    /**
     * Creates an object with no parent and no children.
     * 
     * It is assumed that the given model has been already initialized with
     * the VAO, the element array buffers and textures.
     * 
     * All transformations refer to the parent node.
     * 
     * @param {string} name Unique name of this node in the scene
     * @param {Mesh} model Model associated to this object
     * @param {number[]} position XYZ coordinates
     * @param {number[]} rotation XYZ euler angles, in degrees
     * @param {number[]} scale XYZ scaling factors
     * @param {number[]} localMatrix Transform of the object w.r.t. the parent
     */
    constructor(
        name,
        model,
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1]
    ) {
        super(name, position, rotation, scale);
        this.model = model;
    }

    /**
     * Create a new scene object from a JSON description
     * @return {SceneObject}
     */
    static fromSceneConfig() {
        ;
    }
}

class Scene {
    /**
     * Dictionary containing all the models, as loaded by downloadModels
     * @type {Map<String, Mesh>}
     */
    models = new Map();

    /**
     * Dictionary containing the program objects.
     * @type {Map<String, Program>}
     */
    programs = new Map();

    /**
     * Root node of a scene tree
     * @type {SceneNode}
     */
    rootNode;

    /**
     * Current camera
     * @type {Camera}
     */
    camera;

    /**
     * Current skybox
     * @type {Skybox}
     */
    skybox;

    /**
     * Directional lights
     * @type {DirectionalLight[]}
     */
    directionalLights;

    /**
     * Draws the scene
     */
    draw() {
        let viewProjectionMatrix = this.camera.getViewProjectionMatrix();
        // Draw the objects
        this._drawTree(viewProjectionMatrix, this.rootNode);

        // Draw the skybox
        let cameraMatrix = utils.MakeRotateXYZMatrix(
            ...this.camera.rotation.map(x => -x));
        this.skybox.draw(cameraMatrix);
    }

    /**
     * Draws the given subtree
     * @param {number[]} viewProjectionMatrix
     * @param {SceneNode} root root of the subtree 
     */
    _drawTree(viewProjectionMatrix, root) {
        if (root instanceof SceneObject) {
            // Set the correct program
            /** @type {Program} */
            let program = root.model.program;
            gl.useProgram(program.glProgram);
            // Set the uniforms and perform one draw call per material
            program.drawObject(this, viewProjectionMatrix, root);
        }

        for (let child of root.children) {
            this._drawTree(viewProjectionMatrix, child);
        }
    }
}