create or replace function decrement_stock(order_id_param uuid)
returns void as $$
declare
  line_item record;
begin
  for line_item in
    select product_id, quantity from line_items where order_id = order_id_param
  loop
    update products
    set quantity_in_stock = quantity_in_stock - line_item.quantity
    where id = line_item.product_id;
  end loop;
end;
$$ language plpgsql;
