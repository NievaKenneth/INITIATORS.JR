
-- S1-DBA-04: Password Reset Tokens

CREATE TABLE IF NOT EXISTS public.password_reset_token (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Store only the SHA-256 hash, never the original token.
    token_hash VARCHAR(64) NOT NULL UNIQUE
        CHECK (token_hash ~ '^[0-9a-f]{64}$'),

    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookup indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_token_user
    ON public.password_reset_token(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_expiry
    ON public.password_reset_token(expires_at)
    WHERE is_used = FALSE;

-- Keep reset tokens inaccessible to browser-side roles.
ALTER TABLE public.password_reset_token
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.password_reset_token
    FROM PUBLIC, anon, authenticated;
