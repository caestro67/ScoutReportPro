import React, { useState } from "react";
import { Report } from "../types";
import { User } from "lucide-react";

interface CompareTabProps {
  reports: Report[];
}

export function CompareTab({ reports }: CompareTabProps) {
  const [report1Id, setReport1Id] = useState<string>("");
  const [report2Id, setReport2Id] = useState<string>("");

  const report1 = reports.find((r) => r.id === report1Id);
  const report2 = reports.find((r) => r.id === report2Id);

  const renderComparisonRow = (
    label: string,
    val1: string | number | undefined,
    val2: string | number | undefined,
    isNumeric: boolean = false
  ) => {
    let highlight1 = false;
    let highlight2 = false;

    if (isNumeric && val1 !== undefined && val2 !== undefined) {
      const n1 = Number(val1);
      const n2 = Number(val2);
      if (!isNaN(n1) && !isNaN(n2)) {
        if (n1 > n2) highlight1 = true;
        if (n2 > n1) highlight2 = true;
      }
    }

    return (
      <div key={label} className="grid grid-cols-3 items-center py-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
        <div
          className={`text-center font-medium ${
            highlight1 ? "text-emerald-400" : "text-slate-300"
          }`}
        >
          {val1 !== undefined && val1 !== "" ? val1 : "-"}
        </div>
        <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </div>
        <div
          className={`text-center font-medium ${
            highlight2 ? "text-emerald-400" : "text-slate-300"
          }`}
        >
          {val2 !== undefined && val2 !== "" ? val2 : "-"}
        </div>
      </div>
    );
  };

  const getCombinedSectionKeys = (sectionKey: "performance" | "injuries" | "psychological") => {
    const keys = new Set<string>();
    if (report1 && report1[sectionKey]) {
      Object.keys(report1[sectionKey] || {}).forEach((k) => keys.add(k));
    }
    if (report2 && report2[sectionKey]) {
      Object.keys(report2[sectionKey] || {}).forEach((k) => keys.add(k));
    }
    return Array.from(keys);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selector 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Seleccionar Jugador 1
          </label>
          <select
            value={report1Id}
            onChange={(e) => setReport1Id(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 text-slate-200"
          >
            <option value="">-- Seleccione un reporte --</option>
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.playerName} ({r.club || "Sin equipo"})
              </option>
            ))}
          </select>
        </div>

        {/* Selector 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Seleccionar Jugador 2
          </label>
          <select
            value={report2Id}
            onChange={(e) => setReport2Id(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 text-slate-200"
          >
            <option value="">-- Seleccione un reporte --</option>
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.playerName} ({r.club || "Sin equipo"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!report1 || !report2 ? (
        <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800 shadow-sm">
          <User className="mx-auto h-12 w-12 text-slate-600 mb-2" />
          <h3 className="text-sm font-semibold text-slate-200">
            Comparación de jugadores
          </h3>
          <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
            Selecciona dos reportes de la lista superior para comparar sus atributos y estadísticas lado a lado.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Header Row */}
          <div className="grid grid-cols-3 items-center p-6 border-b border-slate-800 bg-slate-950/50">
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-400">
                {report1.playerName}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {report1.position || "N/A"}
              </div>
            </div>
            <div className="text-center text-xs font-bold text-slate-600 uppercase tracking-widest">
              VS
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-400">
                {report2.playerName}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {report2.position || "N/A"}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-8">
            {/* General Info */}
            <div>
              <h4 className="text-sm font-bold text-white mb-2 ml-2">Datos Generales</h4>
              <div className="bg-slate-950/50 rounded-2xl p-2 border border-slate-800/50">
                {renderComparisonRow("Edad", report1.age, report2.age, false)}
                {renderComparisonRow("Nacionalidad", report1.nationality, report2.nationality, false)}
                {renderComparisonRow("Club", report1.club, report2.club, false)}
                {renderComparisonRow("Liga", report1.league, report2.league, false)}
                {renderComparisonRow("Altura", report1.height, report2.height, false)}
                {renderComparisonRow("Pie", report1.foot, report2.foot, false)}
                {renderComparisonRow("Valor", parseInt(report1.value?.replace(/\D/g, '') || "0") ? report1.value : undefined, parseInt(report2.value?.replace(/\D/g, '') || "0") ? report2.value : undefined, false)}
              </div>
            </div>

            {/* Performance Stats */}
            {getCombinedSectionKeys("performance").length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-white mb-2 ml-2">Técnico / Táctico / Físico</h4>
                <div className="bg-slate-950/50 rounded-2xl p-2 border border-slate-800/50">
                  {getCombinedSectionKeys("performance").map((k) => {
                    const name = report1.performance?.[k]?.name || report2.performance?.[k]?.name || k;
                    return renderComparisonRow(
                      name,
                      report1.performance?.[k]?.value,
                      report2.performance?.[k]?.value,
                      true // Assume performance stats are numeric out of 10
                    );
                  })}
                </div>
              </div>
            )}

            {/* Psychological Stats */}
            {getCombinedSectionKeys("psychological").length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-white mb-2 ml-2">Psicológico</h4>
                <div className="bg-slate-950/50 rounded-2xl p-2 border border-slate-800/50">
                  {getCombinedSectionKeys("psychological").map((k) => {
                    const name = report1.psychological?.[k]?.name || report2.psychological?.[k]?.name || k;
                    return renderComparisonRow(
                      name,
                      report1.psychological?.[k]?.value,
                      report2.psychological?.[k]?.value,
                      true
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
