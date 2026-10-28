import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  type NamespaceResetListener,
  NamespaceResets,
} from '@wepublish/kv-ttl-cache/api';
import {
  WebsiteLayoutSignal,
  WebsitePagesSignal,
} from '@wepublish/website-revalidation/api';
import {
  PAGE_CONTENT_NAMESPACES,
  WEBSITE_LAYOUT_NAMESPACES,
} from './public-content-namespaces';

const pageContent = new Set<string>(PAGE_CONTENT_NAMESPACES);
const websiteLayout = new Set<string>(WEBSITE_LAYOUT_NAMESPACES);

@Injectable()
export class WebsiteResetListener
  implements NamespaceResetListener, OnModuleInit
{
  constructor(
    private readonly resets: NamespaceResets,
    private readonly pages: WebsitePagesSignal,
    private readonly layout: WebsiteLayoutSignal
  ) {}

  onModuleInit() {
    this.resets.register(this);
  }

  async onNamespaceReset(namespace: string): Promise<void> {
    if (pageContent.has(namespace)) {
      await this.pages.recordChange();
    }

    if (websiteLayout.has(namespace)) {
      await this.layout.changed();
    }
  }
}
