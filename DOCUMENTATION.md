# DOCUMENTATION

## Subscriptions
### Receiving webhooks from payment providers such as Stripe or Payrexx
The webhook will call `paymentProvider.updatePaymentWithIntentState()` which will create a payment. 
This creates a payment creation event which is `caught paymentProvider.setupPaymentProvider()`. 
Within this event another invoice event will be triggered which is handled in `events.invoiceModelEvents()`
