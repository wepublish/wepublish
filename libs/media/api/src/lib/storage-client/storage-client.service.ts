import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { Client, ClientOptions, BucketItem } from 'minio';

export const STORAGE_CLIENT_MODULE_OPTIONS = Symbol(
  'STORAGE_CLIENT_MODULE_OPTIONS'
);

export type StorageClientConfig = ClientOptions;

@Injectable({
  scope: Scope.REQUEST,
})
export class StorageClient {
  private logger = new Logger('StorageClient');

  private client: Client;

  constructor(
    @Inject(STORAGE_CLIENT_MODULE_OPTIONS) config: StorageClientConfig
  ) {
    this.client = new Client(config);
  }

  public async hasFile(
    ...params: Parameters<Client['statObject']>
  ): Promise<boolean> {
    try {
      await this.client.statObject(...params);
      return true;
    } catch {
      return false;
    }
  }

  public getFile(...params: Parameters<Client['getObject']>) {
    return this.client.getObject(...params);
  }

  public getFileInformation(...params: Parameters<Client['statObject']>) {
    return this.client.statObject(...params);
  }

  public saveFile(...params: Parameters<Client['putObject']>) {
    return this.client.putObject(...params);
  }

  public deleteFile(...params: Parameters<Client['removeObject']>) {
    return this.client.removeObject(...params);
  }

  public async listFiles(
    ...params: Parameters<Client['listObjects']>
  ): Promise<BucketItem[]> {
    const data: BucketItem[] = [];
    return new Promise((resolve, reject) => {
      const stream = this.client.listObjects(...params);
      stream.on('data', function (obj: BucketItem) {
        data.push(obj);
      });
      stream.on('end', function () {
        resolve(data);
      });
      stream.on('error', function (err) {
        reject(err);
      });
    });
  }

  public deleteFiles(...params: Parameters<Client['removeObjects']>) {
    return this.client.removeObjects(...params);
  }
}
