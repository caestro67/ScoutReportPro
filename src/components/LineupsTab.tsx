import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Lineup, Report } from "../types";
import { PlusCircle, Trash2, Pencil, Users, Save, Download, Image as ImageIcon, FileText } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export function LineupsTab({ reports }: { reports: Report[] }) {
  const { user } = useAuth();
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLineupId, setActiveLineupId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formFormation, setFormFormation] = useState("4-3-3");
  const [editingLineupId, setEditingLineupId] = useState<string | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);

  
  // Extract unique player names
  const allPlayerNames = Array.from(
    new Set(reports.map((r) => r.playerName).filter(Boolean))
  ).sort();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/lineups`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Lineup);
        data.sort((a, b) => b.createdAt - a.createdAt);
        setLineups(data);
        if (data.length > 0 && !activeLineupId) {
          setActiveLineupId(data[0].id);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/lineups`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const activeLineup = lineups.find(l => l.id === activeLineupId) || lineups[0];

  const exportAsPNG = async () => {
    if (!pitchRef.current) return;
    try {
      const dataUrl = await toPng(pitchRef.current, {
        quality: 1,
        pixelRatio: 2,
        filter: (node) => {
          if (node.nodeType === 1) { // ELEMENT_NODE
            return !(node as HTMLElement).classList.contains("hide-on-export");
          }
          return true;
        }
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `lineup-${activeLineup?.name || "tactics"}.png`;
      a.click();
    } catch (err) {
      console.error("Error exporting to PNG:", err);
    }
  };

  const exportAsPDF = async () => {
    if (!pitchRef.current) return;
    try {
      const { width, height } = pitchRef.current.getBoundingClientRect();
      const pixelRatio = 2;
      const dataUrl = await toPng(pitchRef.current, {
        quality: 1,
        pixelRatio,
        filter: (node) => {
          if (node.nodeType === 1) { // ELEMENT_NODE
            return !(node as HTMLElement).classList.contains("hide-on-export");
          }
          return true;
        }
      });
      
      const pdfWidth = width * pixelRatio;
      const pdfHeight = height * pixelRatio;
      
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
        unit: "px",
        format: [pdfWidth, pdfHeight]
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`lineup-${activeLineup?.name || "tactics"}.pdf`);
    } catch (err) {
      console.error("Error exporting to PDF:", err);
    }
  };

  const handleSaveLineup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingLineupId) {
        await updateDoc(doc(db, `users/${user.uid}/lineups/${editingLineupId}`), {
          name: formName.trim(),
          formation: formFormation,
        });
      } else {
        await addDoc(collection(db, `users/${user.uid}/lineups`), {
          name: formName.trim(),
          formation: formFormation,
          players: {},
          createdAt: Date.now()
        });
      }
      setIsModalOpen(false);
      setFormName("");
    } catch (error) {
       handleFirestoreError(error, editingLineupId ? OperationType.UPDATE : OperationType.CREATE, `users/${user.uid}/lineups`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/lineups/${id}`));
      if (activeLineupId === id) setActiveLineupId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/lineups/${id}`);
    }
  };

  const addPlayerToPosition = async (positionId: string, playerName: string) => {
    if (!user || !activeLineup) return;
    
    const currentPlayers = Array.isArray(activeLineup.players?.[positionId]) 
      ? activeLineup.players[positionId] 
      : (activeLineup.players?.[positionId] ? [activeLineup.players[positionId] as string] : []);
      
    if (currentPlayers.includes(playerName)) return;

    const updatedPlayers = { 
      ...activeLineup.players,
      [positionId]: [...currentPlayers, playerName]
    };
    
    try {
      await updateDoc(doc(db, `users/${user.uid}/lineups/${activeLineup.id}`), {
        players: updatedPlayers
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/lineups/${activeLineup.id}`);
    }
  };

  const removePlayerFromPosition = async (positionId: string, playerName: string) => {
    if (!user || !activeLineup) return;
    
    const currentPlayers = Array.isArray(activeLineup.players?.[positionId]) 
      ? activeLineup.players[positionId] 
      : (activeLineup.players?.[positionId] ? [activeLineup.players[positionId] as string] : []);
      
    const newPlayersArray = currentPlayers.filter((p: string) => p !== playerName);
    const updatedPlayers = { ...activeLineup.players };
    
    if (newPlayersArray.length > 0) {
      updatedPlayers[positionId] = newPlayersArray;
    } else {
      delete updatedPlayers[positionId];
    }
    
    try {
      await updateDoc(doc(db, `users/${user.uid}/lineups/${activeLineup.id}`), {
        players: updatedPlayers
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/lineups/${activeLineup.id}`);
    }
  };

  const getFormationLayout = (formationStr: string) => {
    // Basic positions array defining rows and slots
    switch(formationStr) {
      case "4-3-3":
        return [
          [{ id: "fw1", label: "LW" }, { id: "fw2", label: "ST" }, { id: "fw3", label: "RW" }],
          [{ id: "mid1", label: "CM" }, { id: "mid2", label: "CDM" }, { id: "mid3", label: "CM" }],
          [{ id: "def1", label: "LB" }, { id: "def2", label: "CB" }, { id: "def3", label: "CB" }, { id: "def4", label: "RB" }],
          [{ id: "gk", label: "GK" }]
        ];
      case "4-4-2":
        return [
          [{ id: "fw1", label: "ST" }, { id: "fw2", label: "ST" }],
          [{ id: "mid1", label: "LM" }, { id: "mid2", label: "CM" }, { id: "mid3", label: "CM" }, { id: "mid4", label: "RM" }],
          [{ id: "def1", label: "LB" }, { id: "def2", label: "CB" }, { id: "def3", label: "CB" }, { id: "def4", label: "RB" }],
          [{ id: "gk", label: "GK" }]
        ];
      case "3-5-2":
        return [
          [{ id: "fw1", label: "ST" }, { id: "fw2", label: "ST" }],
          [{ id: "mid1", label: "LWB" }, { id: "mid2", label: "CM" }, { id: "mid3", label: "CDM" }, { id: "mid4", label: "CM" }, { id: "mid5", label: "RWB" }],
          [{ id: "def1", label: "CB" }, { id: "def2", label: "CB" }, { id: "def3", label: "CB" }],
          [{ id: "gk", label: "GK" }]
        ];
      case "4-2-3-1":
        return [
          [{ id: "fw1", label: "ST" }],
          [{ id: "am1", label: "LAM" }, { id: "am2", label: "CAM" }, { id: "am3", label: "RAM" }],
          [{ id: "dm1", label: "CDM" }, { id: "dm2", label: "CDM" }],
          [{ id: "def1", label: "LB" }, { id: "def2", label: "CB" }, { id: "def3", label: "CB" }, { id: "def4", label: "RB" }],
          [{ id: "gk", label: "GK" }]
        ];
      default:
        return [[{ id: "gk", label: "GK" }]];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {lineups.length === 0 ? (
            <div className="text-sm font-medium text-slate-500 py-1.5 px-4 w-full">Sin onces creados</div>
          ) : (
            lineups.map(l => (
              <div
                key={l.id}
                className={`flex items-center min-w-max rounded-lg transition-colors ${activeLineupId === l.id ? 'bg-emerald-500/10 border border-emerald-500/20' : 'border border-transparent'}`}
              >
                <button
                  onClick={() => setActiveLineupId(l.id)}
                  className={`px-4 py-1.5 text-sm font-bold transition-colors ${activeLineupId === l.id ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {l.name}
                  <span className="ml-2 text-[10px] text-slate-500 font-normal">({l.formation})</span>
                </button>
                {activeLineupId === l.id && (
                  <div className="flex bg-emerald-500/10">
                    <button
                      onClick={() => {
                        setEditingLineupId(l.id);
                        setFormName(l.name);
                        setFormFormation(l.formation);
                        setIsModalOpen(true);
                      }}
                      className="p-1 px-1.5 text-emerald-500 hover:bg-emerald-500/30 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(l.id)}
                      className="p-1 px-1.5 text-red-500 hover:bg-red-500/20 transition-colors rounded-r-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeLineupId && (
            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={exportAsPNG}
                title="Exportar a PNG"
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <ImageIcon size={18} />
              </button>
              <button
                onClick={exportAsPDF}
                title="Exportar a PDF"
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <FileText size={18} />
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setEditingLineupId(null);
              setFormName("");
              setFormFormation("4-3-3");
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl font-bold hover:bg-emerald-600 transition text-sm whitespace-nowrap"
          >
            <PlusCircle size={16} />
            Crear Once
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-slate-900 rounded-3xl rounded-xl"></div>
        </div>
      ) : activeLineup ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Pitch UI */}
          <div className="lg:col-span-3">
             <div ref={pitchRef} className="relative w-full aspect-[3/4] sm:aspect-[16/9] lg:aspect-[4/3] min-h-[400px] bg-emerald-800 rounded-[20px] overflow-hidden border-4 border-slate-900 shadow-xl p-4 sm:p-8 flex flex-col justify-between"
                  style={{
                    backgroundColor: "#065f46",
                    borderColor: "#0f172a"
                  }}
             >
                {/* Horizontal Pitch Stripes */}
                <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex-1 w-full" style={{ backgroundColor: i % 2 === 1 ? 'rgba(255,255,255,0.06)' : 'transparent' }} />
                  ))}
                </div>

                {/* Field markings */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/30 transform -translate-y-1/2" style={{ backgroundColor: "rgba(255,255,255,0.3)" }}></div>
                <div className="absolute top-1/2 left-1/2 w-32 h-32 border-4 border-white/30 rounded-full transform -translate-y-1/2 -translate-x-1/2" style={{ borderColor: "rgba(255,255,255,0.3)" }}></div>
                {/* Penalty boxes */}
                <div className="absolute top-[-10px] left-1/2 w-64 h-32 border-4 border-white/30 transform -translate-x-1/2" style={{ borderColor: "rgba(255,255,255,0.3)" }}></div>
                <div className="absolute bottom-[-10px] left-1/2 w-64 h-32 border-4 border-white/30 transform -translate-x-1/2" style={{ borderColor: "rgba(255,255,255,0.3)" }}></div>

                <div className="relative z-10 w-full h-full flex flex-col justify-between">
                  {getFormationLayout(activeLineup.formation).map((row, rdx) => (
                    <div key={rdx} className="flex justify-around items-center w-full">
                      {row.map(pos => {
                        const currentPlayersObj = activeLineup.players?.[pos.id];
                        const currentPlayers: string[] = Array.isArray(currentPlayersObj) 
                          ? currentPlayersObj 
                          : (currentPlayersObj ? [currentPlayersObj as string] : []);
                          
                        return (
                          <div key={pos.id} className="flex flex-col items-center gap-1 z-20">
                            <div className="flex flex-col gap-1 items-center">
                                {currentPlayers.map(p => (
                                <div key={p} className="flex items-center gap-1 text-xs sm:text-sm font-bold max-w-24 sm:max-w-32">
                                  <span className="truncate text-white drop-shadow-md" style={{ whiteSpace: "nowrap", textShadow: "0px 1px 3px rgba(0,0,0,0.8)" }}>{p}</span>
                                  <button onClick={() => removePlayerFromPosition(pos.id, p)} className="focus:outline-none hide-on-export text-red-500 hover:text-red-400">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) addPlayerToPosition(pos.id, e.target.value);
                              }}
                              className="appearance-none cursor-pointer border border-emerald-500/50 bg-slate-900/80 shadow-md text-[10px] sm:text-xs font-bold text-emerald-400 text-center rounded-md px-2 py-1 max-w-24 sm:max-w-32 truncate focus:outline-none focus:ring-1 focus:ring-emerald-400 hide-on-export"
                              style={{ backgroundColor: "rgba(15, 23, 42, 0.8)", borderColor: "rgba(16, 185, 129, 0.5)", color: "#34d399", WebkitAppearance: "none", MozAppearance: "none" }}
                            >
                              <option value="">+ {pos.label}</option>
                              {allPlayerNames.filter(name => !currentPlayers.includes(name)).map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
             </div>
          </div>
          <div className="lg:col-span-1 border border-slate-800 bg-slate-900 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Users size={18} className="text-emerald-500" />
                Jugadores de la plantilla
              </h3>
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {allPlayerNames.length === 0 ? (
                   <p className="text-sm text-slate-500">No hay reportes de jugadores.</p>
                ) : (
                  allPlayerNames.map(name => {
                    const allRosteredPlayers = Object.values(activeLineup.players || {}).flatMap(p => Array.isArray(p) ? p : [p]);
                    const isInLineup = allRosteredPlayers.includes(name);
                    return (
                      <div key={name} className={`px-3 py-2 rounded-lg text-sm transition-colors ${isInLineup ? 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                         {name}
                      </div>
                    )
                  })
                )}
              </div>
          </div>
        </div>
      ) : (
         <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800 shadow-sm">
            <Users className="mx-auto h-12 w-12 text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">No tienes onces tácticos</h3>
            <p className="mt-1 text-sm text-slate-400 mb-4">Crea una alineación con los jugadores que has analizado.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-slate-800 text-slate-200 px-4 py-2 rounded-xl font-bold hover:bg-slate-700 transition text-sm"
            >
              <PlusCircle size={16} /> Crear Once
            </button>
         </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-200 mb-6">{editingLineupId ? "Editar Once" : "Crear Nuevo Once"}</h3>
            <form onSubmit={handleSaveLineup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nombre del Once
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 text-slate-200"
                  placeholder="Ej: Plantilla titular, Equipo A..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Formación
                </label>
                <select
                  required
                  value={formFormation}
                  onChange={(e) => setFormFormation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 text-slate-200"
                >
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-4-2">4-4-2</option>
                  <option value="3-5-2">3-5-2</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors text-sm"
                >Cancelar</button>
                <button
                  type="submit"
                  disabled={!formName.trim()}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 hover:bg-emerald-600 font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
                >Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
