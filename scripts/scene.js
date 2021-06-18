class Node {
    // List of child nodes (will be transormed)
    children = [];

    // Transform of the object w.r.t. the parent
    localMatrix = null;

    // Transform of the object w.r.t. the world origin
    worldMatrix = null;

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
    /** @type {Mesh} */
    mesh;

    /** Vertex Array Object
     * @type {WebGLVertexArrayObject}
     */
    vao;

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
     * WebGL program (Vertex shader + fragment shader).
     * @type {WebGLProgram}
     */
    programInfo;

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