import { useEffect,useState } from 'react';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Library } from './pages/Library';
import { Editor } from './pages/Editor';
import { Accounts } from './pages/Accounts';
import { Calendar } from './pages/Calendar';
import { Privacy,Terms,Deletion } from './pages/Legal';
import type { Project,Video } from './lib/types';
export default function App(){
 const path=window.location.pathname;if(path==='/privacidade')return <Privacy/>;if(path==='/termos')return <Terms/>;if(path==='/exclusao-de-dados')return <Deletion/>;
 const [session,setSession]=useState<any>(null);const [page,setPage]=useState('dashboard');const [project,setProject]=useState<Project|null>(null);const [video,setVideo]=useState<Video|undefined>();const [stats,setStats]=useState({projects:0,videos:0,ready:0,queued:0});
 const loadStats=async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user)return;const [p,v]=await Promise.all([supabase.from('projects').select('id').eq('user_id',user.id),supabase.from('videos').select('id,status').eq('user_id',user.id)]);const vids=v.data||[];setStats({projects:p.data?.length||0,videos:vids.length,ready:vids.filter(x=>x.status==='ready').length,queued:vids.filter(x=>x.status==='queued'||x.status==='processing').length})};
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[]);useEffect(()=>{if(session)loadStats()},[session,page]);
 useEffect(()=>{const p=new URLSearchParams(window.location.search);if(p.get('meta_success')){alert(`${p.get('meta_success')} conectado com sucesso.`);window.history.replaceState({},'',window.location.pathname)}if(p.get('meta_error')){alert(`Meta: ${p.get('meta_error')}`);window.history.replaceState({},'',window.location.pathname)}},[]);
 if(!session)return <Auth/>;const userId=session.user.id;
 const createProject=async()=>{const name=window.prompt('Nome do projeto');if(!name)return;const {data,error}=await supabase.from('projects').insert({user_id:userId,name,description:'Projeto pessoal'}).select().single();if(!error&&data){setProject(data);setPage('library')}};
 const nav=(p:string)=>{if(p==='library'&&project){setPage('library');return;}setPage(p)};const logout=async()=>{await supabase.auth.signOut()};
 const content=page==='dashboard'?<Dashboard stats={stats} onCreateProject={createProject}/>:page==='projects'?<Projects userId={userId} onCreate={createProject} onOpen={p=>{setProject(p);setPage('library')}}/>:page==='library'&&project?<Library project={project} onBack={()=>setPage('projects')} onEdit={v=>{setVideo(v);setPage('editor')}}/>:page==='editor'&&project?<Editor project={project} video={video} onDone={()=>setPage('library')}/>:page==='calendar'?<Calendar/>:page==='accounts'?<Accounts/>:<div className="glass rounded-2xl p-10"><h1 className="text-2xl font-bold">{page}</h1><p className="mt-2 text-white/45">Módulo em desenvolvimento.</p></div>;
 return <Layout active={page} onNav={nav} onLogout={logout}>{content}</Layout>
}
