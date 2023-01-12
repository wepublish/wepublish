"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPassword = exports.updatePublicUser = exports.uploadPublicUserProfileImage = exports.updatePaymentProviderCustomers = void 0;
const user_1 = require("../../db/user");
const error_1 = require("../../error");
const validator_1 = require("../../validator");
const updatePaymentProviderCustomers = async (paymentProviderCustomers, authenticateUser, userClient) => {
    const { user } = authenticateUser();
    const updateUser = await userClient.update({
        where: { id: user.id },
        data: {
            paymentProviderCustomers
        },
        select: user_1.unselectPassword
    });
    if (!updateUser)
        throw new error_1.NotFound('User', user.id);
    return updateUser.paymentProviderCustomers;
};
exports.updatePaymentProviderCustomers = updatePaymentProviderCustomers;
/**
 * Uploads the user profile image and returns the image and updated user
 * @param uploadImageInput
 * @param authenticateUser
 * @param mediaAdapter
 * @param imageClient
 * @param userClient
 */
async function uploadPublicUserProfileImage(uploadImageInput, authenticateUser, mediaAdapter, imageClient, userClient) {
    const { user } = authenticateUser();
    // ignore
    if (uploadImageInput === undefined) {
        return null;
    }
    let newImage = null;
    if (uploadImageInput) {
        // upload new image
        const { file, filename, title, description, tags, source, link, license, focalPoint } = uploadImageInput;
        const _a = await mediaAdapter.uploadImage(file), { id: newImageId } = _a, image = __rest(_a, ["id"]);
        const prismaImgData = Object.assign(Object.assign({ id: newImageId }, image), { filename: filename !== null && filename !== void 0 ? filename : image.filename, title,
            description,
            tags,
            source,
            link,
            license, focalPoint: {
                create: focalPoint
            } });
        // update existing image
        if (user.userImageID) {
            newImage = await imageClient.update({
                where: {
                    id: user.userImageID
                },
                data: prismaImgData
            });
        }
        else {
            // create new image
            newImage = await imageClient.create({ data: prismaImgData });
        }
        // cleanup existing user profile from file system
        if (newImage && user.userImageID) {
            await mediaAdapter.deleteImage(user.userImageID);
        }
    }
    // eventually delete image, if upload is set to null
    if (uploadImageInput === null && user.userImageID) {
        // delete image from file system
        await mediaAdapter.deleteImage(user.userImageID);
        // delete image from database
        await imageClient.delete({ where: { id: user.userImageID } });
    }
    return await userClient.update({
        where: {
            id: user.id
        },
        data: {
            userImageID: newImage === null || newImage === void 0 ? void 0 : newImage.id
        },
        select: user_1.unselectPassword
    });
}
exports.uploadPublicUserProfileImage = uploadPublicUserProfileImage;
const updatePublicUser = async ({ address, name, email, firstName, preferredName, uploadImageInput }, authenticateUser, mediaAdapter, userClient, imageClient) => {
    const { user } = authenticateUser();
    email = email ? email.toLowerCase() : email;
    await validator_1.Validator.createUser().validateAsync({ address, name, email, firstName, preferredName }, { allowUnknown: true });
    if (email && user.email !== email) {
        const userExists = await userClient.findUnique({
            where: { email }
        });
        if (userExists)
            throw new error_1.EmailAlreadyInUseError();
    }
    // eventually upload user profile image
    await uploadPublicUserProfileImage(uploadImageInput, authenticateUser, mediaAdapter, imageClient, userClient);
    const updateUser = await userClient.update({
        where: { id: user.id },
        data: {
            name,
            firstName,
            preferredName,
            address: {
                update: address
            }
        },
        select: user_1.unselectPassword
    });
    return updateUser;
};
exports.updatePublicUser = updatePublicUser;
const updateUserPassword = async (password, passwordRepeated, hashCostFactor, authenticateUser, userClient) => {
    const { user } = authenticateUser();
    if (!user)
        throw new error_1.NotAuthenticatedError();
    if (password !== passwordRepeated) {
        throw new error_1.UserInputError('password and passwordRepeat are not equal');
    }
    return userClient.update({
        where: { id: user.id },
        data: {
            password: await (0, user_1.hashPassword)(password, hashCostFactor)
        },
        select: user_1.unselectPassword
    });
};
exports.updateUserPassword = updateUserPassword;
//# sourceMappingURL=user.public-mutation.js.map