class Node {
    // List of child nodes (will be transormed)
    children = [];

    // Transform of the object w.r.t. the parent
    localMatrix = null;

    // Transform of the object w.r.t. the world origin
    worldMatrix = null;

    /**
     * Scale factor of this model
     * @type {int}
     */
    scale;

    /**
     * Position in XYZ coordinates of the object
     */
    position = [];

    /**
     * Rotation of the object in XYZ Euler coordinates
     */
    rotation = [];

    // Pointer to the parent
    parent = null;

    // Set the parent
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
     * @param {*} matrix 
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
    /** Vertex Array Object
     * @type {WebGLVertexArrayObject}
     */
    vao;

    /**
     * WebGL program (Vertex shader + fragment shader).
     * @type {Program}
     */
    program;

    /** WebGL diffuse texture
     * @type {WebGLTexture}
     */
    diffuseMap;

    /**
     * WebGL normal map.
     * If not set, the vertex normals will be used.
     * @type {WebGLTexture}
     */
    normalMap;

    /**
     * Length of the Elements buffer
     * @type {int}
     */
    bufferLength;

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
     * Dictionary containing all the Vertex Array Objects of this scene.
     * @type {Map<String, WebGLVertexArrayObject>}
     */
    /* TODO: Do we still need this? */
    vaos = new Map();

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
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.generateMipmap(gl.TEXTURE_2D);
        };

        return texture;
    }

}