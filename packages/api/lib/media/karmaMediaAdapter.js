"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarmaMediaAdapter = exports.MediaServerError = void 0;
const form_data_1 = __importDefault(require("form-data"));
const node_fetch_1 = __importDefault(require("node-fetch"));
class MediaServerError extends Error {
    constructor(message) {
        super(`Received error from media server. Message: ${message}`);
    }
}
exports.MediaServerError = MediaServerError;
class KarmaMediaAdapter {
    constructor(url, token, internalURL = url) {
        this.url = url;
        this.token = token;
        this.internalURL = internalURL;
    }
    async _uploadImage(form) {
        // The form-data module reports a known length for the stream returned by createReadStream,
        // which is wrong, override it and always set it to false.
        // Related issue: https://github.com/form-data/form-data/issues/394
        form.hasKnownLength = () => false;
        const response = await (0, node_fetch_1.default)(this.internalURL, {
            method: 'POST',
            headers: { authorization: `Bearer ${this.token}` },
            body: form
        });
        const json = await response.json();
        if (response.status !== 200) {
            throw new MediaServerError(response.statusText);
        }
        const { id, filename, fileSize, extension, mimeType, format, width, height } = json;
        return {
            id,
            filename,
            fileSize,
            extension,
            mimeType,
            format,
            width,
            height
        };
    }
    async uploadImage(fileUpload) {
        const form = new form_data_1.default();
        const { filename: inputFilename, mimetype, createReadStream } = await fileUpload;
        form.append('file', createReadStream(), { filename: inputFilename, contentType: mimetype });
        return this._uploadImage(form);
    }
    async uploadImageFromArrayBuffer(arrayBufferUpload) {
        const form = new form_data_1.default();
        const { filename: inputFilename, mimetype, arrayBuffer } = await arrayBufferUpload;
        form.append('file', arrayBuffer, { filename: inputFilename, contentType: mimetype });
        return this._uploadImage(form);
    }
    async deleteImage(id) {
        const response = await (0, node_fetch_1.default)(`${this.internalURL}${id}`, {
            method: 'DELETE',
            headers: { authorization: `Bearer ${this.token}` }
        });
        if (response.status !== 204) {
            throw new MediaServerError(response.statusText);
        }
        return true;
    }
    async getImageURL({ id, filename, extension, focalPoint }, transformation) {
        var _a, _b;
        filename = filename || 'untitled';
        if (transformation) {
            const { width, height, rotation, output, quality } = transformation;
            const fullFilename = encodeURIComponent(`${filename}${output ? `.${output}` : extension}`);
            const transformations = [];
            if (width)
                transformations.push(`w_${width}`);
            if (height)
                transformations.push(`h_${height}`);
            if (rotation)
                transformations.push(`r_${rotation}`);
            if (output)
                transformations.push(`o_${output}`);
            if (quality)
                transformations.push(`q_${quality}`);
            if (focalPoint && (width || height)) {
                transformations.push(`f_${(_a = focalPoint.x) === null || _a === void 0 ? void 0 : _a.toFixed(3)}:${(_b = focalPoint.y) === null || _b === void 0 ? void 0 : _b.toFixed(3)}`);
            }
            if (transformations.length > 0) {
                return `${this.url}${id}/t/${transformations.join(',')}/${fullFilename}`;
            }
            else {
                return `${this.url}${id}/${fullFilename}`;
            }
        }
        else {
            const fullFilename = encodeURIComponent(`${filename}${extension}`);
            return `${this.url}${id}/${fullFilename}`;
        }
    }
}
exports.KarmaMediaAdapter = KarmaMediaAdapter;
//# sourceMappingURL=karmaMediaAdapter.js.map