import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Plus, Trash2, Globe } from 'lucide-react';
import { UserConfig, SectionConfig, Criterion } from '../types';
import { getPerformanceCriteriaForPosition } from '../lib/positionCriteria';

export function Settings() {
  const { config, updateConfig } = useAuth();
  const { t } = useTranslation();
  const [localConfig, setLocalConfig] = useState<UserConfig | null>(config);
  const [selectedPosition, setSelectedPosition] = useState("Portero");

  const posOptions = [
    "Portero", "Central", "Lateral", "Mediocentro", "Mediapunta", "Extremo", "Delantero"
  ];

  const handleAddPosCriteria = () => {
    if (!localConfig) return;
    const current = getDisplayCriteria();
    const newCriteria: Criterion = { id: Date.now().toString(), name: 'Nuevo Criterio' };
    
    const updated = {
      ...localConfig,
      performanceByPosition: {
        ...localConfig.performanceByPosition,
        [selectedPosition]: {
          criteria: [...current, newCriteria]
        }
      }
    };
    setLocalConfig(updated);
    updateConfig(updated);
  };

  const handleRemovePosCriteria = (id: string) => {
    if (!localConfig) return;
    const current = getDisplayCriteria();
    const updated = {
      ...localConfig,
      performanceByPosition: {
        ...localConfig.performanceByPosition,
        [selectedPosition]: {
          criteria: current.filter(c => c.id !== id)
        }
      }
    };
    setLocalConfig(updated);
    updateConfig(updated);
  };

  const handleNamePosChange = (id: string, newName: string) => {
    if (!localConfig) return;
    const current = getDisplayCriteria();
    const updated = {
      ...localConfig,
      performanceByPosition: {
        ...localConfig.performanceByPosition,
        [selectedPosition]: {
          criteria: current.map(c => 
            c.id === id ? { ...c, name: newName } : c
          )
        }
      }
    };
    setLocalConfig(updated);
  };

  const getDisplayCriteria = () => {
    if (localConfig?.performanceByPosition?.[selectedPosition]) {
      return localConfig.performanceByPosition[selectedPosition].criteria;
    }
    const defaults = getPerformanceCriteriaForPosition(selectedPosition, null);
    return defaults.map((d) => ({ id: d.id, name: d.name, group: d.category }));
  };

  const currentPosCriteria = getDisplayCriteria();

  const handleAddCriteria = (section: keyof UserConfig['categories']) => {
    if (!localConfig) return;
    const newCriteria: Criterion = { id: Date.now().toString(), name: 'Nuevo Criterio' };
    
    const updated = {
      ...localConfig,
      categories: {
        ...localConfig.categories,
        [section]: {
          ...localConfig.categories[section],
          criteria: [...localConfig.categories[section].criteria, newCriteria]
        }
      }
    };
    setLocalConfig(updated);
    updateConfig(updated);
  };

  const handleRemoveCriteria = (section: keyof UserConfig['categories'], id: string) => {
    if (!localConfig) return;
    const updated = {
      ...localConfig,
      categories: {
        ...localConfig.categories,
        [section]: {
          ...localConfig.categories[section],
          criteria: localConfig.categories[section].criteria.filter(c => c.id !== id)
        }
      }
    };
    setLocalConfig(updated);
    updateConfig(updated);
  };

  const handleNameChange = (section: keyof UserConfig['categories'], id: string, newName: string) => {
    if (!localConfig) return;
    const updated = {
      ...localConfig,
      categories: {
        ...localConfig.categories,
        [section]: {
          ...localConfig.categories[section],
          criteria: localConfig.categories[section].criteria.map(c => 
            c.id === id ? { ...c, name: newName } : c
          )
        }
      }
    };
    setLocalConfig(updated);
  };

  const handleResetToDefaults = () => {
    if (!localConfig) return;
    const defaultConfig = {
      ...localConfig,
      performanceByPosition: {},
      categories: {
        performance: { 
          criteria: [
            { id: 'p1', name: 'Pase Corto', group: 'Técnica' }, 
            { id: 'p2', name: 'Pase Largo', group: 'Técnica' },
            { id: 'p3', name: 'Regate', group: 'Técnica' },
            { id: 'p4', name: 'Control de Balón', group: 'Técnica' },
            { id: 'p5', name: 'Visión', group: 'Creatividad' },
            { id: 'p6', name: 'Asistencias', group: 'Creatividad' },
            { id: 'p7', name: 'Último pase', group: 'Creatividad' },
            { id: 'p8', name: 'Inicio de Jugada', group: 'Creatividad' },
            { id: 'p9', name: 'Resistencia', group: 'Físico' },
            { id: 'p10', name: 'Velocidad', group: 'Físico' },
            { id: 'p11', name: 'Lucha', group: 'Físico' },
            { id: 'p12', name: 'Fuerza', group: 'Físico' },
            { id: 'p13', name: 'Posicionamiento', group: 'Mental' },
            { id: 'p14', name: 'Lectura de Juego', group: 'Mental' },
            { id: 'p15', name: 'Volumen de trabajo', group: 'Mental' },
            { id: 'p16', name: 'Enfoque', group: 'Mental' },
          ] 
        },
        injuries: { criteria: [{ id: 'i1', name: 'Frecuencia de lesiones' }, { id: 'i2', name: 'Condición General' }] },
        psychological: { 
          criteria: [
            { id: 'ps1', name: 'Resiliencia al error', group: 'Robustez Mental y Gestión de Crisis' }, 
            { id: 'ps2', name: 'Gestión del Estrés', group: 'Robustez Mental y Gestión de Crisis' },
            { id: 'ps3', name: 'Aceptación de la suplencia/rotación', group: 'Robustez Mental y Gestión de Crisis' },
            { id: 'ps4', name: 'Velocidad de procesamiento', group: 'Cognición y Toma de Decisiones de Élite' },
            { id: 'ps5', name: 'Atención selectiva', group: 'Cognición y Toma de Decisiones de Élite' },
            { id: 'ps6', name: 'Flexibilidad cognitiva', group: 'Cognición y Toma de Decisiones de Élite' },
            { id: 'ps7', name: 'Comunicación asertiva', group: 'Liderazgo y Dinámica de Vestuario' },
            { id: 'ps8', name: 'Inteligencia emocional', group: 'Liderazgo y Dinámica de Vestuario' },
            { id: 'ps9', name: 'Liderazgo situacional', group: 'Liderazgo y Dinámica de Vestuario' },
            { id: 'ps10', name: 'Mentalidad de crecimiento', group: 'Profesionalismo y Consistencia' },
            { id: 'ps11', name: 'Disciplina invisible', group: 'Profesionalismo y Consistencia' },
            { id: 'ps12', name: 'Cohesión grupal', group: 'Trabajo en Equipo y Comunicación' },
            { id: 'ps13', name: 'Comunicación efectiva', group: 'Trabajo en Equipo y Comunicación' },
          ] 
        },
      }
    };
    setLocalConfig(defaultConfig);
    updateConfig(defaultConfig);
  };

  // Debounced save
  const handleBlur = () => {
    if (localConfig) updateConfig(localConfig);
  };

  if (!localConfig) return null;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-200 tracking-tight uppercase">
          <SettingsIcon size={24} className="text-emerald-400" />
          {t('settings')}
        </h1>
        <p className="text-slate-400 mt-2 text-sm">Manage report criteria definitions.</p>
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm space-y-8">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t('customCriteria')}</h2>
          <button
            onClick={handleResetToDefaults}
            className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-wider"
          >
            Reset to Defaults
          </button>
        </div>
        
        <div className="mb-8 border-b border-slate-800 pb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-slate-300 capitalize flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>
                Rendimiento (Por Posición)
              </h3>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 transition-colors"
                title="Posición"
              >
                {posOptions.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleAddPosCriteria}
              className="text-xs font-bold flex items-center gap-1 text-emerald-400 hover:text-emerald-300 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors uppercase tracking-wider"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          
          <div className="space-y-3">
            {currentPosCriteria.map(crit => (
              <div key={crit.id} className="flex gap-2 items-center bg-slate-950/50 p-2 rounded-xl border border-slate-800/50">
                <input
                  type="text"
                  value={crit.name}
                  onChange={(e) => handleNamePosChange(crit.id, e.target.value)}
                  onBlur={handleBlur}
                  className="flex-1 min-w-0 block w-full px-3 py-2 bg-transparent border-transparent rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:bg-slate-900 transition-colors"
                />
                <button 
                  onClick={() => handleRemovePosCriteria(crit.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {currentPosCriteria.length === 0 && (
              <p className="text-sm text-slate-500 italic py-2">No criteria added yet.</p>
            )}
          </div>
        </div>

        {(['injuries', 'psychological'] as Array<keyof UserConfig['categories']>).map((section) => (
          <div key={section} className="mb-8 last:mb-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-300 capitalize flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>
                {t(section)}
              </h3>
              <button 
                onClick={() => handleAddCriteria(section)}
                className="text-xs font-bold flex items-center gap-1 text-emerald-400 hover:text-emerald-300 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors uppercase tracking-wider"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            
            <div className="space-y-3">
              {localConfig.categories[section].criteria.map(crit => (
                <div key={crit.id} className="flex gap-2 items-center bg-slate-950/50 p-2 rounded-xl border border-slate-800/50">
                  <input
                    type="text"
                    value={crit.name}
                    onChange={(e) => handleNameChange(section, crit.id, e.target.value)}
                    onBlur={handleBlur}
                    className="flex-1 min-w-0 block w-full px-3 py-2 bg-transparent border-transparent rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:bg-slate-900 transition-colors"
                  />
                  <button 
                    onClick={() => handleRemoveCriteria(section, crit.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {localConfig.categories[section].criteria.length === 0 && (
                <p className="text-sm text-slate-500 italic py-2">No criteria added yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
