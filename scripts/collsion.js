class CollisionMesh {
    /**
     * Checks the intersection of a ray with the collision mesh
     * @param {number[]} ray_origin XYZ origin of the ray, in world coord
     * @param {number[]} ray_dir normalized XYZ direction of the ray, in world coord
     * @param {number[]} worldMatrix world matrix to move and orient the mesh
     * @returns {number} distance of the nearest intersection point, {@code false} if no intersection
     */
    rayIntersect(ray_origin, ray_dir, worldMatrix) {
        return false;
    }
}

class BoundingBox extends CollisionMesh {
    /**
     * Local transformation matrix (encodes center and rotation) w.r.t to the 3D mesh
     * @type {number[]}
     */
    localMatrix;

    /**
     * Half-lengths in the XYZ directions
     * @type {number[]}
     */
    halfLengths;

    /**
     * Creates a new Bounding Box
     * 
     * We refer to the local coordinates as UVW
     * 
     * @param {number[]} center center in UVW local coordinates
     * @param {number[]} rotation rotation in UVW local coordinates
     * @param {number[]} halfLengths half-lengths in the UVW directions
     */
    constructor(center = [0, 0, 0], rotation = [0, 0, 0], halfLengths = [1, 1, 1]) {
        super();
        // Translate
        let m = utils.MakeTranslateMatrix(...center);
        // Rotate
        m = utils.multiplyMatrices(m,
            utils.MakeRotateXYZMatrix(...rotation));
        this.localMatrix = m;
        this.halfLengths = halfLengths;
    }

    /**
     * Creates a bounding box around the given mesh
     * @param {Mesh} mesh 
     * @return {BoundingBox}
     */
    static forMesh(mesh) {
        // Minimum and maximum coordinates
        let center = [0, 0, 0];
        let halfLengths = [0, 0, 0];

        // Iterate over the XYZ axes
        for (let i in [0, 1, 2]) {
            // Filter only the values belonging to this axis
            let xs = mesh.vertices.filter((_, j) => (j % 3 == i));

            // Compute the minimum and maximum
            let min = Math.min(...xs);
            let max = Math.max(...xs);

            // Compute center and length along this axis
            center[i] = (min + max) / 2;
            halfLengths[i] = (max - min) / 2
        }

        return new BoundingBox(center, [0, 0, 0], halfLengths);
    }

    /**
     * Checks the intersection of a ray with the collision mesh
     * 
     * The check is performed using the slabs method, 
     * as suggested by Real-Time Rendering (4th ed.), section 22.7.1.
     * 
     * @param {number[]} ray_origin XYZ origin of the ray, in world coord
     * @param {number[]} ray_dir normalized XYZ direction of the ray, in world coord
     * @param {number[]} worldMatrix world matrix to move and orient the mesh
     * @returns {number} distance of the nearest intersection point, {@code false} if no intersection
     */
    rayIntersect(ray_origin, ray_dir, worldMatrix) {
        // Compute transformation matrix
        let m = utils.multiplyMatrices(worldMatrix, this.localMatrix);
        m = utils.transposeMatrix(m); // transpose the matrix so elements we need are contiguous

        // Read BB center off of the matrix
        let c = m.slice(12, 15);

        // Position vector w.r.t. the origin of the ray
        let p = utils.subtractVectors(c, ray_origin);

        // Maximum tmin and minimum tmax among the UVW directions
        let tmin = -10e18;
        let tmax = +10e18;

        // Iterate over the UVW slabs
        for (let i of [0, 1, 2]) {
            // Get normalized direction of the axis
            let a = utils.normalize(m.slice(4 * i, 4 * i + 3));
            // Project position vector on axis
            let e = utils.dot(a, p);
            // Project ray on axis
            let f = utils.dot(a, ray_dir);
            // Half-length on this axis
            let h = this.halfLengths[i];

            if (Math.abs(f) > 10e-18) { // ray not parallel to slab => at least one intersection
                // Compute the distance of the two intersections with the slab
                let invF = 1 / f;
                let t1 = (e + h) * invF;
                let t2 = (e - h) * invF;

                // Ensure that t1 <= t2
                if (t1 > t2) {
                    let t = t1;
                    t1 = t2;
                    t2 = t;
                }
                // Keep the maximun tmin among UVW
                if (t1 > tmin) {
                    tmin = t1;
                }
                // Keep the minimum tmin among UVW
                if (t2 < tmax) {
                    tmax = t2;
                }

                if (tmin > tmax) { // ray only intersect slabs => reject
                    return false;
                }
                if (tmax < 0) { // object behind ray origin => reject
                    return false;
                }
            } else { // ray parallel to slab => no intersection
                if (-e - h > 0 || -e + h < 0) { // ray outside the slab => reject
                    return false;
                }
            }
        }

        // Return the nearest intersection point in front of the origin
        return tmin > 0 ? tmin : tmax;
    }
}