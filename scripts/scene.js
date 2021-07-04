class Node {
    /**
     * Unique of the object in the scene
     * @type {string}
     */
    name;

    /**
     * List of child nodes (will be transormed)
     * @type {Node[]}
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
     * @type {Node}
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
        this.localMatrix = _makeLocal();
        this.worldMatrix = this.localMatrix;
    }

    /**
     * Creates a local transformation matrix from this node's
     * position, rotation and scale.
     * @returns {number[]}
     */
    _makeLocal() {
        // Translate
        var m = utils.MakeTranslateMatrix(...position);
        // Rotate
        m = utils.multiplyMatrices(m,
            utils.MakeRotateZMatrix(rotation[2]));
        m = utils.multiplyMatrices(m,
            utils.MakeRotateYMatrix(rotation[1]));
        m = utils.multiplyMatrices(m,
            utils.MakeRotateXMatrix(rotation[0]));
        // Scale
        m = utils.multiplyMatrices(m,
            utils.MakeScaleNuMatrix(...scale));

        return m;
    }

    /**
     * Set the parent
     * @param {Node} parent 
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

class SceneObject extends Node {
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
     * @type {Node}
     */
    rootNode;

    createTexture(path) {
        // Create the texture
        var texture = gl.createTexture();
        // use texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Asynchronously load the texture
        var image = new Image();
        image.src = path;
        image.onload = function () {
            //Make sure this is the active one
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.generateMipmap(gl.TEXTURE_2D);
        };

        return texture;
    }

}