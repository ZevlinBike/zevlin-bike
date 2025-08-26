CREATE POLICY "Allow authenticated users to create their own customer record"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());
