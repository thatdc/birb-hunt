class DepthMapProgram extends Program {
    /**
     * Depth frame buffer
     * @type {WebGLFramebuffer}
     */
    depthFrameBuffer;

    /**
     * Initialize the program before use:
     * - Downloads and compiles the shaders
     * - Saves the locations of attributes and uniforms
     * @returns {DepthMapProgram} a reference to the object
     */
    init() {
        super.init("shaders/simple_depth_vs.glsl", "shaders/simple_depth_fs.glsl");
        this.depthFrameBuffer = gl.createFramebuffer();
        return this;
    }

    /**
     * Draws the given object
     * @param {Scene} scene the scene object
     * @param {number[]} cameraPosition camera position in world space
     * @param {number[]} viewProjectionMatrix view-projection matrix from the camera
     * @param {SceneObject} object object to be drawn, isVisible is ignored
     * @param {GLenum} mode draw mode
     */
    drawObject(scene, cameraPosition, viewProjectionMatrix, object, mode = gl.TRIANGLES) {
        let model = object.model;

        // Check if this program is not already active
        if (gl.getParameter(gl.CURRENT_PROGRAM) != this.glProgram) {
            // Choose to use this program
            gl.useProgram(this.glProgram);
        }

        // Set Matrix uniforms
        let matrix = utils.multiplyMatrices(viewProjectionMatrix, object.worldMatrix);
        gl.uniformMatrix4fv(this.matrixLocation, true, matrix);

        // Bind VAO
        gl.bindVertexArray(model.vao);

        // Draw each material separately
        for (let [i, mtl] of Object.entries(model.materialsByIndex)) {

            // Bind Element Array Buffer
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBufferPerMaterial[i]);

            // Draw call
            gl.drawElements(mode, model.indicesPerMaterial[i].length, gl.UNSIGNED_SHORT, 0);
        }
        // Prevent leakage
        gl.bindVertexArray(null);
    }
}