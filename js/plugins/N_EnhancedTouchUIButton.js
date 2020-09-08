/* 
 * MIT License
 * 
 * Copyright (c) 2020 Nolonar
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

//=============================================================================
// Metadata
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Adds some improvements to the existing touch UI button.
 * @author Nolonar
 * @url https://github.com/Nolonar/RM_Plugins
 * 
 * @param displayMode
 * @text Show touch UI button
 * @desc When to show the touch UI. Mobiles are not affected, as the touch UI will always be visible.
 * @type select
 * @option Always
 * @option User-defined
 * @option Never
 * @default User-defined
 * 
 * @param isTouchUIDefault
 * @parent displayMode
 * @text Show button by default
 * @desc "User-defined" only. If Off, players must enable it in the options first.
 * @type boolean
 * @default false
 * 
 * @param textBottomButtonMode
 * @text "Touch UI at bottom" text
 * @desc The text to show for the "Touch UI at bottom" option.
 * @type string
 * @default Touch UI at bottom
 * 
 * 
 * @help Version 1.0.0
 * This plugin does not provide plugin commands.
 */

(() => {
    const PLUGIN_NAME = "N_EnhancedTouchUIButton";

    const OPTION_DISPLAYMODE_ALWAYS = "Always";
    const OPTION_DISPLAYMODE_USERDEFINED = "User-defined";
    const OPTION_DISPLAYMODE_NEVER = "Never";

    const parameters = PluginManager.parameters(PLUGIN_NAME);
    parameters.displayMode = parameters.displayMode || OPTION_DISPLAYMODE_USERDEFINED;
    parameters.isTouchUIDefault = parameters.isTouchUIDefault === "true";
    parameters.textBottomButtonMode = parameters.textBottomButtonMode || "Touch UI at bottom";

    const canConfigureTouchUI = parameters.displayMode === OPTION_DISPLAYMODE_USERDEFINED && !Utils.isMobileDevice();

    const functions_old = {};
    for (const f of ["buttonAreaTop", "buttonAreaBottom", "buttonAreaHeight"]) {
        functions_old[f] = Scene_Base.prototype[f];
        Scene_Base.prototype[f] = function () {
            return ConfigManager.touchUI ?
                functions_old[f].call(this) :
                0;
        }
    }

    const ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function () {
        const config = ConfigManager_makeData.call(this);
        config.isBottomButtonMode = this.isBottomButtonMode;
        return config;
    };

    const ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function (config) {
        ConfigManager_applyData.call(this, config);

        this.touchUI = Utils.isMobileDevice() || {
            [OPTION_DISPLAYMODE_ALWAYS]: true,
            [OPTION_DISPLAYMODE_USERDEFINED]: this.readFlag(config, "touchUI", parameters.isTouchUIDefault),
            [OPTION_DISPLAYMODE_NEVER]: false
        }[parameters.displayMode];
        this.isBottomButtonMode = this.readFlag(config, "isBottomButtonMode", false);
    };

    const Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function () {
        Window_Options_addGeneralOptions.call(this);

        if (canConfigureTouchUI)
            this.addCommand(parameters.textBottomButtonMode, "isBottomButtonMode");
        else
            this._list.remove(this._list.find(e => e.symbol === "touchUI"));
    }

    const Window_Options_setConfigValue = Window_Options.prototype.setConfigValue;
    Window_Options.prototype.setConfigValue = function (symbol, value) {
        Window_Options_setConfigValue.call(this, symbol, value);

        if (["touchUI", "isBottomButtonMode"].find(s => symbol === s))
            updateButtons();
    }

    function updateButtons() {
        const scene = SceneManager._scene;
        scene.createButtons();

        const buttonsToUpdate = [scene._cancelButton, scene._pageupButton, scene._pagedownButton];
        for (const button of buttonsToUpdate.filter(b => b)) {
            button.visible = ConfigManager.touchUI;
            button.y = scene.buttonY();
        }
    }

    const Scene_Options_maxCommands = Scene_Options.prototype.maxCommands;
    Scene_Options.prototype.maxCommands = function () {
        const additionalCommands = canConfigureTouchUI ? 1 : -1;
        return Scene_Options_maxCommands.call(this) + additionalCommands;
    }

    const Scene_Options_needsCancelButton = Scene_Options.prototype.needsCancelButton;
    Scene_Options.prototype.needsCancelButton = function () {
        return Scene_Options_needsCancelButton.call(this)
            && !this._cancelButton;
    }

    const Scene_Options_needsPageButtons = Scene_Options.prototype.needsPageButtons;
    Scene_Options.prototype.needsPageButtons = function () {
        return Scene_Options_needsPageButtons.call(this)
            && !this._pageupButton;
    }

    Scene_Base.prototype.isBottomButtonMode = () => ConfigManager.isBottomButtonMode;
})();
