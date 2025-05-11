import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {PrimeDataLoader} from '@wepublish/utils/api'
import {PaywallDataloaderService} from './paywall-dataloader.service'

@Injectable()
export class PaywallService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(PaywallDataloaderService)
  public getPaywalls() {
    return this.prisma.paywall.findMany({})
  }

  @PrimeDataLoader(PaywallDataloaderService)
  public getPaywall(id: string) {
    return this.prisma.paywall.findUnique({
      where: {
        id
      }
    })
  }

  @PrimeDataLoader(PaywallDataloaderService)
  public createPaywall() {}

  @PrimeDataLoader(PaywallDataloaderService)
  public updatePaywall() {}

  public deletePaywall(id: string) {}
}
