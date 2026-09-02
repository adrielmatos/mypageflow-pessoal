import os, json, subprocess, tempfile, pathlib, sys
from supabase import create_client

URL=os.environ.get('SUPABASE_URL')
KEY=os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
if not URL or not KEY:
    raise SystemExit('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')

sb=create_client(URL,KEY)

def run_ffmpeg(src: str, dst: str):
    # V1: conversão padronizada 1080x1920. Preset avançado será lido do JSON do banco em seguida.
    cmd=['ffmpeg','-y','-i',src,'-vf','scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2','-c:v','libx264','-preset','veryfast','-crf','20','-c:a','aac','-b:a','128k',dst]
    subprocess.run(cmd,check=True,capture_output=True,text=True)

jobs=sb.table('processing_jobs').select('*, videos(*)').eq('status','pending').order('created_at').limit(10).execute().data
for job in jobs:
    jid=job['id']; video=job['videos']; vid=video['id']
    try:
        sb.table('processing_jobs').update({'status':'processing','started_at':'now()','progress':5}).eq('id',jid).execute()
        with tempfile.TemporaryDirectory() as td:
            src=pathlib.Path(td)/'input.mp4'; dst=pathlib.Path(td)/'output.mp4'
            data=sb.storage.from_('videos').download(video['storage_path'])
            src.write_bytes(data)
            sb.table('processing_jobs').update({'progress':25}).eq('id',jid).execute()
            run_ffmpeg(str(src),str(dst))
            out_path=f"{video['storage_path']}.render.mp4"
            sb.storage.from_('videos').upload(out_path,dst.read_bytes(),{'content-type':'video/mp4','upsert':True})
            sb.table('videos').update({'status':'ready','render_path':out_path}).eq('id',vid).execute()
            sb.table('processing_jobs').update({'status':'done','progress':100,'finished_at':'now()'}).eq('id',jid).execute()
    except Exception as exc:
        sb.table('videos').update({'status':'error','error_message':str(exc)[:1000]}).eq('id',vid).execute()
        sb.table('processing_jobs').update({'status':'error','progress':100,'logs':str(exc)[:4000]}).eq('id',jid).execute()
        print(f'Job {jid} error: {exc}')
