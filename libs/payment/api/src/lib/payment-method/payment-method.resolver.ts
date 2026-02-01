import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  CanCreatePaymentMethod,
  CanDeletePaymentMethod,
  CanGetPaymentMethod,
  CanGetPaymentMethods,
  CanGetPaymentProviders,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  CreatePaymentMethodInput,
  PaymentMethod,
  PaymentProvider,
  UpdatePaymentMethodInput,
} from './payment-method.model';
import { PaymentMethodService } from './payment-method.service';
import { PaymentMethodDataloader } from './payment-method.dataloader';
import { PaymentProviderDataloader } from './payment-provider.dataloader';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentMethod as PPaymentMethod } from '@prisma/client';
import { Inject } from '@nestjs/common';
import {
  PAYMENT_METHOD_CONFIG,
  PaymentMethodConfig,
} from './payment-method.config';

@Resolver(() => PaymentMethod)
export class PaymentMethodResolver {
  constructor(
    private paymentMethodService: PaymentMethodService,
    private paymentMethodsDataloader: PaymentMethodDataloader,
    private paymentProviderDataloader: PaymentProviderDataloader,
    private paymentProviderService: PaymentProviderService,
    @Inject(PAYMENT_METHOD_CONFIG) private moduleConfig: PaymentMethodConfig
  ) {}

  @Permissions(CanGetPaymentMethod)
  @Query(() => PaymentMethod, {
    description: `Returns a payment method by id`,
  })
  async paymentMethod(@Args('id') id: string) {
    return this.paymentMethodsDataloader.load(id);
  }

  @Permissions(CanGetPaymentMethods)
  @Query(() => [PaymentMethod], {
    description: `Returns all payment methods`,
  })
  async paymentMethods() {
    return this.paymentMethodService.getPaymentMethods();
  }

  @Permissions(CanCreatePaymentMethod)
  @Mutation(returns => PaymentMethod, {
    description: `Creates a new payment method.`,
  })
  public createPaymentMethod(@Args() paymentMethod: CreatePaymentMethodInput) {
    return this.paymentMethodService.createPaymentMethod(paymentMethod);
  }

  @Permissions(CanCreatePaymentMethod)
  @Mutation(returns => PaymentMethod, {
    description: `Updates an existing payment method.`,
  })
  public updatePaymentMethod(@Args() paymentMethod: UpdatePaymentMethodInput) {
    return this.paymentMethodService.updatePaymentMethod(paymentMethod);
  }

  @Permissions(CanDeletePaymentMethod)
  @Mutation(returns => PaymentMethod, {
    description: `Deletes an existing payment method.`,
  })
  public deletePaymentMethod(@Args('id') id: string) {
    return this.paymentMethodService.deletePaymentMethod(id);
  }

  @Permissions(CanGetPaymentProviders)
  @Query(() => [PaymentProvider], {
    description: `Returns all payment providers`,
  })
  public async paymentProviders() {
    const providers =
      await this.paymentProviderService.getAllPaymentProviders();
    providers.forEach(provider => {
      this.paymentProviderDataloader.prime(provider.id, provider);
    });
    return providers;
  }

  @ResolveField(() => PaymentProvider, { nullable: true })
  public paymentProvider(@Parent() { paymentProviderID }: PPaymentMethod) {
    return this.paymentProviderDataloader.load(paymentProviderID);
  }
}
