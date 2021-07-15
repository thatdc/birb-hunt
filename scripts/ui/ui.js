class UserInterface {
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
     */
    init(options) {
        // Initialize options panel
        this.optionsPanel = this._initializeOptionsPanel(options);

        // Set visibility of framerate
        this.frameRateDisplay = document.getElementById("framerate");
        this.frameRateDisplay.hidden = !options["showFrameRate"] ?? true;

        // Set visibility of position
        this.positionDisplay = document.getElementById("position");
        this.positionDisplay.hidden = !options["showPosition"] ?? true;

        // Side panel
        this.sidePanel = document.getElementById("side-panel");

        // Initialize light controls
        let lc = new LightControls();
        lc.createControls(document.getElementById("light-controls"), scene);
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