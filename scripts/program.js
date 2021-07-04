class Program {
    /** WebGL compiled and linked program
     * @type {WebGLProgram}
    */
    glProgram;

    /** Vertex attributes */
    positionAttribLocation;
    normalAttribLocation;
    uvAttribLocation;
    matrixLocation;
    normalMatrixLocation;

    constructor(vs_url, fs_url) {
        this.downloadShaders(vs_url, fs_url)
            .then(([vs_src, fs_src]) => { // Succesfully downloaded
                let vs = utils.createShader(gl, gl.VERTEX_SHADER, vs_src);
                let fs = utils.createShader(gl, gl.FRAGMENT_SHADER, fs_src);

                this.glProgram = utils.createProgram(gl, vs, fs);
                this.initLocations()
            }, (e) => { // Error
                console.error(e);
            })
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
        this.normalAttribLocation = gl.getAttribLocation(p, "a_normal");
        this.uvAttribLocation = gl.getAttribLocation(p, "a_uv");

        // Transformation matrices
        this.matrixLocation = gl.getUniformLocation(p, "u_matrix");
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
        // Create new empy VAO
        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // Create vertex attribute buffers
        mesh.vertexBuffer = this._createVertexAttribBuffer(new Float32Array(mesh.vertices), this.positionAttribLocation, 3);
        mesh.normalBuffer = this._createVertexAttribBuffer(new Float32Array(mesh.vertexNormals), this.normalAttribLocation, 3);
        mesh.textureBuffer = this._createVertexAttribBuffer(new Float32Array(mesh.textures), this.uvAttribLocation, 2);

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
     * Draws the given object
     */
    drawObject(gl, viewProjectionMatrix, sceneObject) {
        ;
    }
}

class LambertProgram extends Program {
    constructor() {
        super("shaders/vs.glsl", "shaders/fs_lambert.glsl");
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

        // Lights
        this.lightDirectionLocation = gl.getUniformLocation(p, "u_lightDirection");
        this.lightColorLocation = gl.getUniformLocation(p, "u_lightColor");
    }
}