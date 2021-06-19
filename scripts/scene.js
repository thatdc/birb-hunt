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
    /** Vertex Array Object
     * @type {WebGLVertexArrayObject}
     */
    vao;

    /**
     * WebGL program (Vertex shader + fragment shader).
     * @type {WebGLProgram}
     */
    programInfo;

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
     * Dictionary containing all the Vertex Array Objects of this scene.
     */
    vaos = {};

    /**
     * Dictionary containing all the texture objects.
     * @type {string: WebGLTexture}
     */
    textures = {};

    /**
     * The WebGL context object
     * @type {WebGL2RenderingContext}
     */
    gl;

    /**
     * Dictionary containing the program objects.
     */
     programs = {};

    /**
     * Root node of a scene tree
     * @type {Node}
     */
     rootNode;

    createVAO(positionAttributeLocation, normalAttributeLocation, uvAttributeLocation, vertexPositionData, normalData, uvData, indexData){
        var vao = gl.createVertexArray();

        // Create buffers with data

        gl.bindVertexArray(vao);
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        var normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        var uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvData), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(uvAttributeLocation);
        gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);

        return vao;
    }

    createTexture(path){
        // Create the texture
        var texture = gl.createTexture();
        // use texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Asynchronously load the texture
        var image = new Image();
        image.src = path;
        image.onload = function() {
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