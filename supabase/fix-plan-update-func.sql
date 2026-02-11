-- Create the update_user_plan function
CREATE OR REPLACE FUNCTION public.update_user_plan(user_id_input UUID, new_plan TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate the plan
  IF new_plan NOT IN ('starter', 'pro', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid plan type';
  END IF;

  -- Update the user's plan
  UPDATE public.profiles
  SET 
    plan = new_plan,
    updated_at = NOW()
  WHERE id = user_id_input;

  -- Verify update happened
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_plan(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_plan(UUID, TEXT) TO service_role;

-- Reload the schema cache to ensure the function is immediately available
NOTIFY pgrst, 'reload schema';
