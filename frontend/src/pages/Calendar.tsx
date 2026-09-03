import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Trash2, Clock3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Project, Video } from '../lib/types';

type Post={id:string;video_id:string;project_id:string;platform:string;publish_at:string;caption:string;status:string;videos?:{original_name:string}|null;projects?:{name:string}|null};

export function Calendar(){
 const [posts,setPosts]=useState<Post[]>([]); const [videos,setVideos]=useState<Video[]>([]); const [projects,setProjects]=useState<Project[]>([]); const [selectedProject,setSelectedProject]=useState(''); const [selectedVideo,setSelectedVideo]=useState(''); const [when,setWhen]=useState(''); const [caption,setCaption]=useState(''); const [platform,setPlatform]=useState<'instagram'|'facebook'>('instagram'); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
 const load=async()=>{const {data}=await supabase.from('scheduled_posts').select('*,videos(original_name),projects(name)').order('publish_at',{ascending:true}); setPosts((data||[]) as Post[]);};
 useEffect(()=>{load(); supabase.from('projects').select('*').order('name').then(({data})=>{setProjects((data||[]) as Project[]); if(data?.[0]) setSelectedProject(data[0].id);});},[]);
 useEffect(()=>{ if(!selectedProject){setVideos([]);return;} supabase.from('videos').select('*').eq('project_id',selectedProject).in('status',['ready','uploaded','queued','processing']).order('sort_order').then(({data})=>{setVideos((data||[]) as Video[]); if(data?.[0]) setSelectedVideo(data[0].id);}); },[selectedProject]);
 const upcoming=useMemo(()=>posts.filter(p=>p.status==='scheduled').slice(0,20),[posts]);
 const schedule=async()=>{setMsg('');if(!selectedProject||!selectedVideo||!when){setMsg('Escolha projeto, vídeo e horário.');return;}setBusy(true);const {data:{user}}=await supabase.auth.getUser();if(!user){setMsg('Sessão expirada.');setBusy(false);return;}const {error}=await supabase.from('scheduled_posts').insert({user_id:user.id,project_id:selectedProject,video_id:selectedVideo,platform,publish_at:new Date(when).toISOString(),caption});setBusy(false);if(error)setMsg(error.message);else{setMsg('Agendamento criado.');setCaption('');setWhen('');await load();}};
 const cancel=async(id:string)=>{await supabase.from('scheduled_posts').update({status:'cancelled'}).eq('id',id);load();};
 return <div className="space-y-6">
  <div><p className="text-sm text-white/45">Calendário</p><h1 className="text-3xl font-black">Agendamentos</h1></div>
  <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
   <div className="glass rounded-3xl p-5 space-y-4">
    <h2 className="text-xl font-bold">Novo agendamento</h2>
    <select value={selectedProject} onChange={e=>setSelectedProject(e.target.value)} className="field"><option value="">Selecione o projeto</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <select value={selectedVideo} onChange={e=>setSelectedVideo(e.target.value)} className="field"><option value="">Selecione o vídeo</option>{videos.map(v=><option key={v.id} value={v.id}>{v.original_name}</option>)}</select>
    <select value={platform} onChange={e=>setPlatform(e.target.value as any)} className="field"><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select>
    <label className="text-sm text-white/60">Data e horário</label><input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} className="field"/>
    <textarea value={caption} onChange={e=>setCaption(e.target.value)} rows={4} placeholder="Legenda (opcional)" className="field resize-none"/>
    <button onClick={schedule} disabled={busy} className="btn btn-primary w-full">{busy?'Salvando…':'Agendar publicação'}</button>
    {msg&&<div className="rounded-xl bg-white/5 p-3 text-sm text-white/70">{msg}</div>}
   </div>
   <div className="glass rounded-3xl p-5"><div className="mb-4 flex items-center gap-2"><CalendarDays size={20}/><h2 className="text-xl font-bold">Próximos</h2></div>{upcoming.length===0?<div className="rounded-2xl border border-white/10 p-8 text-center text-white/45">Nenhum agendamento.</div>:<div className="space-y-3">{upcoming.map(p=><div key={p.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.03] p-4"><div><div className="font-semibold">{p.videos?.original_name||p.video_id}</div><div className="mt-1 flex items-center gap-2 text-xs text-white/45"><Clock3 size={13}/>{new Date(p.publish_at).toLocaleString('pt-BR')} · {p.platform}</div></div><button onClick={()=>cancel(p.id)} className="rounded-xl p-2 text-red-300 hover:bg-red-500/10" title="Cancelar"><Trash2 size={18}/></button></div>)}</div>}</div>
  </div>
 </div>
}
