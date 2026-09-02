# MyPageFlow Pessoal

V1 pessoal inspirada no fluxo de estúdio de edição em lote: projetos, biblioteca, presets, upload, fila de processamento, FFmpeg e Gemini.

## Arquitetura
- Frontend: React + TypeScript + Vite + Tailwind
- Backend de dados/auth: Supabase
- IA: Gemini API
- Processamento: FFmpeg em GitHub Actions
- Hospedagem do frontend: Vercel

## 1. Variáveis do frontend
Crie `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
VITE_GEMINI_API_KEY=
```

> A chave secreta do Supabase **não** deve ir para o frontend. Para a V1 ela fica somente em secrets do worker.

## 2. Banco
No Supabase, abra SQL Editor e execute `supabase/schema.sql`.
Depois habilite o Storage criando um bucket chamado `videos` (público: não).

## 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 4. Worker local
Requisitos: Python 3.11+, FFmpeg e Git.

```bash
cd worker
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python process_pending.py
```

## 5. GitHub Actions
Configure no repositório:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- opcional `GEMINI_API_KEY`

O workflow pode ser executado manualmente ou por agenda. Ele processa jobs pendentes.

## 6. Deploy Vercel
Importe o diretório `frontend` como projeto Vercel e adicione:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Próximas fases
- Calendário
- OAuth Instagram/Meta
- Publicação automática
- Templates avançados
- Métricas
