class Program {
    /** WebGL compiled and linked program
     * @type {WebGLProgram}
    */
    glProgram;

    /** Vertex attributes */
    positionAttribLocation;

    /** Uniforms */
    matrixLocation;

    /**
     * Initialize the program before use:
     * - Downloads and compiles the shaders
     * - Saves the locations of attributes and uniforms
     * @param {string} vs_url url of the vertex shader
     * @param {string} fs_url url of the fragment shader
     * @returns {Program} a reference to the object
     */
    async init(vs_url, fs_url) {
        await this.downloadShaders(vs_url, fs_url)
            .then(([vs_src, fs_src]) => { // Succesfully downloaded
                let vs = utils.createShader(gl, gl.VERTEX_SHADER, vs_src);
                let fs = utils.createShader(gl, gl.FRAGMENT_SHADER, fs_src);

                this.glProgram = utils.createProgram(gl, vs, fs);
                this.initLocations()
            })
            .catch((e) => { // Error
                console.error(e);
            });

        return this;
    }

    async downloadShaders(vs_url, fs_url) {
        // Download the shaders
        let vs_src = await (await fetch(vs_url)).text();
        let fs_src = await (await fetch(fs_url)).text();

        return [vs_src, fs_src];
    }

    /**
     * Initialize locations for: vertex attributes,
     * transformation matrices
     */
    initLocations() {
        let p = this.glProgram;

        // Vertex attributes
        this.positionAttribLocation = gl.getAttribLocation(p, "a_position");

        // Transformation matrices
        this.matrixLocation = gl.getUniformLocation(p, "u_matrix");
    }

    /**
     * Creates a Vertex Array Object for the given mesh.
     * 
     * Will create the following buffers for the attributes:
     * <ul>
     *  <li> vertexBuffer </li>
     * </ul>
     * NOTE: This does not insert the Element Array Buffer into the VAO.
     * 
     * @param {Mesh} mesh 
     * @returns {WebGLVertexArrayObject}
     */
    createVAO(mesh) {
        // Create new empy VAO
        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // Create vertex attribute buffers
        mesh.vertexBuffer = this._createVertexAttribBuffer(new Float32Array(mesh.vertices), this.positionAttribLocation, 3);

        // This avoids further buffers to be included in the VAO
        gl.bindVertexArray(null);

        return vao;
    }

    /**
     * Creates an element array buffer for each material of the mesh.
     * 
     * The index data is read from the array {@code mesh.indicesPerMaterial}.
     * @param {Mesh} mesh 
     * @returns {Array<WebGLBuffer>} array of element array buffers,
     * indexed by material
     */
    createElementArrayBuffers(mesh) {
        let indexBufferPerMaterial = new Array();
        // Iterate over the array elements
        for (let indices of mesh.indicesPerMaterial) {
            let indexBuffer = this._createElementArrayBuffer(new Uint16Array(indices));
            indexBufferPerMaterial.push(indexBuffer);
        }
        return indexBufferPerMaterial;
    }

    /**
     * Creates a VBO and binds it to the specific attribute.
     * 
     * @param {Array} data the data to be copied into the buffer
     * @param {GLint} attribLocation the location of the attribute
     * @param {GLint} size the number of components per vertex
     * @param {GLenum} type type of each component (e.g. {@code gl.FLOAT})
     * @returns {WebGLBuffer} buffer with the data
     */
    _createVertexAttribBuffer(data, attribLocation, size = 3, type = gl.FLOAT) {
        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(attribLocation);
        gl.vertexAttribPointer(attribLocation, size, type, false, 0, 0);
        return buffer;
    }

    /**
     * Creates an element array buffer with the given indices.
     * 
     * @param {Array} data array of vertex indices that compose the triangles
     */
    _createElementArrayBuffer(data) {
        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
        return buffer;
    }

    /**
     * Sets up the light uniforms, given the scene's lights
     * @param {Scene} scene 
     */
    setLightUniforms(scene) {
        ;
    }

    /**
     * Set the material-related uniforms for the given object
     * @param {Material} mtl 
     */
    setMaterialUniforms(mtl) {
        ;
    }

    /**
     * Set additional uniforms for the given object
     * @param {SceneObject} object 
     */
    setAdditionalUniforms(object) {
        ;
    }

    /**
     * Draws the given object
     * @param {number[]} viewProjectionMatrix
     * @param {SceneObject} object
     * @param {GLenum} mode 
     */
    drawObject(scene, viewProjectionMatrix, object, mode = gl.TRIANGLES) {
        let model = object.model;

        // Check if this program is not already active
        if (gl.getParameter(gl.CURRENT_PROGRAM) != this.glProgram) {
            // Choose to use this program
            gl.useProgram(this.glProgram);

            // Set object-independent uniforms:
            // Lights
            this.setLightUniforms(scene);
        }

        // Transformation matrices
        this.setMatrixUniforms(viewProjectionMatrix, object);

        // Set additional uniforms
        this.setAdditionalUniforms(object);

        // Bind VAO
        gl.bindVertexArray(model.vao);

        // Draw each material separately
        for (let [i, mtl] of Object.entries(model.materialsByIndex)) {
            // Material uniforms
            this.setMaterialUniforms(mtl);
            // Bind Element Array Buffer
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBufferPerMaterial[i]);

            // Draw call
            gl.drawElements(mode, model.indicesPerMaterial[i].length, gl.UNSIGNED_SHORT, 0);
        }
        // Prevent leakage
        gl.bindVertexArray(null);
    }

    /**
     * Sets up the {@code u_matrix} uniform
     * for the given object.
     * @param {number[]} viewProjectionMatrix 
     * @param {SceneObject} object 
     */
    setMatrixUniforms(viewProjectionMatrix, object) {
        // World-view-projection matrix
        let matrix = utils.multiplyMatrices(viewProjectionMatrix, object.worldMatrix);
        gl.uniformMatrix4fv(this.matrixLocation, true, matrix);
    }
}

class TexturedProgram extends Program {
    /** Vertex attributes */
    normalAttribLocation;
    uvAttribLocation;

    /** Uniforms */
    normalMatrixLocation;

    /**
     * Initialize locations for: vertex attributes,
     * transformation matrices
     */
    initLocations() {
        // Initialize position and matrix
        super.initLocations();
        let p = this.glProgram;

        // Vertex attributes
        this.normalAttribLocation = gl.getAttribLocation(p, "a_normal");
        this.uvAttribLocation = gl.getAttribLocation(p, "a_uv");

        // Transformation matrices
        this.normalMatrixLocation = gl.getUniformLocation(p, "u_normalMatrix");
    }

    /**
     * Creates a Vertex Array Object for the given mesh.
     * 
     * Will create the following buffers for the attributes:
     * <ul>
     *  <li> vertexBuffer </li>
     *  <li> normalBuffer </li>
     *  <li> textureBuffer </li>
     * </ul>
     * NOTE: This does not insert the Element Array Buffer into the VAO.
     * 
     * @param {Mesh} mesh 
     * @returns {WebGLVertexArrayObject}
     */
    createVAO(mesh) {
        // Create VAO with vertex buffer
        let vao = super.createVAO(mesh);
        gl.bindVertexArray(vao);

        // Create vertex attribute buffers
        mesh.normalBuffer = this._createVertexAttribBuffer(new Float32Array(mesh.vertexNormals), this.normalAttribLocation, 3);
        mesh.textureBuffer = this._createVertexAttribBuffer(new Float32Array(mesh.textures), this.uvAttribLocation, 2);

        // This avoids further buffers to be included in the VAO
        gl.bindVertexArray(null);

        return vao;
    }



    /**
     * Create all the WebGL textures for the given mesh.
     * 
     * For each map of each material of the mesh that has {@code map.texture}
     * set, it creates a WebGLTexture, which is saved at {@code map.glTexture}
     * 
     * @param {Mesh} mesh 
     */
    createTextures(mesh) {
        for (let mtl of Object.values(mesh.materialsByIndex)) {
            // Iterare over the relevant maps
            for (let mapName of ["mapDiffuse", "mapNormal", "mapSpecular"]) {
                let map = mtl[mapName];
                if (map && map.texture) {
                    // Create the texture
                    map.glTexture = this._createTexture2D(map);
                }
            }
        }
    }

    /**
     * Creates a 2D texture from a given map.
     * 
     * @param {TextureMapData} map the texture map from the material
     * @return {WebGLTexture} created texture
     */
    _createTexture2D(map) {
        // Flip the Y direction of the uv coordinates
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // Create texture
        let tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // Load the image
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,                  // mip-map level
            gl.RGBA,            // internal format
            gl.RGBA,            // source format
            gl.UNSIGNED_BYTE,   // source type
            map.texture         // image
        );

        // Set magnification and minification filters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        // Generate mip maps
        gl.generateMipmap(gl.TEXTURE_2D);

        return tex;
    }    

    /**
     * Sets up the {@code u_matrix} and {@code u_normalMatrix} uniforms
     * for the given object.
     * @param {number[]} viewProjectionMatrix 
     * @param {SceneObject} object 
     */
     setMatrixUniforms(viewProjectionMatrix, object) {
        // World-view-projection matrix
        super.setMatrixUniforms(viewProjectionMatrix, object);
        // Normal matrix
        let normalMatrix = utils.invertMatrix(utils.transposeMatrix(object.worldMatrix));
        gl.uniformMatrix4fv(this.normalMatrixLocation, true, normalMatrix);
    }
}

class LambertProgram extends TexturedProgram {

    N_DIRECTIONAL_LIGHTS = 1;

    /**
     * Initialize the program before use:
     * - Downloads and compiles the shaders
     * - Saves the locations of attributes and uniforms
     * @returns {LambertProgram} a reference to the object
     */
    init() {
        super.init("shaders/vs.glsl", "shaders/fs_lambert.glsl");
        return this;
    }

    /**
     * Initialize all locations of attributes and uniforms.
     */
    initLocations() {
        let p = this.glProgram;

        // Call on parent
        super.initLocations();

        // Flags
        this.useMapDiffuseLocation = gl.getUniformLocation(p, "b_useMapDiffuse");
        this.useMapNormalLocation = gl.getUniformLocation(p, "b_useMapNormal");
        this.useMapSpecularLocation = gl.getUniformLocation(p, "b_useMapSpecular");

        // Material colors
        this.ambientLocation = gl.getUniformLocation(p, "u_ambient");
        this.diffuseLocation = gl.getUniformLocation(p, "u_diffuse");
        this.specularLocation = gl.getUniformLocation(p, "u_specular");

        // Specular info
        this.specularExponentLocation = gl.getUniformLocation(p, "u_specularExponent");

        // Maps
        this.mapDiffuseLocation = gl.getUniformLocation(p, "u_mapDiffuse");
        this.mapNormalLocation = gl.getUniformLocation(p, "u_mapNormal");
        this.mapSpecularLocation = gl.getUniformLocation(p, "u_mapSpecular");
        this.mapEnvLocation = gl.getUniformLocation(p, "u_mapEnv");

        // Directional lights
        this.directionalLightLocations = new Array();
        for (let i = 0; i < this.N_DIRECTIONAL_LIGHTS; i++) {
            this.directionalLightLocations[i] = {
                "color": gl.getUniformLocation(p, `u_directionalLights[${i}].color`),
                "direction": gl.getUniformLocation(p, `u_directionalLights[${i}].direction`)
            };
        }

        // Highlight color (used to highlight selected objects)
        this.highlightColorLocation = gl.getUniformLocation(p, "u_highlightColor");
    }

    /**
     * Sets up the light uniforms, given the scene's lights
     * @param {Scene} scene 
     */
    setLightUniforms(scene) {
        gl.program
        // TODO: Finish this function when we have defined lights
        // Environment map (for ambient lighting and spec. reflexions)
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene.skybox.getCurrentMap());
        gl.uniform1i(this.mapEnvLocation, 3);

        // Directional lights
        for (let i in scene.directionalLights) {
            let l = scene.directionalLights[i];
            let lLoc = this.directionalLightLocations[i];
            l.setUniforms(lLoc);
        }
    }

    /**
     * Set the material-related uniforms for the given object
     * @param {Material} mtl 
     */
    setMaterialUniforms(mtl) {
        // Ambient color
        gl.uniform3fv(this.ambientLocation, mtl.ambient);

        // Diffuse color (map/scalar)
        if (mtl.mapDiffuse) {
            gl.uniform1i(this.useMapDiffuseLocation, 1);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, mtl.mapDiffuse.glTexture);
            gl.uniform1i(this.mapDiffuseLocation, 0);
        } else {
            gl.uniform1i(this.useMapDiffuseLocation, 0);
            gl.uniform3fv(this.diffuseLocation, mtl.diffuse);
        }
        // Normal map
        if (mtl.mapNormal) {
            gl.uniform1i(this.useMapNormalLocation, 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, mtl.mapNormal.glTexture);
            gl.uniform1i(this.mapNormalLocation, 1);
        } else {
            gl.uniform1i(this.useMapNormalLocation, 0);
            // The normal is derived from the vertex shader
        }
        // Specular color (map/scalar)
        if (mtl.mapSpecular) {
            gl.uniform1i(this.useMapSpecularLocation, 1);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, mtl.mapSpecular.glTexture);
            gl.uniform1i(this.mapSpecularLocation, 2);
        } else {
            gl.uniform1i(this.useMapSpecularLocation, 0);
            gl.uniform3fv(this.specularLocation, mtl.specular);
        }

        // Specular exponent
        gl.uniform1f(this.specularExponentLocation, mtl.specularExponent);
    }

    /**
     * Sets additional uniforms for this object
     * 
     * For this shader, they are:
     * - u_highlightColor
     * @param {SceneObject} object 
     */
    setAdditionalUniforms(object) {
        // TODO: Use a different color based on the object type
        let alpha = object.isSelected ? 0.25 : 0;
        let highlightColor = [1, 0, 0, alpha];
        gl.uniform4fv(this.highlightColorLocation, highlightColor);
    }
}