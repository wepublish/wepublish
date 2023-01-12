"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageSort = exports.ImageOutput = exports.ImageRotation = void 0;
var ImageRotation;
(function (ImageRotation) {
    ImageRotation["Auto"] = "auto";
    ImageRotation["Rotate0"] = "0";
    ImageRotation["Rotate90"] = "90";
    ImageRotation["Rotate180"] = "180";
    ImageRotation["Rotate270"] = "270";
})(ImageRotation = exports.ImageRotation || (exports.ImageRotation = {}));
var ImageOutput;
(function (ImageOutput) {
    ImageOutput["PNG"] = "png";
    ImageOutput["JPEG"] = "jpeg";
    ImageOutput["WEBP"] = "webp";
})(ImageOutput = exports.ImageOutput || (exports.ImageOutput = {}));
var ImageSort;
(function (ImageSort) {
    ImageSort["CreatedAt"] = "modifiedAt";
    ImageSort["ModifiedAt"] = "modifiedAt";
})(ImageSort = exports.ImageSort || (exports.ImageSort = {}));
//# sourceMappingURL=image.js.map