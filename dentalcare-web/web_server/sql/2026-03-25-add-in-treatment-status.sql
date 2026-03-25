-- Allow in_treatment status in bookings.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_status_check'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
  END IF;

  ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'pending'::text,
        'confirmed'::text,
        'in_treatment'::text,
        'completed'::text,
        'cancelled'::text
      ]
    )
  );
END $$;
