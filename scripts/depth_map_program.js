class DepthMapProgram extends Program{
    /**
     * Initialize the program before use:
     * - Downloads and compiles the shaders
     * - Saves the locations of attributes and uniforms
     * @returns {DepthMapProgram} a reference to the object
     */
     init() {
        super.init("shaders/vs_simple_depth.glsl", "shaders/fs_simple_depth.glsl");
        return this;
    }

    /**
     * Draws the given object
     * @param {number[]} lightSpaceMatrix
     * @param {SceneObject} object
     * @param {GLenum} mode 
     */
     drawObject(lightSpaceMatrix, object, mode = gl.TRIANGLES) {
        let model = object.model;

        // Check if this program is not already active
        if (gl.getParameter(gl.CURRENT_PROGRAM) != this.glProgram) {
            // Choose to use this program
            gl.useProgram(this.glProgram);
        }

        // Set Matrix uniforms
        let matrix = utils.multiplyMatrices(lightSpaceMatrix, object.worldMatrix);
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