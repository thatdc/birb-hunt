class Light extends SceneNode{
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
     * Shadow map
     * @type {WebGLTexture}
     */
    shadowMap;

    /**
     * Color map of the same size of the shadow map (only needed for compatibility reasons, it is not used)
     * @type {WebGLTexture}
     */
    colorMap;


    /**
     * Size of the shadow map [width, height] in pixels
     * @type {number[]}
     */
    shadowMapSize;

    /**
     * Creates a new light
     * @param {string} name friendly name, must be unique
     * @param {number[]} color rgb color
     * @param {boolean} isActive whether the light is active
     */
    constructor(name, color, isActive = true) {
        super();
        this.name = name;
        this.color = color;
        this.isActive = isActive;
    }

    /**
     * Initializes the uniforms for this light.
     * @param {Object} locations
     * @param {number} shadowMapUnit the texture unit where the shadow map will be loaded
     */
    setUniforms({ "isActive": isActiveLocation, "color": colorLocation }, shadowMapUnit) {
        gl.uniform1i(isActiveLocation, this.isActive);
        gl.uniform3fv(colorLocation, this.color);
    }

    /**
     * Initializes the shadow map for this light.
     * 
     * NOTE: shadowMapSize must be already set
     */
    _initShadowMap() {
        let [width, height] = this.shadowMapSize;
        // Create the shadow map as a 2D depth texture
        let shadowMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, shadowMap);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F,
            width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);

        // Set texture parameters
        // Filtering
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // Clamp (to black) on edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // Enable comparison for automatic sampling shadow maps
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);

        // Attach the shadow map to the light
        this.shadowMap = shadowMap;
    }

    /**
     * Initializes the color map for this light.
     * 
     * NOTE: shadowMapSize must be already set
     */
    _initColorMap() {
        let [width, height] = this.shadowMapSize;
        let colorMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, colorMap);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
            width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.colorMap = colorMap;
    }
}

class DirectionalLight extends Light {
    /**
     * XY rotation of the light
     * @type {number[]}
     */
    rotation;

    /**
     * Creates a new directional light
     * @param {string} name friendly name, must be unique
     * @param {number[]} color rgb color
     * @param {number[]} rotation XY rotation 
     * @param {boolean} isActive whether the light is active 
     * @param {Object} projectionOptions object with: half width of the frustum, near plane distance, far plane distance, distance from the center
     * @param {number[]} shadowMapSize size of the shadow map in [width, height]. If falsy, no shadow map will be generated
     */
    constructor(name, color, rotation, isActive,
        projectionOptions = { "halfWidth": 130, "near": 0, "far": 300, "distance": 150 },
        shadowMapSize
    ) {
        super(name, color, isActive);
        this.rotation = rotation;
        this.projectionOptions = projectionOptions;
        this.shadowMapSize = shadowMapSize;
        if (shadowMapSize) {
            this._initShadowMap();
            this._initColorMap();
        }
    }

    /**
     * Initializes the uniforms for this light.
     * @param {Object} locations 
     */
    setUniforms({
        "isActive": isActiveLocation,
        "color": colorLocation,
        "direction": directionLocation,
        "viewProjectionMatrix": viewProjectionMatrixLocation,
        "shadowMap": shadowMapLocation
    }, shadowMapUnit) {
        // Basic uniforms
        gl.uniform1i(isActiveLocation, this.isActive);
        if (this.isActive) {
            gl.uniform3fv(colorLocation, this.color);
            gl.uniform3fv(directionLocation, this.getDirection());
        }
        // If this has a shadow map, also bind the matrix and the texture
        if (shadowMapLocation) {
            gl.uniformMatrix4fv(viewProjectionMatrixLocation, true, this.getViewProjectionMatrix());
            gl.activeTexture(gl.TEXTURE0 + shadowMapUnit);
            gl.bindTexture(gl.TEXTURE_2D, this.shadowMap);
            gl.uniform1i(shadowMapLocation, shadowMapUnit);
        }
    }

    /**
    * Returns the XYZ normalized direction of this light.
    * @returns {number[]}
    */
     getDirection() {
        let T = utils.multiplyMatrices(
            utils.MakeRotateYMatrix(this.rotation[1]),
            utils.MakeRotateXMatrix(this.rotation[0]));
        return utils.multiplyMatrixVector(T, [0, 0, -1, 1]).slice(0, 3);
    }

    /**
     * Compute the view-projection matrix for this light.
     * 
     * The view matrix is a look-at matrix for a point at {@code distance}
     * from the center of the scene.
     * 
     * The projection matrix is an orthographic projection, whose frustum
     * is specified by {@code halfWidth, near, far}.
     * @returns {number[]}
     */
    getViewProjectionMatrix() {
        let { halfWidth, near, far, distance } = this.projectionOptions;
        let aspectRatio = this.shadowMapSize[0] / this.shadowMapSize[1];
        let projection = utils.MakeParallel(halfWidth, aspectRatio, near, far);
        let c = this.getDirection().map(x => -x * distance);
        let a = [0, 0, 0];
        let view = utils.MakeLookAt(c, a, [0, 1, 0]);

        return utils.multiplyMatrices(projection, view);
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
    constructor(name, color, position, target = 1, decay = 0, isActive = true) {
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
        "decay": decayLocation
    }, shadowMapUnit) {
        gl.uniform1i(isActiveLocation, this.isActive);
        if (this.isActive) {
            gl.uniform3fv(colorLocation, this.color);
            gl.uniform3fv(positionLocation, this.position);
            gl.uniform1f(targetLocation, this.target);
            gl.uniform1f(decayLocation, this.decay);
        }
    }
}

class SpotLight extends PointLight {
    /**
     * Cosine of the inner cone of the light.
     * @type {number}
     */
    innerCone;

    /**
     * Cosine of the outer cone of the light.
     * @type {number}
     */
    outerCone;

    /**
     * Creates a new spot light
     * @param {string} name friendly name, must be unique
     * @param {number[]} color rgb color
     * @param {number[]} position XYZ position 
     * @param {number[]} rotation XY rotation 
     * @param {number} innerCone cosine of the half/angle of the inner cone
     * @param {number} outerCone cosine of the half/angle of the outer cone
     * @param {number} target target distance
     * @param {number} decay decay factor 
     * @param {boolean} isActive whether the light is active 
     * @param {Object} projectionOptions object with: near plane distance, far plane distance
     * @param {number[]} shadowMapSize size of the shadow map in [width, height]. If falsy, no shadow map will be generated
     */
    constructor(name, color, position, rotation, innerCone, outerCone, target = 1, decay = 1, isActive = true,
        projectionOptions = { "near": 0, "far": 300 },
        shadowMapSize
    ) {
        super(name, color, position, target, decay, isActive);
        this.rotation = rotation;
        this.innerCone = innerCone;
        this.outerCone = outerCone;
        this.projectionOptions = projectionOptions;
        this.shadowMapSize = shadowMapSize;
        if (shadowMapSize) {
            this._initShadowMap();
            this._initColorMap();
        }
    }

    /**
     * Initializes the uniforms for this light.
     * @param {Object} locations 
     */
    setUniforms({
        "isActive": isActiveLocation,
        "color": colorLocation,
        "position": positionLocation,
        "direction": directionLocation,
        "innerCone": innerConeLocation,
        "outerCone": outerConeLocation,
        "target": targetLocation,
        "decay": decayLocation,
        "viewProjectionMatrix": viewProjectionMatrixLocation,
        "shadowMap": shadowMapLocation
    }, shadowMapUnit) {
        gl.uniform1i(isActiveLocation, this.isActive);
        // Basic uniforms
        if (this.isActive) {
            gl.uniform1i(isActiveLocation, this.isActive);
            gl.uniform3fv(colorLocation, this.color);
            gl.uniform3fv(positionLocation, this.getPosition());
            gl.uniform3fv(directionLocation, this.getDirection());
            gl.uniform1f(innerConeLocation, this.innerCone);
            gl.uniform1f(outerConeLocation, this.outerCone);
            gl.uniform1f(targetLocation, this.target);
            gl.uniform1f(decayLocation, this.decay);
        }
        // If this has a shadow map, also bind the matrix and the texture
        if (shadowMapLocation) {
            gl.uniformMatrix4fv(viewProjectionMatrixLocation, true, this.getViewProjectionMatrix());
            gl.activeTexture(gl.TEXTURE0 + shadowMapUnit);
            gl.bindTexture(gl.TEXTURE_2D, this.shadowMap);
            gl.uniform1i(shadowMapLocation, shadowMapUnit);
        }
    }

    /**
     * Returns the XYZ position according to it's world matrix
     * @returns {number[]}
     */
    getPosition(){
        return utils.TranslationFromMatrix4(this.worldMatrix)
    }

    /**
    * Returns the XYZ normalized direction of this light.
    * @returns {number[]}
    */
    getDirection() {
        /**let T = utils.multiplyMatrices(
            utils.MakeRotateYMatrix(this.rotation[1]),
            utils.MakeRotateXMatrix(this.rotation[0]));
        return utils.multiplyMatrixVector(T, [0, 0, -1, 1]).slice(0, 3);*/
        let W = this.worldMatrix;
        let subRot = utils.sub3x3from4x4(W);
        return utils.multiplyMatrix3Vector3(subRot, [0, 0, -1]).slice(0, 3);
    }

    /**
     * Compute the view-projection matrix for this light.
     * 
     * The view matrix is a look-in-direction matrix that starts from the light's center
     * 
     * The projection matrix is a perspective projection, whose frustum
     * is specified by {@code halfWidth, near, far}.
     * @returns {number[]}
     */
    getViewProjectionMatrix() {
        // The FOV angle is computed by enlarging a little the outer cone,
        // to avoid stretching to the very edge of the texture
        let cosHalfFov = Math.max(this.outerCone - 1e-3, -1);

        // Cotangent of fov/2, to compute perspective matrix
        let ct = cosHalfFov / Math.sqrt(1 - cosHalfFov * cosHalfFov);

        let { near, far } = this.projectionOptions;
        let aspectRatio = this.shadowMapSize[0] / this.shadowMapSize[1];
        let projection = SpotLight._makePerspective(ct, aspectRatio, near, far);
        // View matrix is the inverse of the world matrix
        let view = utils.invertMatrix(this.worldMatrix);

        return utils.multiplyMatrices(projection, view);
    }

    /**
     * Computes a perspective projection matrix.
     * 
     * The difference with utils.js, is that here we already have the cotangent
     * @param {number} ct cotangent of fovy/2
     * @param {number} a aspect ratio (y/x)
     * @param {number} n near plane distance
     * @param {number} f far plane distance
     * @returns {number[]}
     */
    static _makePerspective(ct, a, n, f) {
        let perspective = utils.identityMatrix();

        perspective[0] = ct / a;
        perspective[5] = ct;
        perspective[10] = (f + n) / (n - f);
        perspective[11] = 2. * f * n / (n - f);
        perspective[14] = -1.;
        perspective[15] = 0.;

        return perspective;
    }
}