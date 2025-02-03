import {ProLitterisGenerator, ReturnTrackingPixels} from '@wepublish/tracking-pixel/api'

export class InternalKey implements ProLitterisGenerator {
  constructor(private memberNr: string, private publisherInternalKeyDomain: string) {}
  async getTrackingPixels(internalTrackingId: string): Promise<ReturnTrackingPixels> {
    return {
      domain: this.publisherInternalKeyDomain,
      pixelUids: [`vzm.${this.memberNr}-${internalTrackingId}`]
    }
  }
}
