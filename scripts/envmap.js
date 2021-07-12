class Skybox {
    /** WebGL compiled and linked program
     * @type {WebGLProgram}
    */
    glProgram;

    /** Vertex attributes */
    positionAttribLocation;

    /** Uniforms */
    cameraMatrixLocation;

    /** Name of the currently selected skybox */
    name;

    /** Base URL for retrieving the skybox images */
    base_url;

    /**
     * Position attribute buffer
     * @type {WebGLBuffer}
     */
    vertexBuffer;

    /**
     * Vertex array object
     * @type {WebGLVertexArrayObject}
     */
    vao;

    /**
     * Cube maps indexed by name
     * @type {Map<String, WebGLTexture}
     */
    cubeMaps;

    /**
     * Initialize the skybox.
     * Must be called before use
     * @param {string} name name of the skybox, will be used to fetch it
     * @param {string} base_url base url of the folder for the images
     * @returns {Skybox} a reference to the object
     */
    async init(name = "meadow", base_url = "assets/envmaps") {
        let vs_url = "shaders/skybox_vs.glsl";
        let fs_url = "shaders/skybox_fs.glsl";
        this.name = name;
        this.base_url = base_url;
        this.cubeMaps = new Map();

        await this.downloadShaders(vs_url, fs_url)
            .then(([vs_src, fs_src]) => { // Succesfully downloaded
                let vs = utils.createShader(gl, gl.VERTEX_SHADER, vs_src);
                let fs = utils.createShader(gl, gl.FRAGMENT_SHADER, fs_src);

                this.glProgram = utils.createProgram(gl, vs, fs);
                this.initLocations();
                this.vao = this.createVAO();
                return this.createCubeMap(name);
            })
            .then(tex => {
                this.cubeMaps.set(name, tex);
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
        this.cameraMatrixLocation = gl.getUniformLocation(p, "u_cameraMatrix");

        // Cube map
        this.skyboxLocation = gl.getUniformLocation(p, "u_skybox");
    }

    /**
     * Creates the vertex array object for this object,
     * which includes only the vertex buffer
     * @returns {WebGLVertexArrayObject}
     */
    createVAO() {
        // Create new empy VAO
        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // Create vertex attribute buffers
        this.vertexBuffer = this._createVertexBuffer();

        // This avoids further buffers to be included in the VAO
        gl.bindVertexArray(null);

        return vao;
    }

    /**
     * Creates the bufer with the position data.
     * @returns {WebGLBuffer}
     */
    _createVertexBuffer() {
        let buffer = gl.createBuffer();
        // Coordinates of a background quad in clip space
        let data = new Float32Array([
            -1, -1,
            +1, -1,
            -1, +1,
            -1, +1,
            +1, -1,
            +1, +1
        ]);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        let attribLocation = this.positionAttribLocation;
        let size = 2;
        let type = gl.FLOAT
        gl.enableVertexAttribArray(attribLocation);
        gl.vertexAttribPointer(attribLocation, size, type, false, 0, 0);
        return buffer;
    }

    /**
     * Creates a cube map of the skybox with the given name
     * @param {string} name 
     * @returns {WebGLTexture}
     */
    async createCubeMap(name) {
        // Do not flip the Y axis
        // Set the target and url for each direction
        let targets = [
            gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        ];

        // Create cube map
        let tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
        
        // Create each face
        for (let target of targets) {
            // Download the image
            let url = this._generateUrl(name, target);
            let img = await this._downloadImage(url);
            
            // Create the face
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(
                target,
                0,                  // mip-map level
                gl.RGBA,            // internal format
                gl.RGBA,            // source format
                gl.UNSIGNED_BYTE,   // source type
                img                 // image
            );
        }

        // Generate mip-map and set filtering method
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        return tex;
    }

    /**
     * Generates the URL of a specific face
     * @param {string} name 
     * @param {string} target 
     * @returns {string}
     */
    _generateUrl(name, target) {
        let suffix;
        switch (target) {
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_X: { suffix = "lf"; break; }
            case gl.TEXTURE_CUBE_MAP_POSITIVE_X: { suffix = "rt"; break; }
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Y: { suffix = "dn"; break; }
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Y: { suffix = "up"; break; }
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Z: { suffix = "ft"; break; }
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Z: { suffix = "bk"; break; }
        }
        return `${this.base_url}/${name}_${suffix}.jpg`;
    }

    /**
     * Downloads an image from a given url
     * @param {string} url 
     * @returns {Promise}
     */
    async _downloadImage(url) {
        return fetch(url)
            .then(res => {
                if (!res.ok) { throw new Error() }
                return res.blob();
            })
            .then(blob => {
                let img = new Image();
                img.src = URL.createObjectURL(blob);
                return new Promise(resolve => (
                    img.onload = e => resolve(e.target)
                ));
            })
            .catch(() => {
                console.error(`Could not download ${url}`);
            });
    }

    /**
     * Draws the skybox
     * @param {number[]} cameraMatrix 
     */
    draw(cameraMatrix) {
        gl.useProgram(this.glProgram);

        // Camera matrix
        gl.uniformMatrix4fv(this.cameraMatrixLocation, true, cameraMatrix);

        // Cube map
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMaps.get(this.name));
        gl.uniform1i(this.skyboxLocation, 0);

        // Bind VAO
        gl.bindVertexArray(this.vao);

        // Draw call
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Prevent leakage
        gl.bindVertexArray(null);
    }
}