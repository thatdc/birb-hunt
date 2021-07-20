class UserInterface {
    /**
     * Main panel
     * @type {Element}
     */
    mainPanel;

    /**
     * Options panel
     * @type {Element}
     */
    optionsPanel;

    /**
     * Side panel
     * @type {Element}
     */
    sidePanel;

    /**
     * Framerate display
     * @type {Element}
     */
    frameRateDisplay;

    /**
     * Light controls
     * @type {LightControls}
     */
    lightControls;

    /**
     * Initializes the UI
     * @param {Object} options application options
     * @param {Object[]} scenes an array of objects with {name, displayName} for every available scene
     */
    init(options, scenes) {
        // Initialize scene selection screen

        // Initialize options panel
        this.optionsPanel = this._initializeOptionsPanel(options);

        // Set visibility of framerate
        this.frameRateDisplay = document.getElementById("framerate");
        this.frameRateDisplay.hidden = !options["showFrameRate"] ?? true;

        // Set visibility of position
        this.positionDisplay = document.getElementById("position");
        this.positionDisplay.hidden = !options["showPosition"] ?? true;

        // Side panel
        this.mainPanel = document.getElementById("main-panel");

        // Side panel
        this.sidePanel = document.getElementById("side-panel");

        // Scene list
        this._initializeSceneList(scenes);
    }

    /**
     * Initializes the controls tied to the scene: light controls
     * @param {Scene} Scene 
     */
    initSceneControls(scene) {
        // Initialize light controls
        let lc = new LightControls();
        lc.createControls(document.getElementById("light-controls"), scene);
    }

    /**
     * Initializes the scenes selection list
     * @param {Object[]} scenes an array of objects with {name, displayName} for every available scene
     */
    _initializeSceneList(scenes) {
        let parent = document.getElementById("scene-list");

        // Create a button for each scene
        for (let { name, displayName } of scenes) {
            let button = document.createElement("button");
            button.value = name;
            button.textContent = displayName;
            button.addEventListener("click", this._onSceneSelectionButton);
            parent.appendChild(button);
        }
    }

    /**
     * Fired when the button to select a scene is clicked
     * @param {MouseEvent} e 
     */
    _onSceneSelectionButton(e) {
        startGame(e.target.value);
    }

    /**
     * Initializes the options panel
     * @param {Object} options application options
     * @returns {Element}
     */
    _initializeOptionsPanel(options) {
        // Add listeners and initialize options
        let optPanel = document.getElementById("options-panel");
        let checkBoxes = optPanel.querySelectorAll("input[type=checkbox]");
        for (let c of checkBoxes) {
            // Initialize state
            c.checked = options[c.option] ?? false;
            // Add listener to track state
            c.addEventListener("change", UserInterface._onAppOptionsCheckBoxChange);
        }

        return optPanel;
    }

    /**
     * Changes the option according to the checkbox status
     * @param {Event}
     */
    static _onAppOptionsCheckBoxChange(e) {
        let option = e.target.id.replace("opt-", "");
        app.options[option] = e.target.checked;
        if (option === "showFrameRate") {
            document.getElementById("framerate").hidden = e.target.checked === false;
        }
        if (option === "showPosition") {
            document.getElementById("position").hidden = e.target.checked === false;
        }
    }

    /**
     * Toggles the overlays
     * @param {boolean} visible
     */
    toggleOverlay(visible) {
        this.optionsPanel.hidden = !visible;
        this.sidePanel.hidden = !visible;
    }

    /**
     * Updates the framerate displayed in the box
     * @param {number} value 
     */
    updateFrameRate(value) {
        if (app.options.showFrameRate) {
            this.frameRateDisplay.textContent = `FPS: ${value.toFixed(1)}`;
        }
    }

    /**
     * Updates the current position in the box
     * @param {number[]} position 
     */
    updatePosition(position) {
        position = position.map(function (x) {
            return Number(x.toFixed(2));
        });
        if (app.options.showPosition) {
            this.positionDisplay.textContent = `Current position: ${position}`;
        }
    }
}