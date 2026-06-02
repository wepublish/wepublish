import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VoucherService } from './voucher.service';
import {
  CreateVoucherInput,
  Voucher,
  PaginatedVouchers,
  VoucherListArgs,
  UpdateVoucherInput,
} from './voucher.model';
import {
  CanGetVoucher,
  CanCreateVoucher,
  CanDeleteVoucher,
  CanUpdateVoucher,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { VoucherDataloader } from './voucher.dataloader';
import { NotFoundException } from '@nestjs/common';

@Resolver(() => Voucher)
export class VoucherResolver {
  constructor(
    private voucherService: VoucherService,
    private dataloader: VoucherDataloader
  ) {}

  @Permissions(CanGetVoucher)
  @Query(() => Voucher, { description: `Returns an voucher by id or voucher.` })
  public async voucher(@Args('id') id: string) {
    const voucher = await this.dataloader.load(id);

    if (!voucher) {
      throw new NotFoundException(`Voucher with id ${id} was not found.`);
    }

    return voucher;
  }

  @Permissions(CanGetVoucher)
  @Query(() => PaginatedVouchers, {
    description: 'This query returns a list of vouchers',
  })
  async vouchers(@Args() args: VoucherListArgs) {
    return this.voucherService.getVouchers(args);
  }

  @Permissions(CanCreateVoucher)
  @Mutation(returns => Voucher, { description: `Creates a new voucher.` })
  public createVoucher(@Args() voucher: CreateVoucherInput) {
    return this.voucherService.createVoucher(voucher);
  }

  @Permissions(CanUpdateVoucher)
  @Mutation(returns => Voucher, { description: `Updates an existing voucher.` })
  public updateVoucher(@Args() voucher: UpdateVoucherInput) {
    return this.voucherService.updateVoucher(voucher);
  }

  @Permissions(CanDeleteVoucher)
  @Mutation(returns => Voucher, { description: `Deletes an existing voucher.` })
  public deleteVoucher(@Args('id') id: string) {
    return this.voucherService.deleteVoucher(id);
  }
}
