import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateAICaption } from '../lib/ai';
import type { Project, Video, PresetConfig } from '../lib/types';
import { defaultPreset } from '../lib/types';

export function Editor({ project, video, onDone }: { project: Project; video?: Video; onDone: () => void }) {
  const [cfg, setCfg] = useState<PresetConfig>(defaultPreset);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const set = (k: keyof PresetConfig, v: any) => setCfg(c => ({ ...c, [k]: v }));

  const handleGenerateIA = async () => {
    setGenerating(true);
    try {
      const topic = video?.original_name || project.name;
      const prompt = `Crie uma legenda engajadora para o Instagram Reels sobre o tema "${topic}". Inclua uma chamada para ação (CTA) marcante e 5 hashtags relevantes no final.`;
      const generatedCaption = await generateAICaption(prompt);
      set('caption', generatedCaption);
    } catch (err) {
      alert('Erro ao gerar legenda com o Gemini. Verifique a chave da API.');
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    await supabase.from('presets').upsert({ project_id: project.id, name: 'Padrão principal', config: cfg });
    if (video) await supabase.from('videos').update({ caption: cfg.caption }).eq('id', video.id);
    setSaving(false);
    onDone();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/45">Editor de padrão</p>
          <h1 className="text-3xl font-black">{video?.original_name || project.name}</h1>
        </div>
        <button onClick={save} className="btn btn-primary">{saving ? 'Salvando…' : 'Salvar padrão'}</button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="glass rounded-3xl p-5">
          <div className="mx-auto flex aspect-[9/16] max-w-[360px] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#18101e] to-[#0b0a0e] text-center shadow-2xl">
            <div className="space-y-5 px-8">
              <div className="text-sm font-bold text-white/35">PREVIEW</div>
              {cfg.titleEnabled && <div style={{ fontSize: cfg.titleSize }} className="font-black leading-none">{cfg.title || 'Seu título'}</div>}
              <div className="text-6xl">🎬</div>
              {cfg.footerEnabled && <div className="text-sm text-white/60">{cfg.footer || 'Seu texto inferior'}</div>}
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 space-y-6">
          <Section title="Enquadramento">
            <select value={cfg.aspectRatio} onChange={e => set('aspectRatio', e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <option>9:16</option>
              <option>1:1</option>
              <option>16:9</option>
            </select>
            <Field label="Zoom">
              <input type="range" min="1" max="2" step=".01" value={cfg.zoom} onChange={e => set('zoom', +e.target.value)} className="w-full" />
            </Field>
          </Section>

          <Section title="Bordas">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={cfg.borderEnabled} onChange={e => set('borderEnabled', e.target.checked)} /> Ativar borda
            </label>
            <Field label="Espessura">
              <input type="range" min="0" max="40" value={cfg.borderWidth} onChange={e => set('borderWidth', +e.target.value)} className="w-full" />
            </Field>
          </Section>

          <Section title="Título">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={cfg.titleEnabled} onChange={e => set('titleEnabled', e.target.checked)} /> Ativar
            </label>
            <input value={cfg.title} onChange={e => set('title', e.target.value)} placeholder="Título fixo" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          </Section>

          <Section title="Inferior">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={cfg.footerEnabled} onChange={e => set('footerEnabled', e.target.checked)} /> Ativar
            </label>
            <input value={cfg.footer} onChange={e => set('footer', e.target.value)} placeholder="Texto inferior" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          </Section>

          <Section title="Legenda">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-white/40">Gere com IA ou digite manualmente:</span>
              <button
                type="button"
                onClick={handleGenerateIA}
                disabled={generating}
                className="rounded-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
              >
                {generating ? 'Gerando...' : '✨ Gerar Legenda (Gemini)'}
              </button>
            </div>
            <textarea
              value={cfg.caption}
              onChange={e => set('caption', e.target.value)}
              rows={5}
              placeholder="CTA / legenda padrão"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
          </Section>

          <Section title="Overlay / Logo">
            <input value={cfg.overlayPath} onChange={e => set('overlayPath', e.target.value)} placeholder="Caminho do PNG no Storage" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
            <Field label="Opacidade">
              <input type="range" min="0" max="1" step=".01" value={cfg.overlayOpacity} onChange={e => set('overlayOpacity', +e.target.value)} className="w-full" />
            </Field>
            <Field label="Escala">
              <input type="range" min=".05" max=".7" step=".01" value={cfg.overlayScale} onChange={e => set('overlayScale', +e.target.value)} className="w-full" />
            </Field>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold text-white/70">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <div>
      <div className="mb-1 text-xs text-white/40">{label}</div>
      {children}
    </div>
  );
}
