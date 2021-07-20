class AnimatedNode extends SceneNode{
    /**
     * The "main" child of this node, which can be animated and contains the actual 3d model
     * @type {SceneObject}
     */
    animatedChild;

    /**
     * Creates an empty node with no parent and no children.
     * 
     * All transformations refer to the parent node.
     * 
     * @param {string} name Unique name of this node in the scene
     * @param {number[]} position XYZ coordinates
     * @param {number[]} rotation XYZ euler angles, in degrees
     * @param {number[]} scale XYZ scaling factors
     * @param {boolean} isVisible visibility flag
     * @param childModel the model of the animated child
     */
     constructor(
        name,
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        isVisible = true,
        childModel
    ) {
        super(name, position, rotation, scale, isVisible);
        this.animatedChild = new SceneObject(this.name + "_animated", childModel, [0, 0, 0], [0, 0, 0], [1, 1, 1], true, true);
        this.animatedChild.setParent(this);
    }
}