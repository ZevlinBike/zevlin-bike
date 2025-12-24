-- Add address verification fields to orders for informational purposes
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS address_verified boolean,
  ADD COLUMN IF NOT EXISTS address_verification_message text;

COMMENT ON COLUMN orders.address_verified IS 'Indicates whether the shipping address was validated via Shippo during checkout.';
COMMENT ON COLUMN orders.address_verification_message IS 'Optional message from address validation (e.g., suggestions or warnings).';

