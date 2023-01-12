import { DBNavigationAdapter, UpdateNavigationArgs, OptionalNavigation, DeleteNavigationArgs, Navigation, CreateNavigationArgs } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBNavigationAdapter implements DBNavigationAdapter {
    private navigations;
    constructor(db: Db);
    createNavigation({ input }: CreateNavigationArgs): Promise<Navigation>;
    updateNavigation({ id, input }: UpdateNavigationArgs): Promise<OptionalNavigation>;
    deleteNavigation({ id }: DeleteNavigationArgs): Promise<string | null>;
    getNavigations(): Promise<Navigation[]>;
    getNavigationsByID(ids: readonly string[]): Promise<OptionalNavigation[]>;
    getNavigationsByKey(keys: readonly string[]): Promise<OptionalNavigation[]>;
}
//# sourceMappingURL=navigation.d.ts.map