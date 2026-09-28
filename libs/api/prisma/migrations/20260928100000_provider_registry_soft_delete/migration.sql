-- The provider tables become the registry: a row is a configured provider.
--
-- Deleting one only hides it. A payment provider that is no longer offered must
-- still accept the webhooks of payments already in flight, and an invoice from
-- last year still has to render the name of the provider that took the money —
-- so the row stays and the provider keeps being instantiated. `deletedAt` only
-- takes it out of the lists that offer a provider for something new.
--
-- Mail and challenge are singletons and have no such column: the one row is
-- always the active one, and the way to change them is to switch their type.

ALTER TABLE "settings.paymentprovider" ADD COLUMN "deletedAt" TIMESTAMPTZ(3);
ALTER TABLE "settings.trackingpixel"   ADD COLUMN "deletedAt" TIMESTAMPTZ(3);
