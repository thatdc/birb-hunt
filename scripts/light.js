class DirectionalLight {
    /**
     * Friendly name
     * @type {string}
     */
    name;

    /**
     * XYZ Direction of the light
     * @type {number[]}
     */
    direction;

    /**
     * RGB color of the light
     * @type {number[]}
     */
    color;

    /**
     * Creates a new directional light
     * @param {number[]} name 
     * @param {number[]} direction 
     * @param {number[]} color 
     */
    constructor(name, color, direction) {
        this.name = name;
        this.color = color;
        this.direction = direction;
    }

    /**
     * Initializes the uniforms for this light.
     * @param {Object} locations 
     */
    setUniforms({"color": colorLocation, "direction": directionLocation}) {
        gl.uniform3fv(colorLocation, this.color);
        gl.uniform3fv(directionLocation, this.direction);
    }
}