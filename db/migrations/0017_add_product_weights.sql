CREATE TYPE weight_unit AS ENUM ('oz', 'lb', 'g', 'kg');

ALTER TABLE products
ADD COLUMN weight NUMERIC(10, 2),
ADD COLUMN weight_unit weight_unit;
