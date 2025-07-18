"use strict";
// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_1 = require("./prompt");
const escapeException_1 = require("../utils/escapeException");
const figures = require("figures");
class CheckboxPrompt extends prompt_1.default {
    constructor(question, vscodeWrapper, ignoreFocusOut) {
        super(question, vscodeWrapper, ignoreFocusOut);
    }
    render() {
        let choices = this._question.choices.reduce((result, choice) => {
            let choiceName = choice.name || choice;
            result[`${(choice === null || choice === void 0 ? void 0 : choice.checked) === true ? figures.radioOn : figures.radioOff} ${choiceName}`] = choice;
            return result;
        }, {});
        let options = this.defaultQuickPickOptions;
        options.placeHolder = this._question.message;
        let quickPickOptions = Object.keys(choices);
        quickPickOptions.push(figures.tick);
        return this._vscodeWrapper
            .showQuickPickStrings(quickPickOptions, options)
            .then((result) => {
            var _a;
            if (result === undefined) {
                throw new escapeException_1.default();
            }
            if (result !== figures.tick && choices[result]) {
                choices[result].checked = !((_a = choices[result]) === null || _a === void 0 ? void 0 : _a.checked);
                return this.render();
            }
            return this._question.choices.reduce((result2, choice) => {
                if (choice && choice.checked === true) {
                    result2.push(choice.value);
                }
                return result2;
            }, []);
        });
    }
}
exports.default = CheckboxPrompt;

//# sourceMappingURL=checkbox.js.map
