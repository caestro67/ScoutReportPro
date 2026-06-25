import React, { useState } from 'react';
import { Trash2, Calendar, Plus } from 'lucide-react';
import { InjuryRecord } from '../types';

interface Props {
  injuries: InjuryRecord[];
  onChange: (injuries: InjuryRecord[]) => void;
}

export function InjuryHistoryTable({ injuries, onChange }: Props) {
  const [newDate, setNewDate] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newType, setNewType] = useState('Otro');
  const [newDuration, setNewDuration] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const types = ['Muscular', 'Ligamento/Tendón', 'Óseo', 'Contusión', 'Enfermedad', 'Otro'];

  const handleAdd = () => {
    if (!newDate || !newRegion) return;
    const newRecord: InjuryRecord = {
      id: crypto.randomUUID(),
      date: newDate,
      region: newRegion,
      type: newType,
      duration: newDuration,
      description: newDesc
    };
    onChange([...injuries, newRecord]);
    setNewDate('');
    setNewRegion('');
    setNewType('Otro');
    setNewDuration('');
    setNewDesc('');
  };

  const handleDelete = (id: string) => {
    onChange(injuries.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto hide-scrollbar">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[120px_1fr_150px_120px_1fr_40px] gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-800">
            <div>Fecha</div>
            <div>Región</div>
            <div>Tipo</div>
            <div>Duración</div>
            <div>Descripción</div>
            <div></div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {injuries.length === 0 && (
              <p className="text-sm text-slate-500 italic py-4">No hay lesiones registradas.</p>
            )}
            {injuries.map(inj => (
              <div key={inj.id} className="grid grid-cols-[120px_1fr_150px_120px_1fr_40px] gap-4 items-center text-sm text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                <div>{inj.date}</div>
                <div className="font-medium text-slate-200">{inj.region}</div>
                <div>
              <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-lg border border-red-500/20">{inj.type}</span>
            </div>
            <div>{inj.duration ? `${inj.duration} Días` : '—'}</div>
            <div className="truncate">{inj.description || '—'}</div>
            <button
              type="button"
              onClick={() => handleDelete(inj.id)}
              className="text-slate-500 hover:text-red-400 transition-colors flex justify-center"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      </div>
      </div>

      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_120px_auto] gap-4 sm:items-end">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha</label>
            <div className="relative">
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-200 [color-scheme:dark]"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Región</label>
            <input
              type="text"
              placeholder="Ej: Rodilla Izquierda"
              value={newRegion}
              onChange={e => setNewRegion(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-200 placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-200"
            >
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duración (Días)</label>
            <input
              type="number"
              value={newDuration}
              onChange={e => setNewDuration(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-200"
            />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!newDate || !newRegion}
            className="h-10 px-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-sm hover:bg-emerald-500/20 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Añadir
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descripción / Nota</label>
          <input
            type="text"
            placeholder="Descripción breve..."
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-200 placeholder:text-slate-600"
          />
        </div>
      </div>
    </div>
  );
}
