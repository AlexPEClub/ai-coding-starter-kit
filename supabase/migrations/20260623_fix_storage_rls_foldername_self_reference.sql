-- Fix: storage RLS group-membership checks for comment images & activity photos
--
-- The original policies extracted the activity id from the activity table's
-- `name` column instead of the uploaded storage object's path. Inside the
-- `FROM activities a` subquery an UNQUALIFIED `name` rebinds to activities.name
-- (inner scope shadows storage.objects), so is_group_member(NULL) => false and
-- EVERY upload/read was denied. This is why attaching an image to a comment
-- failed silently ("Upload fehlgeschlagen").
--
-- The activity id must be read from the OUTER storage row, so it has to be
-- qualified as storage.objects.name.
--
-- Path layout for both buckets: <activityId>/<userId>/<uuid>.<ext>
--   (storage.foldername(storage.objects.name))[1] = activityId
--   (storage.foldername(storage.objects.name))[2] = userId

-- ── activity-comment-images ────────────────────────────────────────────────
DROP POLICY IF EXISTS comment_images_insert ON storage.objects;
CREATE POLICY comment_images_insert ON storage.objects
  FOR INSERT TO public
  WITH CHECK (
    bucket_id = 'activity-comment-images'
    AND (auth.uid())::text = (storage.foldername(storage.objects.name))[2]
    AND is_group_member((
      SELECT a.group_id FROM activities a
      WHERE a.id = ((storage.foldername(storage.objects.name))[1])::uuid
    ))
  );

DROP POLICY IF EXISTS comment_images_select ON storage.objects;
CREATE POLICY comment_images_select ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id = 'activity-comment-images'
    AND is_group_member((
      SELECT a.group_id FROM activities a
      WHERE a.id = ((storage.foldername(storage.objects.name))[1])::uuid
    ))
  );

DROP POLICY IF EXISTS comment_images_delete ON storage.objects;
CREATE POLICY comment_images_delete ON storage.objects
  FOR DELETE TO public
  USING (
    bucket_id = 'activity-comment-images'
    AND (
      (auth.uid())::text = (storage.foldername(storage.objects.name))[2]
      OR is_group_admin((
        SELECT a.group_id FROM activities a
        WHERE a.id = ((storage.foldername(storage.objects.name))[1])::uuid
      ))
    )
  );

-- ── activity-photos (same latent bug) ──────────────────────────────────────
DROP POLICY IF EXISTS activity_photos_insert ON storage.objects;
CREATE POLICY activity_photos_insert ON storage.objects
  FOR INSERT TO public
  WITH CHECK (
    bucket_id = 'activity-photos'
    AND (auth.uid())::text = (storage.foldername(storage.objects.name))[2]
    AND is_group_member((
      SELECT a.group_id FROM activities a
      WHERE a.id = ((storage.foldername(storage.objects.name))[1])::uuid
    ))
  );

DROP POLICY IF EXISTS activity_photos_select ON storage.objects;
CREATE POLICY activity_photos_select ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id = 'activity-photos'
    AND is_group_member((
      SELECT a.group_id FROM activities a
      WHERE a.id = ((storage.foldername(storage.objects.name))[1])::uuid
    ))
  );

DROP POLICY IF EXISTS activity_photos_delete ON storage.objects;
CREATE POLICY activity_photos_delete ON storage.objects
  FOR DELETE TO public
  USING (
    bucket_id = 'activity-photos'
    AND (
      (auth.uid())::text = (storage.foldername(storage.objects.name))[2]
      OR is_group_admin((
        SELECT a.group_id FROM activities a
        WHERE a.id = ((storage.foldername(storage.objects.name))[1])::uuid
      ))
    )
  );
