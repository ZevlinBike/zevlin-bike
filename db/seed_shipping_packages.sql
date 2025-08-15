-- -----------------------------------------------------------------------------
-- SEED SHIPPING PACKAGES
-- -----------------------------------------------------------------------------
-- This script inserts a variety of common shipping package sizes into the
-- shipping_packages table. Dimensions are in CM and weights are in GRAMS.
-- The ON CONFLICT (name) DO NOTHING clause prevents errors if you run this
-- script multiple times.
-- -----------------------------------------------------------------------------

-- To ensure the UNIQUE constraint on `is_default` is not violated,
-- we first set all existing packages to not be the default.
UPDATE shipping_packages SET is_default = false;

-- -------------------------------------
-- USPS (United States Postal Service)
-- -------------------------------------
INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('USPS Padded Flat Rate Envelope', 31.75, 24.13, 1.9, 57, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('USPS Legal Flat Rate Envelope', 38.1, 24.13, 1.9, 85, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('USPS Small Flat Rate Box', 21.9, 13.7, 4.1, 198, true) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('USPS Medium Flat Rate Box (Top Load)', 27.9, 21.6, 14, 397, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('USPS Medium Flat Rate Box (Side Load)', 34.6, 30.2, 8.6, 454, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('USPS Large Flat Rate Box', 30.5, 30.5, 14, 567, false) ON CONFLICT (name) DO NOTHING;

-- -------------------------------------
-- UPS (United Parcel Service)
-- -------------------------------------
INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('UPS Express Pak', 40.6, 31.7, 1.9, 57, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('UPS Express Box - Small', 33, 28, 5.1, 227, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('UPS Express Box - Medium', 40.6, 28, 7.6, 340, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('UPS Express Box - Large', 45.7, 33, 7.6, 482, false) ON CONFLICT (name) DO NOTHING;

-- -------------------------------------
-- FedEx
-- -------------------------------------
INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('FedEx Padded Pak', 29.8, 37.5, 2.5, 57, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('FedEx Small Box', 27.6, 22.5, 6, 255, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('FedEx Medium Box', 29, 23, 10, 369, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('FedEx Large Box', 32, 20, 15, 510, false) ON CONFLICT (name) DO NOTHING;

-- -------------------------------------
-- Generic Mailers & Boxes
-- -------------------------------------
INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('Poly Mailer 6x9 in', 22.9, 15.2, 0.6, 10, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('Poly Mailer 10x13 in', 33, 25.4, 0.6, 20, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('Padded Mailer 4x8 in', 20.3, 10.2, 1.3, 15, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('Padded Mailer 8.5x12 in', 30.5, 21.6, 1.3, 30, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('Small Box 6x4x4 in', 15.2, 10.2, 10.2, 113, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('Small Box 8x6x4 in', 20.3, 15.2, 10.2, 170, false) ON CONFLICT (name) DO NOTHING;

INSERT INTO shipping_packages (name, length_cm, width_cm, height_cm, weight_g, is_default) VALUES
('Medium Box 10x8x6 in', 25.4, 20.3, 15.2, 283, false) ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- After running, verify the default package was set correctly.
-- -----------------------------------------------------------------------------
-- SELECT * FROM shipping_packages WHERE is_default = true;
-- -----------------------------------------------------------------------------
