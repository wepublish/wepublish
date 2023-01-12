import pino from 'pino';
import { ContextOptions } from './context';
import { JobType } from './jobs';
export declare function logger(moduleName: string): pino.Logger;
export interface WepublishServerOpts extends ContextOptions {
    readonly playground?: boolean;
    readonly introspection?: boolean;
    readonly tracing?: boolean;
    readonly logger?: pino.Logger;
}
export declare class WepublishServer {
    private readonly opts;
    private readonly app;
    constructor(opts: WepublishServerOpts);
    listen(port?: number, hostname?: string): Promise<void>;
    runJob(command: JobType, data: any): Promise<void>;
    private setupPrismaMiddlewares;
}
//# sourceMappingURL=server.d.ts.map