class SceneNode {
    /**
     * Unique of the object in the scene
     * @type {string}
     */
    name;

    /**
     * List of child nodes (will be transormed)
     * @type {SceneNode[]}
     */
    children;

    /**
     * Transform of the object w.r.t. the parent
     * @type {number[]}
     */
    localMatrix;

    /**
     * Transform of the object w.r.t. the world origin
     * @type {number[]}
     */
    worldMatrix;

    /**
     * Scale factor of this model [X Y Z]
     * @type {number[]}
     */
    scale;

    /**
     * Position in XYZ coordinates of the object
     * @type {number[]}
     */
    position;

    /**
     * Rotation of the object in XYZ Euler coordinates (in degrees)
     * @type {number[]}
     */
    rotation;

    /**
     * Pointer to the parent
     * @type {SceneNode}
     */
    parent = null;

    /**
     * If not null, this node will always look at the the given target
     * @type {SceneNode}
     */
    lookAtTarget;

    /**
     * Indicates whether this node, and its children, are visible.
     * @type {boolean}
     */
    isVisible;

    /**
     * Creates an empty node with no parent and no children.
     * 
     * All transformations refer to the parent node.
     * 
     * @param {string} name Unique name of this node in the scene
     * @param {number[]} position XYZ coordinates
     * @param {number[]} rotation XYZ euler angles, in degrees
     * @param {number[]} scale XYZ scaling factors
     */
    constructor(
        name,
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        isVisible = true
    ) {
        this.name = name;
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.isVisible = isVisible;
        this.parent = null;
        this.children = [];
        this.localMatrix = this._makeLocal();
        this.worldMatrix = this.localMatrix;
    }

    /**
     * Returns the XYZ position according to it's world matrix
     * @returns {number[]}
     */
    getWorldPosition() {
        return utils.TranslationFromMatrix4(this.worldMatrix);
    }

    /**
     * Creates a local transformation matrix from this node's
     * position, rotation and scale.
     * @returns {number[]}
     */
    _makeLocal() {
        // Translate
        let m = utils.MakeTranslateMatrix(...this.position);
        // Rotate
        m = utils.multiplyMatrices(m,
            utils.MakeRotateXYZMatrix(...this.rotation));
        // Scale
        m = utils.multiplyMatrices(m,
            utils.MakeScaleNuMatrix(...this.scale));

        return m;
    }

    /**
     * Set the parent
     * @param {SceneNode} parent 
     */
    setParent(parent) {
        if (this.parent) {
            var ndx = this.parent.children.indexOf(this);
            if (ndx >= 0) {
                this.parent.children.splice(ndx, 1);
            }
        }

        // Add us to our new parent
        if (parent) {
            parent.children.push(this);
        }
        this.parent = parent;
    }


    /**
     * Update world matrix of itself and recursively to the children
     * @param {number[][]} matrix 
     */
    updateWorldMatrix(matrix, time) {
        this.localMatrix = this._makeLocal();
        if (matrix) {
            // a matrix was passed in so do the math
            this.worldMatrix = utils.multiplyMatrices(matrix, this.localMatrix);
        } else {
            // no matrix was passed in so just copy.
            utils.copy(this.localMatrix, this.worldMatrix);
        }

        // If we are tied to look at another node, substitute the world matrix
        // with a lookAt matrix from the current position
        if (this.lookAtTarget) {
            let up = utils.normalize([this.worldMatrix[1], this.worldMatrix[5], this.worldMatrix[9]]);
            utils.LookAt(this.getWorldPosition(), this.lookAtTarget.getWorldPosition(), up, this.worldMatrix);
        }

        // now process all the children
        var worldMatrix = this.worldMatrix;
        this.children.forEach(function (child) {
            child.updateWorldMatrix(worldMatrix, time);
        });
    };
}

class SceneObject extends SceneNode {
    /** Model associated to this object.
     * @type {Mesh}
     */
    model;

    /**
     * Indicates if the object can be selected
     * @type {boolean}
     */
    isSelectable;

    /**
     * Indicates if the object is currently selected
     * @type {boolean}
     */
    isSelected;

    /**
     * Indicates if the object casts shadows
     * @type {boolean}
     */
    castsShadows;

    /**
     * Creates an object with no parent and no children.
     * 
     * It is assumed that the given model has been already initialized with
     * the VAO, the element array buffers and textures.
     * 
     * All transformations refer to the parent node.
     * 
     * @param {string} name Unique name of this node in the scene
     * @param {Mesh} model Model associated to this object
     * @param {number[]} position XYZ coordinates
     * @param {number[]} rotation XYZ euler angles, in degrees
     * @param {number[]} scale XYZ scaling factors
     * @param {number[]} localMatrix Transform of the object w.r.t. the parent
     */
    constructor(
        name,
        model,
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        isVisible = true,
        isSelectable = false
    ) {
        super(name, position, rotation, scale);
        this.model = model;
        this.isVisible = isVisible;
        this.isSelectable = isSelectable;
        this.isSelected = false;
        this.castsShadows = true;
    }

    /**
     * Selects this object
     */
    select() {
        this.isSelected = true;
    }

    /**
     * Deselects this object
     */
    deselect() {
        this.isSelected = false;
    }
}

class Scene {
    /**
     * Dictionary containing all the models, as loaded by downloadModels
     * @type {Map<String, Mesh>}
     */
    models = new Map();

    /**
     * Dictionary containing all the objects, must be manually synced with
     * the scene graph
     * @type {Map<String, SceneObject>}
     */
    objects = new Map();

    /**
     * Dictionary containing the program objects.
     * @type {Map<String, Program>}
     */
    programs = new Map();

    /**
     * Root node of a scene tree
     * @type {SceneNode}
     */
    rootNode;

    /**
     * Current camera
     * @type {Camera}
     */
    camera;

    /**
     * Current skybox
     * @type {Skybox}
     */
    skybox;

    /**
     * Ambient light color
     * @type {number[]}
     */
    ambientLight;

    /**
     * Directional lights
     * @type {DirectionalLight[]}
     */
    directionalLights;

    /**
     * Point lights
     * @type {PointLight[]}
     */
    pointLights;

    /**
     * Spot lights
     * @type {SpotLight[]}
     */
    spotLights;

    /**
     * Draws the scene
     * @param {boolean} collisionMeshes draw a wireframe version of the collision meshes
     */
    draw(collisionMeshes = false) {
        // Compute shadow maps
        this._computeShadowMaps();

        // Clear and resize the viewport
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(1, 1, 1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.cullFace(gl.BACK);

        // Calculate the view-projection matrix and camera position
        let viewProjectionMatrix = this.camera.getViewProjectionMatrix();
        let cameraPosition = this.camera.getWorldPosition();

        // viewProjectionMatrix = this.spotLights[0].getViewProjectionMatrix();

        // Draw the objects
        this._drawTree(cameraPosition, viewProjectionMatrix, this.rootNode, collisionMeshes);

        // Draw the skybox
        let cameraMatrix = utils.MakeRotateXYZMatrix(
            ...this.camera.rotation.map(x => -x));
        this.skybox.draw(cameraMatrix);
    }

    /**
     * Draws the given subtree
     * @param {number[]} cameraPosition camera position in world space
     * @param {number[]} viewProjectionMatrix view-projection matrix for the camera
     * @param {SceneNode} root root of the subtree
     * @param {boolean} showCollisionMeshes draw a wireframe version of the collision meshes
     * @param {Program} program force the use of this program for rendering. If undefined or null, the object's own program will be used
     */
    _drawTree(cameraPosition, viewProjectionMatrix, root, showCollisionMeshes = false, program = undefined) {
        if (!root.isVisible) { // this node and its children will be hidden
            return;
        }
        if (root instanceof SceneObject) {
            /** @type {Program} */
            let p = program ?? root.model.program;
            // Set the uniforms and perform one draw call per material
            p.drawObject(this, cameraPosition, viewProjectionMatrix, root);

            if (showCollisionMeshes && root.model.collisionMesh) {
                let cm = root.model.collisionMesh;
                cm.program.drawCollisionMesh(this, cameraPosition, viewProjectionMatrix, root);
            }
        }

        for (let child of root.children) {
            this._drawTree(cameraPosition, viewProjectionMatrix, child, showCollisionMeshes, program);
        }
    }

    /**
     * Computes the shadow maps for the supported lights
     * 
     * At the moment the supported lights are:
     * - directionalLights[0]
     * - pointLights[0]
     */
    _computeShadowMaps() {
        /** @type {DepthMapProgram} */
        let program = this.programs.get("depth_map");

        // NOTE: Currenly we support shadow maps only for the first directional light and the first spot light
        /** @type {Light} */
        let light;
        for (light of [this.directionalLights[0], this.spotLights[0]]) {
            // If the light is not acrive, the shadow map won't even be used in the shader
            if (!light.isActive) {
                continue;
            }
            // Get the shadow map size
            let [width, height] = light.shadowMapSize;

            // Bind the light's shadow map and color map to the depth frame buffer
            // The color map is only needed to comply to the WebGL specs, it is not actually used
            gl.bindFramebuffer(gl.FRAMEBUFFER, program.depthFrameBuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, light.shadowMap, 0);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, light.colorMap, 0);

            // Prepare the framebuffer for rendering
            gl.viewport(0, 0, width, height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.cullFace(gl.BACK);

            // Compute the Light space view-projection matrix
            let viewProjectionMatrix = light.getViewProjectionMatrix();

            // Hide objects that don't cast shadows
            let toHide = [];
            for (let obj of scene.objects.values()) {
                if (!obj.castsShadows && obj.isVisible) {
                    toHide.push(obj);
                    obj.isVisible = false;
                }
            }
            // Render the whole scene on the frame buffer
            this._drawTree(null, viewProjectionMatrix, this.rootNode, false, program);

            // Show objects that were previously hidden
            for (let obj of toHide) {
                obj.isVisible = true;
            }
        }
    }
}