# MyPageFlow Pessoal V3

Projeto pessoal inspirado no conceito de editor de Reels em lote. Não é um clone de código proprietário.

## Deploy na Vercel
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

## Environment Variables
### Frontend
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Server-only
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` = `gemini-2.5-flash`
- `META_APP_ID`
- `META_APP_SECRET`
- `APP_URL`
- `OAUTH_STATE_SECRET`
- `META_INSTAGRAM_REDIRECT_URI`
- `META_FACEBOOK_REDIRECT_URI`
- `META_INSTAGRAM_SCOPES`
- `META_FACEBOOK_SCOPES`

Never put `SUPABASE_SERVICE_ROLE_KEY`, `META_APP_SECRET` or `GEMINI_API_KEY` in a variable starting with `VITE_`.

## Supabase
1. Run `supabase/schema.sql` only if this is a new project.
2. Then run `supabase/migration_v2.sql` once. It is safe to rerun because the policy is dropped before being recreated.

## Notes
- Free Supabase currently limits individual files to 50 MB. For larger files, the app should use resumable TUS uploads, but the current V3 keeps the 50 MB limit intentionally.
- GitHub Actions worker processes queued jobs with FFmpeg.
- Instagram/Facebook OAuth routes are present, but platform-side app configuration/permissions must also be completed.
