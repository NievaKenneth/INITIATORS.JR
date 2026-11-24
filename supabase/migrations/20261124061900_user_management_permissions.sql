-- S1-DBA-03: User Management and Permissions

-- 1. Roles
CREATE TABLE IF NOT EXISTS public.role (
    role_code VARCHAR(20) PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Modules
CREATE TABLE IF NOT EXISTS public.module (
    module_code VARCHAR(30) PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- 3. Rights catalogue
CREATE TABLE IF NOT EXISTS public.rights (
    right_code VARCHAR(60) PRIMARY KEY,
    module_code VARCHAR(30) NOT NULL
        REFERENCES public.module(module_code),
    description VARCHAR(150) NOT NULL
);

-- 4. Application users
-- Authentication credentials are managed by Supabase Auth.
CREATE TABLE IF NOT EXISTS public.app_user (
    user_id UUID PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role_code VARCHAR(20) NOT NULL DEFAULT 'user'
        REFERENCES public.role(role_code),
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(10) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Active', 'Inactive')),
    stamp VARCHAR(80)
);

-- 5. User permissions
CREATE TABLE IF NOT EXISTS public.user_permission (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES public.app_user(user_id) ON DELETE CASCADE,
    right_code VARCHAR(60) NOT NULL
        REFERENCES public.rights(right_code),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    stamp VARCHAR(80),
    CONSTRAINT user_permission_user_right_unique
        UNIQUE (user_id, right_code)
);

-- Helpful lookup indexes
CREATE INDEX IF NOT EXISTS idx_app_user_role
    ON public.app_user(role_code);

CREATE INDEX IF NOT EXISTS idx_user_permission_user
    ON public.user_permission(user_id);

CREATE INDEX IF NOT EXISTS idx_user_permission_active
    ON public.user_permission(user_id, right_code)
    WHERE is_deleted = FALSE;
