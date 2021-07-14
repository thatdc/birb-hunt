
function initializeUI() {
    // Add listeners for options
    let optPanel = document.getElementById("options-panel");
    let checkBoxes = optPanel.querySelectorAll("input[type=checkbox]");
    for (let c of checkBoxes) {
        // Initialize state
        c.checked = app.options[c.option] ?? false;
        // Add listener to track state
        c.addEventListener("change", onAppOptionsCheckBoxChange);
    }

    // Set visibility of framerate
    document.getElementById("framerate").hidden = !app.options["showFrameRate"] ?? true;
}

/**
 * Changes the option according to the checkbox status
 * @param {Event}
 */
function onAppOptionsCheckBoxChange(e) {
    let option = e.target.id.replace("opt-", "");
    app.options[option] = e.target.checked;
    if (option === "showFrameRate") {
        document.getElementById("framerate").hidden = e.target.checked === false;
    }
}

/**
 * Toggles the center panel (may be the splash screen or the pause menu)
 * @param visible
 */
function toggleCenterPanel(visible) {
    document.getElementById("options-panel").hidden = !visible;
}

/**
 * Updates the framerate displayed in the box
 * @param {number} frameRate 
 */
function updateFrameRate(frameRate) {
    if (app.options.showFrameRate) {
        document.getElementById("framerate").textContent = `FPS: ${frameRate.toFixed(1)}`;
    }
}