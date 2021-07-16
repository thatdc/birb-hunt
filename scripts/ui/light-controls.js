class LightControls {
    static _axisNames = ["x", "y", "z"];
    static _colorNames = ["r", "g", "b"];

    /**
     * Light selector
     * @type {Element}
     */
    selector;

    /**
     * Currently selected light
     * @type {Light}
     */
    _selectedLight;

    /**
     * Inputs for light status
     * @type {Element}
     */
    isActiveInput;

    /**
     * Inputs for light position on the XYZ axis
     * @type {Element[]}
     */
    positionInputs;

    /**
     * Inputs for light direction on the XY axis
     * @type {Element[]}
     */
    directionInputs;

    /**
     * Display value for light direction on the XY axis
     * @type {Element[]}
     */
    directionDisplays;

    /**
     * Input for light color in RGB space
     * @type {Element}
     */
    colorInput;

    /**
     * Input for target distance (g)
     * @type {Element}
     */
    targetInput;

    /**
     * Display for target distance (g)
     * @type {Element}
     */
    targetDisplay;

    /**
     * Input for decay (beta)
     * @type {Element}
     */
    decayInput;

    /**
     * Display for decay (beta)
     * @type {Element}
     */
    decayDisplay;

    /**
     * Input for inner cone
     * @type {Element}
     */
    innerConeInput;

    /**
     * Display for inner cone
     * @type {Element}
     */
    innerConeDisplay;

    /**
     * Input for outer cone
     * @type {Element}
     */
    outerConeInput;

    /**
     * Display for outer cone
     * @type {Element}
     */
    outerConeDisplay;

    /**
     * Creates a new LightControls object
     */
    constructor() {
        this.positionInputs = new Array(3);
        this.directionInputs = new Array(2);
        this.directionDisplays = new Array(3);
    }

    /**
     * Programmatically creates the light controls in the side panel.
     * They are not bound to any particular light.
     * @param {Element} lightControlsElement 
     * @param {Scene} scene
     */
    createControls(lightControlsElement, scene) {
        let parent;
        // Position controls
        parent = lightControlsElement.querySelector("#light-controls-position");
        for (let i of [0, 1, 2]) {
            // Create the input and insert it into the DOM
            let input = document.createElement("input");
            input.id = `light-controls-position-${i}`;
            input.type = "number";
            input.step = 0.01;
            input.axis = i;
            input.addEventListener("input", (e) => LightControls.onPositionInput(e, this));
            let label = document.createElement("label");
            label.htmlFor = input.id;
            label.textContent = LightControls._axisNames[i];
            let wrapper = document.createElement("div");
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            parent.appendChild(wrapper);
            this.positionInputs[i] = input;
        }
        // Direction controls
        parent = lightControlsElement.querySelector("#light-controls-direction");
        for (let i of [0, 1]) {
            // Create the input and insert it into the DOM
            let input = document.createElement("input");
            input.id = `light-controls-direction-${i}`;
            input.type = "range";
            input.min = i == 0 ? 0 : -180;
            input.max = i == 0 ? 180 : 180;
            input.step = 1;
            input.axis = i;
            input.addEventListener("input", (e) => LightControls.onDirectionInput(e, this));
            let label = document.createElement("label");
            label.htmlFor = input.id;
            label.textContent = LightControls._axisNames[i];
            let display = document.createElement("label");
            display.classList.add("display-angle");
            display.textContent = input.value;
            let wrapper = document.createElement("div");
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            wrapper.appendChild(display);
            parent.appendChild(wrapper);
            this.directionInputs[i] = input;
            this.directionDisplays[i] = display;
        }
        // Color controls
        parent = lightControlsElement.querySelector("#light-controls-color");
        {
            // Create the input and insert it into the DOM
            let input = document.createElement("input");
            input.type = "color";
            input.id = `light-controls-color`;
            input.addEventListener("input", (e) => LightControls.onColorInput(e, this));
            let wrapper = document.createElement("div");
            wrapper.appendChild(input);
            parent.appendChild(wrapper);
            this.colorInput = input;
        }
        // Target distance controls
        parent = lightControlsElement.querySelector("#light-controls-target");
        {
            // Create the input and insert it into the DOM
            let input = document.createElement("input");
            input.id = `light-controls-target-distance`;
            input.type = "range";
            input.min = 0;
            input.max = 100;
            input.step = 0.01;
            input.addEventListener("input", (e) => LightControls.onTargetInput(e, this));
            let label = document.createElement("label");
            label.htmlFor = input.id;
            label.textContent = "g";
            let display = document.createElement("label");
            display.classList.add("display-coord");
            display.textContent = input.value;
            let wrapper = document.createElement("div");
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            wrapper.appendChild(display);
            parent.appendChild(wrapper);
            this.targetInput = input;
            this.targetDisplay = display;
        }
        // Decay controls
        parent = lightControlsElement.querySelector("#light-controls-decay");
        {
            // Create the input and insert it into the DOM
            let input = document.createElement("input");
            input.id = `light-controls-decay-value`;
            input.type = "range";
            input.min = 0;
            input.max = 2;
            input.step = 1;
            input.addEventListener("input", (e) => LightControls.onDecayInput(e, this));
            let label = document.createElement("label");
            label.htmlFor = input.id;
            label.textContent = "\u03B2";
            let display = document.createElement("label");
            display.classList.add("display-coord");
            display.textContent = input.value;
            let wrapper = document.createElement("div");
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            wrapper.appendChild(display);
            parent.appendChild(wrapper);
            this.decayInput = input;
            this.decayDisplay = display;
        }
        // Inner cone controls
        parent = lightControlsElement.querySelector("#light-controls-innerCone");
        {
            // Create the input and insert it into the DOM
            let input = document.createElement("input");
            input.id = `light-controls-innerCone-value`;
            input.type = "range";
            input.min = -1;
            input.max = 1;
            input.step = 0.01;
            input.addEventListener("input", (e) => LightControls.onInnerConeInput(e, this));
            let label = document.createElement("label");
            label.htmlFor = input.id;
            label.textContent = "i";
            let display = document.createElement("label");
            display.classList.add("display-coord");
            display.textContent = input.value;
            let wrapper = document.createElement("div");
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            wrapper.appendChild(display);
            parent.appendChild(wrapper);
            this.innerConeInput = input;
            this.innerConeDisplay = display;
        }
        // Outer cone controls
        parent = lightControlsElement.querySelector("#light-controls-outerCone");
        {
            // Create the input and insert it into the DOM
            let input = document.createElement("input");
            input.id = `light-controls-outerCone-value`;
            input.type = "range";
            input.min = -1;
            input.max = 1;
            input.step = 0.01;
            input.addEventListener("input", (e) => LightControls.onOuterConeInput(e, this));
            let label = document.createElement("label");
            label.htmlFor = input.id;
            label.textContent = "o";
            let display = document.createElement("label");
            display.classList.add("display-coord");
            display.textContent = input.value;
            let wrapper = document.createElement("div");
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            wrapper.appendChild(display);
            parent.appendChild(wrapper);
            this.outerConeInput = input;
            this.outerConeDisplay = display;
        }
        // Light selector and isActive checkbox
        parent = lightControlsElement.querySelector("#light-controls-selector");
        {
            let check = document.createElement("input");
            this.isActiveInput = check;
            check.id = "light-controls-isActive";
            check.type = "checkbox";
            check.addEventListener("change", (e) => LightControls.onIsActiveChange(e, this));
            parent.appendChild(check);

            let selector = document.createElement("select");
            this.selector = selector;
            this.refreshLightNames(scene);
            LightControls.onSelectionInput({ target: selector }, this);
            selector.addEventListener("input", (e) => LightControls.onSelectionInput(e, this));
            parent.appendChild(selector);
        }
    }

    /**
     * Refresh the list of selectable lights
     * @param {Scene} scene 
     */
    refreshLightNames(scene) {
        for (let [pName, name] of [["directionalLights", "Directional"], ["pointLights", "Point"], ["spotLights", "Spot"]]) {
            // Create options group
            let group = document.createElement("optgroup");
            group.label = name;
            // Create one option for each light
            for (let l of scene[pName]) {
                let opt = document.createElement("option");
                opt.light = l; // attach light object to the option
                opt.value = l.name;
                opt.textContent = l.name;
                group.appendChild(opt);
            }
            this.selector.appendChild(group);
        }
    }

    /**
     * Called when the light selection changes on the dropdown
     * @param {InputEvent} e 
     * @param {LightControls} lc 
     */
    static onSelectionInput(e, lc) {
        let light;
        // Determine the selection
        if (e.target.selectedOptions.length > 0) {
            let opt = e.target.selectedOptions[0];
            light = opt.light;
        }

        lc._selectedLight = light;

        // Initialize and activate/deactivate the controls
        for (let [i, input] of lc.positionInputs.entries()) {
            input.disabled = !light || !light.position;
            if (!input.disabled) {
                input.value = light.position[i];
            }
        }
        for (let [i, input] of lc.directionInputs.entries()) {
            input.disabled = !light || !light.rotation;
            if (!input.disabled) {
                let a = light.rotation[i];
                input.value = a;
                lc.directionDisplays[i].textContent = a.toFixed(1);
            }
        }
        {
            let input = lc.colorInput;
            input.disabled = !light || !light.color;
            if (!input.disabled) {
                input.value = LightControls._rgbToHex(light.color);
            }
        }
        {
            let input = lc.targetInput;
            input.disabled = !light || light.target === undefined;
            if (!input.disabled) {
                input.value = light.target;
                lc.targetDisplay.textContent = light.target.toFixed(1);
            }
        }
        {
            let input = lc.decayInput;
            input.disabled = !light || light.decay === undefined;
            if (!input.disabled) {
                input.value = light.decay;
                lc.decayDisplay.textContent = light.decay.toFixed(1);
            }
        }
        {
            let input = lc.innerConeInput;
            input.disabled = !light || light.innerCone === undefined;
            if (!input.disabled) {
                input.value = -light.innerCone;
                lc.innerConeDisplay.textContent = light.innerCone.toFixed(2);
            }
        }
        {
            let input = lc.outerConeInput;
            input.disabled = !light || light.outerCone === undefined;
            if (!input.disabled) {
                input.value = -light.outerCone;
                lc.outerConeDisplay.textContent = light.outerCone.toFixed(2);
            }
        }
        {
            let input = lc.isActiveInput;
            input.disabled = !light;
            if (!input.disabled) {
                input.checked = light.isActive;
            }
        }
    }

    /**
     * Called when the light status is changed from the input
     * @param {InputEvent} e
     * @param {LightControls} lc 
     */
    static onIsActiveChange(e, lc) {
        // Update light
        lc._selectedLight.isActive = e.target.checked;
    }

    /**
     * Called when the light position is changed from the input
     * @param {InputEvent} e
     * @param {LightControls} lc 
     */
    static onPositionInput(e, lc) {
        let i = e.target.axis;
        // Update light
        lc._selectedLight.position[i] = e.target.value;
    }

    /**
     * Called when the light direction is changed from the input
     * @param {InputEvent} e
     * @param {LightControls} lc 
     */
    static onDirectionInput(e, lc) {
        let i = e.target.axis;
        // Update light
        let a = Number(e.target.value);
        lc._selectedLight.rotation[i] = a;
        // Update display
        lc.directionDisplays[i].textContent = a.toFixed(1);
    }

    /**
     * Called when the light color is changed from the input
     * @param {InputEvent} e
     * @param {LightControls} lc 
     */
    static onColorInput(e, lc) {
        let color = LightControls._hexToRgb(e.target.value);
        // Update light
        lc._selectedLight.color = color;
    }

    /**
     * Called when the light target direction is changed from the input
     * @param {InputEvent} e
     * @param {LightControls} lc 
     */
     static onTargetInput(e, lc) {
        // Update light
        let a = Number(e.target.value);
        lc._selectedLight.target = a;
        // Update display
        lc.targetDisplay.textContent = a.toFixed(1);
    }

    /**
     * Called when the light decay is changed from the input
     * @param {InputEvent} e
     * @param {LightControls} lc 
     */
     static onDecayInput(e, lc) {
        // Update light
        let a = Number(e.target.value);
        lc._selectedLight.decay = a;
        // Update display
        lc.decayDisplay.textContent = a.toFixed(1);
    }

    /**
     * Called when the inner cone is changed from the input
     * @param {InputEvent} e
     * @param {LightControls} lc 
     */
     static onInnerConeInput(e, lc) {
        // Update light
        let a = Number(e.target.value);
        lc._selectedLight.innerCone = -a;
        // Update display
        lc.innerConeDisplay.textContent = a.toFixed(2);
    }

    /**
     * Called when the outer cone is changed from the input
     * @param {InputEvent} e
     * @param {LightControls} lc 
     */
     static onOuterConeInput(e, lc) {
        // Update light
        let a = Number(e.target.value);
        lc._selectedLight.outerCone = -a;
        // Update display
        lc.outerConeDisplay.textContent = a.toFixed(2);
    }

    /**
     * Converts an RGB color to its HEX representation
     * @param {number[]} color 
     */
    static _rgbToHex(color) {
        return color
            .map(x => Math.floor(x * 255))
            .map(n => n.toString(16).padStart(2, "0"))
            .reduce((acc, h) => acc + h, "#");
    }

    /**
     * Converts a HEX color to its RGB representation
     * @param {string} color
     */
    static _hexToRgb(color) {
        // Strip initial "#"
        color = color.substr(1);
        // Divide in three components
        color = color.match(/.{2}/g);
        // Convert to decimal in [0,1] range
        return color.map(hex => Number.parseInt(hex, 16) / 255);
    }
}