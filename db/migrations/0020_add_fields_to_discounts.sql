ALTER TABLE discounts
ADD COLUMN description TEXT,
ADD COLUMN product_ids UUID[],
ADD COLUMN usage_limit INT,
ADD COLUMN uses INT DEFAULT 0,
ADD COLUMN expiration_date TIMESTAMPTZ;
