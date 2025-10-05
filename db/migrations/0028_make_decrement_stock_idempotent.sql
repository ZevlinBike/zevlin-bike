-- Add an inventory lock to orders and make stock decrement idempotent per order
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS inventory_locked boolean NOT NULL DEFAULT false;

  CREATE OR REPLACE FUNCTION decrement_stock(order_id_param uuid)
  RETURNS void AS $$
  DECLARE
    line_item record;
    already_locked boolean;
  BEGIN
    SELECT inventory_locked INTO already_locked FROM orders WHERE id = order_id_param FOR UPDATE;
    IF already_locked THEN
      RETURN; -- idempotent: already decremented
    END IF;

    FOR line_item IN
      SELECT product_id, quantity FROM line_items WHERE order_id = order_id_param
    LOOP
      UPDATE products
      SET quantity_in_stock = quantity_in_stock - line_item.quantity
      WHERE id = line_item.product_id;
    END LOOP;

    UPDATE orders SET inventory_locked = true WHERE id = order_id_param;
  END;
  $$ LANGUAGE plpgsql;
END $$;

