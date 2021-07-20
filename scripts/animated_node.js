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

    /**
     * Update world matrix of itself and recursively to the children
     * @param {number[][]} matrix 
     * @param {number} time the time instant
     */
     updateWorldMatrix(matrix, time){
         super.updateWorldMatrix(matrix);
         if (app.win){
            this.animate(time);
         }
     }

     /**
      * Animate the main child object
      */
     animate(time){
         let period = 750;
         time = parseInt(time);
         let remainder = time % period;
         let a;
         let f_pos = null;
         let i_pos = null;
         let f_rot = [0, 0, 0];
         let i_rot = [0, 0, 0];
         let mat;
         
         if (remainder <= 300){
            a = remainder / 300;
            mat = utils.InterpolationMatrix([0, 0, 0], [0, 0.75, 0], [0, 0, 0], [0, 90, 0], a);
         }
         else if(remainder <= 500){
             a = (remainder - 300) / 200;
             mat = utils.InterpolationMatrix([0, 0.75, 0], [0, 1, 0], [0, 90, 0], [0, 180, 0], a);
         }
         else {
             a = (remainder - 500) / 250;
             mat = utils.InterpolationMatrix([0, 1, 0], [0, 0, 0], [0, 180, 0], [0, 360, 0], a);
         }
        
         let S = utils.MakeScaleMatrix(1);
         mat = utils.multiplyMatrices(S, mat);
         this.animatedChild.worldMatrix = utils.multiplyMatrices(this.worldMatrix, mat);
     }
}