class Camera {
    /**
     * Position in XYZ coordinates
     * @type {number[]}
     */
    position;

    /**
     * Rotation in XYZ Euler coordinates (in degrees)
     * @type {number[]}
     */
    rotation;

    /**
     * Field of view in the vertical direction
     * @type {number}
     */
    fov_y;

    /**
     * Aspect ratio of the camera (vertical/horizontal)
     * @type {number}
     */
    aspect_ratio;

    /**
     * Distance of the near plane
     * @type {number}
     */
    near_plane;

    /**
     * Distance of the far plane
     * @type {number}
     */
    far_plane;

    /**
     * Creates a new camera object
     * @param {number[]} position position in XYZ coordinates
     * @param {number[]} rotation rotation in XYZ Euler coordinates (in degrees)
     * @param {number} fov_y field of view in the y direction (in degrees)
     * @param {number} aspect_ratio aspect ratio
     * @param {number} near_plane distance of the near plane
     * @param {number} far_plane distance of the far plane
     */
    constructor(position = [0, 0, 0], rotation = [0, 0, 0], fov_y = 90, aspect_ratio = 16 / 9, near_plane = 0.1, far_plane = 100) {
        this.position = position;
        this.rotation = rotation;
        this.fov_y = fov_y;
        this.aspect_ratio = aspect_ratio;
        this.near_plane = near_plane;
        this.far_plane = far_plane;
    }

    /**
     * Creates a perspective projection matrix with the given parameters.
     * @returns {number[]}
     */
    getPerspectiveMatrix() {
        let t = Math.tan(utils.degToRad(this.fov_y) / 2);
        let a = this.aspect_ratio;
        let n = this.near_plane;
        let f = this.far_plane;
        return [1 / (a * t), 0.0, 0.0, 0.0,
            0.0, 1 / t, 0.0, 0.0,
            0.0, 0.0, (n + f) / (n - f), 2 * n * f / (n - f),
            0.0, 0.0, -1.0, 0.0];
    }

    /**
     * Creates the Look-In-Direction view matix (not including projection) 
     * of the camera
     * @returns {number[]}
     */
    getViewMatrix() {
        /* Roll (Z) */
        let res = utils.MakeRotateZMatrix(-this.rotation[2]);
        /* Pitch (X) */
        res = utils.multiplyMatrices(res,
            utils.MakeRotateXMatrix(-this.rotation[0]));
        /* Yaw (Y) */
        res = utils.multiplyMatrices(res,
            utils.MakeRotateYMatrix(-this.rotation[1]));
        res = utils.multiplyMatrices(res,
            utils.MakeTranslateMatrix(...this.position.map((x) => -x)));

        return res;
    }

    /**
     * Creates the view-projection matrix for this camera
     * @returns {number[]}
     */
    getViewProjectionMatrix() {
        return utils.multiplyMatrices(
            this.getPerspectiveMatrix(), this.getViewMatrix());
    }

    /**
     * Returns the normalized direction vector of the camera
     * @returns {number[]}
     */
    getDirection() {
        let T = utils.MakeRotateXYZMatrix(...this.rotation);
        return utils.multiplyMatrixVector(T, [0, 0, -1, 1]);
    }

    /**
     * Move the camera according to its current direction
     * @param {number[]} delta XYZ movement amount, in camera space
     * @param {boolean} lockY
     */
    move(delta, lockY=false) {
        // Transform the movement direction
        let T = utils.MakeRotateXYZMatrix(...this.rotation);
        delta = utils.multiplyMatrixVector(T, [...delta, 1]);
        
        if (lockY) {
            delta[1] = 0;
        }

        // Sum to the current position
        for (let i in this.position) {
            this.position[i] += delta[i];
        }
    }

    /**
     * Rotate the camera according to its current position
     * @param {number[]} delta XYZ rotation amount, in camera space
     */
    rotate(delta) {
        for (let i in this.rotation) {
            this.rotation[i] += delta[i];
            if (this.rotation[i] > 360) {
                this.rotation[i] -= 360;
            } else if (this.rotation[i] < -360) {
                this.rotation[i] += 360;
            }
        }
    }
}