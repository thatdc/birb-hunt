class Light {
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
    * RGB color of the light
    * @type {number[]}
    */
    color;

    /**
     * Creates a new light
     * @param {string} name friendly name, must be unique
     * @param {number[]} color rgb color
     * @param {boolean} isActive whether the light is active 
     */
    constructor(name, color, isActive = true) {
        this.name = name;
        this.color = color;
        this.isActive = isActive;
    }

    /**
     * Initializes the uniforms for this light.
     * @param {Object} locations 
     */
    setUniforms({ "isActive": isActiveLocation, "color": colorLocation }) {
        gl.uniform1i(isActiveLocation, this.isActive);
        gl.uniform3fv(colorLocation, this.color);
    }
}

class DirectionalLight extends Light {
    /**
     * XY rotation of the light
     * 
     * X = 0 => looking down
     * X = 180 => looking up
     * @type {number[]}
     */
    rotation;

    /**
     * Creates a new directional light
     * @param {string} name friendly name, must be unique
     * @param {number[]} color rgb color
     * @param {number[]} rotation XY rotation 
     * @param {boolean} isActive whether the light is active 
     */
    constructor(name, color, rotation, isActive = true) {
        super(name, color, isActive);
        this.rotation = rotation;
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

class PointLight extends Light {
    /**
     * Position XYZ of the light.
     * @type {number[]}
     */
    position;

    /**
     * Target distance of the light.
     * @type {number}
     */
    target;

    /**
     * Decay factor of this light
     * @type {number}
     */
    decay;

    /**
     * Creates a new directional light
     * @param {string} name friendly name, must be unique
     * @param {number[]} color rgb color
     * @param {number[]} position XYZ position
     * @param {number} target target distance
     * @param {number} decay decay factor 
     * @param {boolean} isActive whether the light is active 
     */
    constructor(name, color, position, target=1, decay=0, isActive = true) {
        super(name, color, isActive);
        this.position = position;
        this.target = target;
        this.decay = decay;
    }

    /**
     * Initializes the uniforms for this light.
     * @param {Object} locations 
     */
    setUniforms({ 
        "isActive": isActiveLocation, 
        "color": colorLocation, 
        "position": positionLocation,
        "target": targetLocation,
        "decay": decayLocation,
    }) {
        gl.uniform1i(isActiveLocation, this.isActive);
        gl.uniform3fv(colorLocation, this.color);
        gl.uniform3fv(positionLocation, this.position);
        gl.uniform1f(targetLocation, this.target);
        gl.uniform1f(decayLocation, this.decay);
    }
}