import React, { forwardRef } from "react";
import { Report, UserConfig } from "../types";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { getPerformanceCriteriaForPosition } from "../lib/positionCriteria";

interface Props {
  report: Report;
  config: UserConfig;
}

export const ReportDocument = forwardRef<HTMLDivElement, Props>(
  ({ report, config }, ref) => {
    const getPerformanceData = () => {
      const perfCriteria = getPerformanceCriteriaForPosition(report.position, config);
      return perfCriteria.map((crit) => ({
        name: crit.name,
        value: Number(report.performance?.[crit.id]?.value) || 5, // fallback to 5
        fullMark: 10,
      }));
    };

    const getPsychologicalData = () => {
      return (
        config?.categories.psychological.criteria.map((crit) => ({
          name: crit.name,
          value: Number(report.psychological?.[crit.id]?.value) || 0,
          fullMark: 10,
        })) || []
      );
    };

    const perfData = getPerformanceData();
    const psychData = getPsychologicalData();

    return (
      <div
        ref={ref}
        className="bg-slate-950 text-slate-200 p-8 pt-10"
        style={{
          width: "800px",
          margin: 0,
          paddingBlock: "40px",
          paddingInline: "40px",
        }}
      >
        <div className="flex items-start gap-6 border-b border-slate-800 pb-8 mb-8">
          {report.imageUrl ? (
            <img
              src={report.imageUrl}
              alt={report.playerName}
              className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl font-bold text-slate-500 uppercase">
              {(report.playerName || "S/N").substring(0, 2)}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
              {report.playerName}
            </h1>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-400">
              <div>
                <span className="text-slate-500">Fecha:</span>{" "}
                <span className="text-slate-300 font-medium">
                  {report.reportDate}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Posición:</span>{" "}
                <span className="text-slate-300 font-medium">
                  {report.position || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Club:</span>{" "}
                <span className="text-slate-300 font-medium">
                  {report.club || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Liga:</span>{" "}
                <span className="text-slate-300 font-medium">
                  {report.league || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Nacionalidad:</span>{" "}
                <span className="text-slate-300 font-medium">
                  {report.nationality || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Edad:</span>{" "}
                <span className="text-slate-300 font-medium">
                  {report.age || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Estatura:</span>{" "}
                <span className="text-slate-300 font-medium">
                  {report.height || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Rendimiento */}
        {config?.categories.performance && (
          <div className="mb-8">
            <h2 className="text-lg font-black text-emerald-400 uppercase tracking-widest border-b border-emerald-500/20 pb-2 mb-4">
              1. Rendimiento
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-slate-500">
                      <th className="py-2">Criterio</th>
                      <th className="py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfData.map((item) => (
                      <tr
                        key={item.name}
                        className="border-b border-slate-800/50"
                      >
                        <td className="py-2 text-slate-300">{item.name}</td>
                        <td className="py-2 text-right text-emerald-400 font-bold">
                          {item.value}/10
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center items-center h-[260px]">
                {perfData.length >= 3 && (
                  <RadarChart
                    outerRadius={90}
                    width={300}
                    height={260}
                    data={perfData}
                    className="!w-[300px] !h-[260px]"
                  >
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis
                      dataKey="name"
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
                      name="Rendimiento"
                      dataKey="value"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.4}
                      isAnimationActive={false}
                    />
                  </RadarChart>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Psicológico */}
        {config?.categories.psychological && (
          <div className="mb-8">
            <h2 className="text-lg font-black text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-2 mb-4">
              2. Psicológico
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-slate-500">
                      <th className="py-2">Criterio</th>
                      <th className="py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {psychData.map((item) => (
                      <tr
                        key={item.name}
                        className="border-b border-slate-800/50"
                      >
                        <td className="py-2 text-slate-300">{item.name}</td>
                        <td className="py-2 text-right text-blue-400 font-bold">
                          {item.value}/10
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center items-center h-[260px]">
                {psychData.length >= 3 && (
                  <RadarChart
                    outerRadius={90}
                    width={300}
                    height={260}
                    data={psychData}
                    className="!w-[300px] !h-[260px]"
                  >
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis
                      dataKey="name"
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
                      name="Psicológico"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.4}
                      isAnimationActive={false}
                    />
                  </RadarChart>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. Lesiones */}
        {report.injuryHistory && report.injuryHistory.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-black text-orange-400 uppercase tracking-widest border-b border-orange-500/20 pb-2 mb-4">
              3. Lesiones
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-500 bg-slate-900/50">
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Región</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Duración</th>
                  <th className="p-2">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {report.injuryHistory.map((injury, index) => (
                  <tr key={index} className="border-b border-slate-800/50">
                    <td className="p-2 text-slate-300">{injury.date}</td>
                    <td className="p-2 text-slate-300">{injury.region}</td>
                    <td className="p-2 text-slate-300">{injury.type}</td>
                    <td className="p-2 text-slate-300">{injury.duration}</td>
                    <td className="p-2 text-slate-400">
                      {injury.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Multimedia */}
        {report.videos && report.videos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-black text-purple-400 uppercase tracking-widest border-b border-purple-500/20 pb-2 mb-4">
              4. Multimedia
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-500 bg-slate-900/50">
                  <th className="p-2 w-1/3">Título</th>
                  <th className="p-2">Enlace</th>
                </tr>
              </thead>
              <tbody>
                {report.videos.map((vid, index) => (
                  <tr key={index} className="border-b border-slate-800/50">
                    <td className="p-2 text-slate-300 font-medium">
                      {vid.title}
                    </td>
                    <td className="p-2 text-blue-400 break-all text-xs">
                      {vid.url}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notas / Observaciones */}
        {report.scoutNotes && (
          <div>
            <h2 className="text-lg font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4">
              Notas / Observaciones
            </h2>
            <div className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 whitespace-pre-wrap">
              {report.scoutNotes}
            </div>
          </div>
        )}
      </div>
    );
  },
);

ReportDocument.displayName = "ReportDocument";
