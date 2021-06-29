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
     * Draws the given object
     */
    drawObject(gl, viewProjectionMatrix, sceneObject) {
        ;
    }
}

class LambertProgram extends Program {
    constructor() {
        // Download and compile the shaders
        let vs_src = await(await fetch("shaders/vs.glsl"));
        let fs_src = await(await fetch("shaders/lambert_fs.glsl"));

        let vs = utils.createShader(gl, gl.VERTEX_SHADER, vs_src);
        let fs = utils.createShader(gl, gl.FRAGMENT_SHADER, fs_src);

        this.glProgram = utils.createProgram(gl, vs, fs);
    }

    /**
     * Initialize all locations of attributes and uniforms.
     */
    initLocations() {
        let p = this.glProgram;

        // Call on parent
        Program.prototype.initLocations.call(this);

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