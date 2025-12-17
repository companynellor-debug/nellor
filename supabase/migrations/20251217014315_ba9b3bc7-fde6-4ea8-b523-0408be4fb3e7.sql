-- Add admin role to user natan@gmail.com (adjust user_id as needed)
INSERT INTO public.user_roles (user_id, role)
VALUES ('6a9ff562-0e22-48f0-9e99-26bcc891c6ef', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also update the profile tipo to admin
UPDATE public.profiles 
SET tipo = 'admin' 
WHERE id = '6a9ff562-0e22-48f0-9e99-26bcc891c6ef';