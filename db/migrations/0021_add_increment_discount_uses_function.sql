CREATE OR REPLACE FUNCTION increment_discount_uses(discount_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE discounts
  SET uses = uses + 1
  WHERE code = discount_code;
END;
$$ LANGUAGE plpgsql;
