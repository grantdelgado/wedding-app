-- Create storage policies for event-images bucket
-- Note: storage.objects RLS is managed by Supabase, we just create policies

-- Allow authenticated users to upload files to event-images bucket
-- Users can only upload to their own directory (user_id/*)
CREATE POLICY "Users can upload event images to their own directory"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view event images (public read access)
-- This allows the event images to be viewed by anyone with the URL
CREATE POLICY "Event images are publicly viewable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Allow users to update their own uploaded images
CREATE POLICY "Users can update their own event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (
  bucket_id = 'event-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their own event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
