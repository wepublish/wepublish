import { DBImageAdapter, CreateImageArgs, OptionalImage, UpdateImageArgs, DeleteImageArgs, Image, ConnectionResult, GetImagesArgs } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBImageAdapter implements DBImageAdapter {
    private images;
    private locale;
    constructor(db: Db, locale: string);
    createImage({ id, input }: CreateImageArgs): Promise<OptionalImage>;
    updateImage({ id, input }: UpdateImageArgs): Promise<OptionalImage>;
    deleteImage({ id }: DeleteImageArgs): Promise<boolean | null>;
    getImagesByID(ids: readonly string[]): Promise<OptionalImage[]>;
    getImages({ filter, sort, order, cursor, limit }: GetImagesArgs): Promise<ConnectionResult<Image>>;
}
//# sourceMappingURL=image.d.ts.map