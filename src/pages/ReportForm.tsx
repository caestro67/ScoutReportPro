import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../components/AuthProvider";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Report } from "../types";
import { useTranslation } from "react-i18next";
import { Save, ArrowLeft, Star, Crosshair, Upload } from "lucide-react";
import { RatingBar } from "../components/RatingBar";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { InjuryHistoryTable } from "../components/InjuryHistoryTable";
import { MultimediaSection } from "../components/MultimediaSection";

import {
  PerformanceCriteria,
  getPerformanceCriteriaForPosition,
} from "../lib/positionCriteria";

export function ReportForm() {
  const { user, config } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [report, setReport] = useState<Partial<Report>>(() => {
    const initialData = location.state?.initialData;
    if (initialData && !id) {
      return {
        ...initialData,
        id: undefined, // ensure we don't accidentally save with the old id
        reportDate: new Date().toISOString().split("T")[0],
        performance: initialData.performance || {},
        injuries: initialData.injuries || {},
        psychological: initialData.psychological || {},
      };
    }
    return {
      playerName: "",
      reportDate: new Date().toISOString().split("T")[0],
      performance: {},
      injuries: {},
      psychological: {},
    };
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "performance" | "injuries" | "psychological" | "multimedia"
  >("performance");
  const initializedDefaultsRef = useRef(false);

  useEffect(() => {
    if (id || !config || initializedDefaultsRef.current) return;

    const initialPsychological: Record<
      string,
      { name: string; value: string }
    > = {};

    config.categories.psychological.criteria.forEach((crit) => {
      initialPsychological[crit.id] = { name: crit.name, value: "5" };
    });

    setReport((prev) => ({
      ...prev,
      psychological: { ...initialPsychological, ...prev.psychological },
    }));

    initializedDefaultsRef.current = true;
  }, [id, config]);

  useEffect(() => {
    if (!report.position) return;
    const currentPerformance = report.performance || {};
    const newPerformance: Record<string, { name: string; value: string }> = {
      ...currentPerformance,
    };
    const criteria = getPerformanceCriteriaForPosition(report.position, config);

    let changed = false;
    criteria.forEach((crit) => {
      if (!newPerformance[crit.id]) {
        newPerformance[crit.id] = { name: crit.name, value: "5" };
        changed = true;
      }
    });

    if (changed) {
      setReport((prev) => ({ ...prev, performance: newPerformance }));
    }
  }, [report.position]);

  useEffect(() => {
    if (!user || !id) return;

    // Fetch if editing
    const fetchReport = async () => {
      try {
        const ref = doc(db, `users/${user.uid}/reports/${id}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setReport(snap.data() as Report);
        }
      } catch (e) {
        handleFirestoreError(
          e,
          OperationType.GET,
          `users/${user.uid}/reports/${id}`,
        );
      }
    };
    fetchReport();
  }, [id, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !config) return;

    setSaving(true);
    try {
      const isNew = !id;
      const reportId = id || crypto.randomUUID();
      const reportRef = doc(db, `users/${user.uid}/reports/${reportId}`);

      const payload: Report = {
        id: reportId,
        userId: user.uid,
        playerName: report.playerName || "",
        age: report.age || "",
        nationality: report.nationality || "",
        club: report.club || "",
        league: report.league || "",
        height: report.height || "",
        position: report.position || "",
        foot: report.foot || "",
        value: report.value || "",
        favorite: report.favorite || false,
        scoutNotes: report.scoutNotes || "",
        reportDate: report.reportDate || "",
        imageUrl: report.imageUrl || "",
        performance: report.performance || {},
        injuries: report.injuries || {},
        psychological: report.psychological || {},
        injuryHistory: report.injuryHistory || [],
        videos: report.videos || [],
        createdAt: isNew ? Date.now() : report.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(reportRef, payload);
      navigate("/reports");
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.CREATE,
        `users/${user.uid}/reports`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSectionChange = (
    section: "performance" | "injuries" | "psychological",
    criteriaId: string,
    name: string,
    value: string,
  ) => {
    setReport((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [criteriaId]: { name, value },
      },
    }));
  };

  if (!config) return null;

  const calculateOverallScore = () => {
    let total = 0;
    let count = 0;

    // Performance
    const perfCriteria = getPerformanceCriteriaForPosition(report.position, config);
    perfCriteria.forEach((crit) => {
      const val = Number(report.performance?.[crit.id]?.value || 5);
      if (!isNaN(val) && val > 0) {
        total += val;
        count += 1;
      }
    });

    // Psychological
    config.categories.psychological.criteria.forEach((crit) => {
      const val = Number(report.psychological?.[crit.id]?.value || 5);
      if (!isNaN(val) && val > 0) {
        total += val;
        count += 1;
      }
    });

    if (count === 0) return "0.0";
    return (total / count).toFixed(1);
  };

  const calculateSectionScore = (section: "performance" | "psychological") => {
    let total = 0;
    let count = 0;

    if (section === "performance") {
      const perfCriteria = getPerformanceCriteriaForPosition(report.position, config);
      perfCriteria.forEach((crit) => {
        const val = Number(report.performance?.[crit.id]?.value || 5);
        if (!isNaN(val) && val > 0) {
          total += val;
          count += 1;
        }
      });
    } else {
      config.categories.psychological.criteria.forEach((crit) => {
        const val = Number(report.psychological?.[crit.id]?.value || 5);
        if (!isNaN(val) && val > 0) {
          total += val;
          count += 1;
        }
      });
    }

    if (count === 0) return "0.0";
    return (total / count).toFixed(1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setReport((prev) => ({ ...prev, imageUrl: dataUrl }));
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSave} className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/reports")}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-200 tracking-tight uppercase">
          {id ? t("edit") : t("newReport")}
        </h1>

        <button
          type="submit"
          disabled={saving}
          className="ml-auto flex items-center gap-2 bg-emerald-500 text-slate-950 px-5 py-2 rounded-xl font-bold hover:bg-emerald-600 transition disabled:opacity-50 text-sm uppercase tracking-wide"
        >
          <Save size={18} />
          {saving ? "Saving..." : t("save")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start w-full">
        {/* Left Column: Player Info */}
        <div className="md:col-span-4 flex flex-col gap-6 min-w-0 w-full">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Información del Jugador
              </h2>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t("playerName")}
              </label>
              <input
                type="text"
                required
                value={report.playerName}
                onChange={(e) =>
                  setReport((prev) => ({ ...prev, playerName: e.target.value }))
                }
                className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t("age")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={report.age || ""}
                  onChange={(e) =>
                    setReport((prev) => ({ ...prev, age: e.target.value }))
                  }
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t("nationality")}
                </label>
                <input
                  type="text"
                  value={report.nationality || ""}
                  onChange={(e) =>
                    setReport((prev) => ({
                      ...prev,
                      nationality: e.target.value,
                    }))
                  }
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t("club")}
                </label>
                <input
                  type="text"
                  value={report.club || ""}
                  onChange={(e) =>
                    setReport((prev) => ({ ...prev, club: e.target.value }))
                  }
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Liga
                </label>
                <input
                  type="text"
                  value={report.league || ""}
                  onChange={(e) =>
                    setReport((prev) => ({ ...prev, league: e.target.value }))
                  }
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t("height")}
                </label>
                <input
                  type="text"
                  value={report.height || ""}
                  onChange={(e) =>
                    setReport((prev) => ({ ...prev, height: e.target.value }))
                  }
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t("position")}
              </label>
              <select
                value={report.position || ""}
                onChange={(e) =>
                  setReport((prev) => ({ ...prev, position: e.target.value }))
                }
                className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
              >
                <option value="">Seleccione...</option>
                <option value="Portero">Portero</option>
                <option value="Central">Central</option>
                <option value="Lateral">Lateral</option>
                <option value="Mediocentro">Mediocentro</option>
                <option value="Mediapunta">Mediapunta</option>
                <option value="Extremo">Extremo</option>
                <option value="Delantero">Delantero</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t("foot")}
                </label>
                <select
                  value={report.foot || ""}
                  onChange={(e) =>
                    setReport((prev) => ({ ...prev, foot: e.target.value }))
                  }
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
                >
                  <option value="">Seleccione...</option>
                  <option value="Izquierda">Izquierda</option>
                  <option value="Derecha">Derecha</option>
                  <option value="Ambidiestro">Ambidiestro</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t("value")}
                </label>
                <input
                  type="text"
                  value={report.value || ""}
                  onChange={(e) =>
                    setReport((prev) => ({ ...prev, value: e.target.value }))
                  }
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Foto del Jugador
              </label>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <input
                  type="text"
                  value={report.imageUrl || ""}
                  onChange={(e) =>
                    setReport((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                  placeholder="URL de la imagen..."
                  className="block flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors"
                />
                <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">
                  O
                </span>
                <label className="cursor-pointer flex items-center justify-center gap-2 h-11 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-colors border border-slate-700 hover:border-slate-600">
                  <Upload size={18} />
                  Subir Foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Fecha del Informe
              </label>
              <input
                type="date"
                required
                value={report.reportDate}
                onChange={(e) =>
                  setReport((prev) => ({ ...prev, reportDate: e.target.value }))
                }
                className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors [color-scheme:dark]"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t("scoutNotes")}
              </label>
              <textarea
                value={report.scoutNotes || ""}
                onChange={(e) =>
                  setReport((prev) => ({ ...prev, scoutNotes: e.target.value }))
                }
                rows={4}
                className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 transition-colors resize-none"
              />
            </div>
          </div>

          {/* General Score Card */}
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-4 overflow-hidden border-2 border-slate-800">
              {report.imageUrl ? (
                <img
                  src={report.imageUrl}
                  alt={report.playerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Crosshair size={32} className="text-slate-950" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-slate-200">
              {report.playerName || "Nombre del Jugador"}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {report.position || "Posición"}
            </p>

            <div className="mt-8 w-full border border-emerald-500/30 rounded-2xl p-6 bg-emerald-950/30 mb-4">
              <div className="text-6xl font-black text-emerald-400 tracking-tighter">
                {calculateOverallScore()}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">
                Puntuación General
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950 flex flex-col items-center">
                <div className="text-2xl font-black text-slate-200">
                  {calculateSectionScore("performance")}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 mt-1">
                  {t("performance")}
                </div>
              </div>
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950 flex flex-col items-center">
                <div className="text-2xl font-black text-slate-200">
                  {calculateSectionScore("psychological")}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 mt-1">
                  {t("psychological")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Attributes */}
        <div className="md:col-span-8 flex flex-col gap-6 min-w-0 w-full">
          <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1 overflow-x-auto hide-scrollbar w-full">
            {(
              [
                "performance",
                "psychological",
                "injuries",
                "multimedia",
              ] as const
            ).map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveTab(section as any)}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === section ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
              >
                {section === "multimedia" ? "Multimedia" : t(section)}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-sm min-h-[500px] w-full min-w-0">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                {t(activeTab)}
              </h2>
            </div>

            <div className="w-full">
              {activeTab === "injuries" ? (
                <InjuryHistoryTable
                  injuries={report.injuryHistory || []}
                  onChange={(acts) =>
                    setReport((prev) => ({ ...prev, injuryHistory: acts }))
                  }
                />
              ) : activeTab === "multimedia" ? (
                <MultimediaSection
                  videos={report.videos || []}
                  onChange={(videos) =>
                    setReport((prev) => ({ ...prev, videos }))
                  }
                />
              ) : activeTab === "performance" ? (
                (() => {
                  const criteria = getPerformanceCriteriaForPosition(
                    report.position,
                    config
                  );
                  if (criteria.length === 0) {
                    return (
                      <p className="text-sm text-slate-400 italic bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                        Seleccione una posición del jugador para ver los
                        atributos de rendimiento correspondientes.
                      </p>
                    );
                  }

                  const grouped: Record<string, PerformanceCriteria[]> = {
                    Físicos: [],
                    Creativos: [],
                    Mentales: [],
                  };
                  criteria.forEach((c) => {
                    if (!grouped[c.category]) grouped[c.category] = [];
                    grouped[c.category].push(c);
                  });

                  return (
                    <div className="space-y-8">
                      {Object.entries(grouped).map(([groupName, items]) => {
                        if (items.length === 0) return null;
                        return (
                          <div key={groupName} className="space-y-4">
                            {groupName && (
                              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest pl-2">
                                {groupName}
                              </h3>
                            )}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {items.map((crit) => (
                                <div
                                  key={crit.id}
                                  className="bg-slate-950 p-4 border border-slate-800 rounded-2xl flex flex-col gap-2 transition-colors hover:border-emerald-500/30 w-full min-w-0"
                                >
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1">
                                    <label className="text-sm font-bold text-slate-300 break-words line-clamp-2">
                                      {crit.name}
                                    </label>
                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md text-xs self-start sm:self-auto shrink-0">
                                      {report.performance?.[crit.id]?.value ||
                                        "5"}
                                      /10
                                    </span>
                                  </div>
                                  <RatingBar
                                    value={Number(
                                      report.performance?.[crit.id]?.value ||
                                        "5",
                                    )}
                                    onChange={(v) =>
                                      handleSectionChange(
                                        "performance",
                                        crit.id,
                                        crit.name,
                                        v.toString(),
                                      )
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const criteria =
                    config.categories[activeTab as "psychological"].criteria;
                  if (criteria.length === 0) {
                    return (
                      <p className="text-xs text-slate-500 italic">
                        No criteria defined. Go to Settings to add criteria.
                      </p>
                    );
                  }

                  const grouped: Record<string, typeof criteria> = { "": [] };
                  criteria.forEach((c) => {
                    const g = c.group || "";
                    if (!grouped[g]) grouped[g] = [];
                    grouped[g].push(c);
                  });

                  return (
                    <div className="space-y-8">
                      {Object.entries(grouped).map(([groupName, items]) => {
                        if (items.length === 0) return null;
                        return (
                          <div key={groupName} className="space-y-2">
                            {groupName && (
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-3 ml-2">
                                {groupName}
                              </h3>
                            )}
                            <div className="flex flex-col gap-2">
                              {items.map((crit) => {
                                const currentVal =
                                  report[activeTab]?.[crit.id]?.value || "";
                                const numVal =
                                  parseInt(String(currentVal)) || 0;
                                return (
                                  <div
                                    key={crit.id}
                                    className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/50 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors hover:border-slate-700 w-full min-w-0"
                                  >
                                    <div className="flex items-start xl:items-center gap-3 min-w-0">
                                      <Star
                                        size={14}
                                        className="text-slate-600 mt-1 xl:mt-0 shrink-0"
                                      />
                                      <label className="text-sm font-bold text-slate-200 break-words line-clamp-2">
                                        {crit.name}
                                      </label>
                                    </div>
                                    <RatingBar
                                      value={numVal}
                                      onChange={(v) =>
                                        handleSectionChange(
                                          activeTab,
                                          crit.id,
                                          crit.name,
                                          String(v),
                                        )
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {activeTab === "performance" &&
              getPerformanceCriteriaForPosition(report.position, config).length > 0 && (
                <div className="mt-8 border-t border-slate-800 pt-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-6 text-center">
                    Gráfico de Rendimiento
                  </h3>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="65%"
                        data={getPerformanceCriteriaForPosition(
                          report.position,
                          config
                        ).map((crit) => ({
                          subject: crit.name,
                          A: Number(report.performance?.[crit.id]?.value) || 0,
                          fullMark: 10,
                        }))}
                      >
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "#94a3b8", fontSize: 10 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 10]}
                          fill="#1e293b"
                          tick={false}
                          axisLine={false}
                        />
                        <Radar
                          name="Jugador"
                          dataKey="A"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            {activeTab === "psychological" &&
              config.categories.psychological.criteria.length > 0 && (
                <div className="mt-8 border-t border-slate-800 pt-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-6 text-center">
                    Gráfico Psicológico
                  </h3>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="65%"
                        data={config.categories.psychological.criteria.map(
                          (crit) => ({
                            subject: crit.name,
                            A:
                              Number(report.psychological?.[crit.id]?.value) ||
                              0,
                            fullMark: 10,
                          }),
                        )}
                      >
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "#94a3b8", fontSize: 10 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 10]}
                          fill="#1e293b"
                          tick={false}
                          axisLine={false}
                        />
                        <Radar
                          name="Jugador"
                          dataKey="A"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </form>
  );
}
