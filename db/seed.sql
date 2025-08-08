-- Seed your database with initial product data.

-- Clear existing data
DELETE FROM products;

-- Insert new products
INSERT INTO products (id, name, description, price_cents, slug) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Crack Chamois Cream', 'Crack is our natural, non-tingle chamois cream formula designed for both the cooler riding days and for those who do not really need or want an extra kick in the chamois while they ride. Our crack chamois cream creates a comfortable barrier using tea tree leaf oil, electric daisy extract and organic witch hazel extract. All of which keep you soothed and protected so all you have to do is ride.', 2399, 'crack-chamois-cream'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Super Crack Chamois Cream', 'SuperCrack has the slightly tingly, cooling properties of peppermint oil, electric daisy extract and organic witch hazel extract added to our Crack formula, giving riders and their bits some extra relief when the temps are rising outside and inside their shorts during a workout, leaving them feeling minty fresh when the ride is done. Help you enjoy your ride from start to finish day after day.', 2399, 'super-crack-chamois-cream'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'BYOT Fitness Wash', 'No shower? No problem. Spray yourself down post-ride to clean up with just a towel. BYOT is your on-the-go refresh solution.', 1499, 'byot-fitness-wash'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'BYOT Towel', 'Bring Your Own Towel. Compact, absorbent, and ready to get you cleaned up after a ride when a shower''s out of reach.', 299, 'byot-towel'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Zevlin Gaiter', 'Multi-use microfiber gaiter: neck warmer, face shield, headband—or show off your Zevlin style however you wear it.', 999, 'zevlin-gaiter');
