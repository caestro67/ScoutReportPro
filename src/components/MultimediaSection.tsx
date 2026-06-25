import React, { useState } from 'react';
import { Video, Link as LinkIcon, Trash2, Plus } from 'lucide-react';

interface VideoObj {
  id: string;
  url: string;
  title: string;
}

interface MultimediaSectionProps {
  videos: VideoObj[];
  onChange: (videos: VideoObj[]) => void;
}

export function MultimediaSection({ videos, onChange }: MultimediaSectionProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const v: VideoObj = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      url: newUrl.trim()
    };
    onChange([...videos, v]);
    setNewTitle('');
    setNewUrl('');
  };

  const handleDelete = (id: string) => {
    onChange(videos.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
           <Plus size={18} className="text-emerald-500" />
           Añadir Enlace a Video Web
        </h3>
        
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Título</label>
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Ej. Mejores jugadas..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 text-slate-200"
                    />
                </div>
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">URL del Video (YouTube, etc.)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LinkIcon size={14} className="text-slate-500" />
                        </div>
                        <input
                            type="text"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 text-slate-200"
                        />
                    </div>
                </div>
            </div>
            <button
                type="button"
                onClick={handleAdd}
                disabled={!newTitle.trim() || !newUrl.trim()}
                className="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl disabled:opacity-50 hover:bg-emerald-400 transition-colors text-sm"
            >
                Añadir Enlace
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map(video => {
            const isYouTube = video.url.includes('youtube.com') || video.url.includes('youtu.be');
            let ytEmbedUrl = video.url;
            if (isYouTube) {
                try {
                    let videoId = '';
                    if (video.url.includes('youtu.be/')) {
                        videoId = video.url.split('youtu.be/')[1].split('?')[0];
                    } else if (video.url.includes('youtube.com/watch')) {
                        const urlParams = new URLSearchParams(new URL(video.url).search);
                        videoId = urlParams.get('v') || '';
                    }
                    if (videoId) {
                        ytEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
                    }
                } catch (e) {
                   // Ignore parsing errors
                }
            }

            return (
                <div key={video.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-slate-700 transition-colors">
                    <div className="aspect-video bg-slate-950 border-b border-slate-800 relative">
                        {isYouTube ? (
                            <iframe 
                                src={ytEmbedUrl} 
                                className="w-full h-full"
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <video src={video.url} controls className="w-full h-full object-cover">
                                Tu navegador no soporta el formato de video.
                            </video>
                        )}
                    </div>
                    <div className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Video size={16} className="text-emerald-500 shrink-0" />
                            <h4 className="font-bold text-slate-200 text-sm truncate">{video.title}</h4>
                        </div>
                        <button 
                            type="button"
                            onClick={() => handleDelete(video.id)}
                            className="p-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-400 rounded-lg transition-colors shrink-0"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            )
        })}
        {videos.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500">
                <Video size={32} className="mb-3 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-wider">No hay videos añadidos</p>
            </div>
        )}
      </div>
    </div>
  );
}
