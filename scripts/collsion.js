// Create a default material to render these meshes
var __defaultMaterial__ = new Material();
__defaultMaterial__.ambient = [1, 1, 1];
__defaultMaterial__.diffuse = [.8, .8, .8];
__defaultMaterial__.diffuse = [.5, .5, .5];

class CollisionMesh extends Mesh {
    /**
     * Local transformation matrix (encodes center and rotation) w.r.t to the 3D mesh
     * @type {number[]}
     */
    localMatrix;

    /**
     * Creates a new Bounding Box
     * 
     * We refer to the local coordinates as UVW
     * 
     * @param {number[]} center center in UVW local coordinates
     * @param {number[]} rotation rotation in UVW local coordinates
     */
    constructor(center = [0, 0, 0], rotation = [0, 0, 0]) {
        // Initialize empty object
        super("");
        // Translate
        let m = utils.MakeTranslateMatrix(...center);
        // Rotate
        m = utils.multiplyMatrices(m,
            utils.MakeRotateXYZMatrix(...rotation));
        this.localMatrix = m;
    }

    /**
     * Creates the geometry (vertex positions and normals) of this mesh
     */
    _createGeometry() {
        this.vertices = [];
        this.vertexNormals = [];
        this.indices = [];
    }

    /**
     * After the geometry has been initialized,
     * it automatically creates a material and its properties on the mesh:
     * - mesh.materialIndices
     * - mesh.materialNames
     * - mesh.materialsByIndex
     * - mesh.vertexMaterialIndices
     * - mesh.indicesPerMaterial
     * - mesh.textures
     */
    _createMaterial() {
        // Create material properties on mesh
        let name = "material";
        this.materialIndices = { n: 0 };
        this.materialNames = [name];
        this.materialsByIndex = { 0: __defaultMaterial__ };
        this.indicesPerMaterial = [this.indices];

        this.vertexMaterialIndices = [];
        this.textures = [];
        let n_vertices = this.vertices.length / 3;
        for (let i = 0; i < n_vertices; i++) {
            this.vertexMaterialIndices.push(0);
            this.textures.push(0, 0);
        }
    }

    /**
     * Creates a bounding box around the given mesh
     * @param {Mesh} mesh 
     * @return {CollisionMesh}
     */
     static forMesh(mesh) {
        return BoundingBox.forMesh(mesh);
     }

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
        super(center, rotation);
        this.halfLengths = halfLengths;

        // Create geometry and material
        this._createGeometry();
        this._createMaterial();
    }

    /**
     * Creates the geometry for this collision mesh.
     * 
     * It is an origin-centered, axis-aligned box with the given half-lengths.
     * @returns 
     */
    _createGeometry() {
        let h = this.halfLengths;
        let vertices = [];
        let indices = [];
        let normals = [];

        // Bottom points
        let p_bnw = [-h[0], -h[1], -h[2]];
        let p_bne = [+h[0], -h[1], -h[2]];
        let p_bse = [+h[0], -h[1], +h[2]];
        let p_bsw = [-h[0], -h[1], +h[2]];
        // Top points
        let p_tnw = [-h[0], +h[1], -h[2]];
        let p_tne = [+h[0], +h[1], -h[2]];
        let p_tse = [+h[0], +h[1], +h[2]];
        let p_tsw = [-h[0], +h[1], +h[2]];
        // Normals
        let n_b = [0, -1, 0];
        let n_t = [0, +1, 0];
        let n_n = [0, 0, -1];
        let n_s = [0, 0, +1];
        let n_w = [-1, 0, 0];
        let n_e = [+1, 0, 0];

        // Vertices
        vertices.push(
            ...p_bnw, ...p_bne, ...p_bse, ...p_bsw, // Bottom
            ...p_tnw, ...p_tsw, ...p_tse, ...p_tne, // Top
            ...p_bnw, ...p_tnw, ...p_tne, ...p_bne, // North
            ...p_bsw, ...p_bse, ...p_tse, ...p_tsw, // South
            ...p_bnw, ...p_bsw, ...p_tsw, ...p_tnw, // West
            ...p_bse, ...p_bne, ...p_tne, ...p_tse, // East
        );
        // Normals
        normals.push(
            ...n_b, ...n_b, ...n_b, ...n_b, // Bottom
            ...n_t, ...n_t, ...n_t, ...n_t, // Top
            ...n_n, ...n_n, ...n_n, ...n_n, // North
            ...n_s, ...n_s, ...n_s, ...n_s, // South
            ...n_w, ...n_w, ...n_w, ...n_w, // West
            ...n_e, ...n_e, ...n_e, ...n_e, // East
        );
        // Triangles
        for (let i = 0; i < 6; i++) {
            let off = 4 * i;
            indices.push(
                0 + off, 1 + off, 3 + off,
                1 + off, 2 + off, 3 + off,
            );
        }

        // Assign to local attributes
        this.vertices = vertices;
        this.vertexNormals = this.vertexNormals;
        this.indices = indices;
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
            halfLengths[i] = (max - min) / 2;
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