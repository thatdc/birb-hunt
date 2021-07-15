class DirectionalLight {
    /**
     * Friendly name
     * @type {string}
     */
    name;

    /**
     * Is this light active
     * @type {boolean}
     */
    isActive;

    /**
     * XY rotation of the light
     * 
     * X = 0 => looking down
     * X = 180 => looking up
     * @type {number[]}
     */
    rotation;

    /**
     * RGB color of the light
     * @type {number[]}
     */
    color;

    /**
     * Creates a new directional light
     * @param {number[]} name friendly name, must be unique
     * @param {number[]} color rgb color
     * @param {number[]} rotation XY rotation 
     * @param {boolean} isActive whether the light is active 
     */
    constructor(name, color, rotation, isActive = true) {
        this.name = name;
        this.color = color;
        this.rotation = rotation;
        this.isActive = isActive;
    }

    /**
     * Initializes the uniforms for this light.
     * @param {Object} locations 
     */
    setUniforms({ "isActive": isActiveLocation, "color": colorLocation, "direction": directionLocation }) {
        gl.uniform1i(isActiveLocation, this.isActive);
        gl.uniform3fv(colorLocation, this.color);
        gl.uniform3fv(directionLocation, this.getDirection());
    }

    /**
     * Returns the XYZ normalized direction of this light.
     * @returns {number[]}
     */
    getDirection() {
        let [pitch, yaw] = this.rotation.map(a => a * Math.PI / 180);

        let x = Math.sin(pitch) * Math.sin(yaw);
        let y = Math.cos(pitch);
        let z = Math.sin(pitch) * Math.cos(yaw);

        return [-x, -y, -z];
    }
}