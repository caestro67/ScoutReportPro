import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../components/AuthProvider";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Report, PlayerList } from "../types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText,
  PlusCircle,
  Calendar,
  Trash2,
  Edit,
  Pencil,
  Search,
  Download,
  ImageIcon,
  Star,
} from "lucide-react";
import { doc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as htmlToImage from "html-to-image";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { ReportDocument } from "../components/ReportDocument";
import { getPerformanceCriteriaForPosition } from "../lib/positionCriteria";
import { LineupsTab } from "../components/LineupsTab";
import { CompareTab } from "../components/CompareTab";

export function Dashboard() {
  const { user, config } = useAuth();
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedList, setSelectedList] = useState<string>("All");
  const [exportingReport, setExportingReport] = useState<Report | null>(null);
  const reportExportRef = useRef<HTMLDivElement>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const calculateOverallScore = (report: Report) => {
    if (!config) return "0.0";
    let total = 0;
    let count = 0;

    // Performance
    const perfCriteria = getPerformanceCriteriaForPosition(report.position);
    perfCriteria.forEach((crit) => {
      const val = Number(report.performance?.[crit.id]?.value || 5);
      if (!isNaN(val) && val > 0) {
        total += val;
        count += 1;
      }
    });

    // Psychological
    if (config.categories.psychological?.criteria) {
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

  const calculateSectionScore = (
    report: Report,
    section: "performance" | "psychological",
  ) => {
    if (!config) return "0.0";
    let total = 0;
    let count = 0;

    if (section === "performance") {
      const perfCriteria = getPerformanceCriteriaForPosition(report.position);
      perfCriteria.forEach((crit) => {
        const val = Number(report.performance?.[crit.id]?.value || 5);
        if (!isNaN(val) && val > 0) {
          total += val;
          count += 1;
        }
      });
    } else {
      if (config.categories[section]?.criteria) {
        config.categories[section].criteria.forEach((crit) => {
          const val = Number(report[section]?.[crit.id]?.value || 5);
          if (!isNaN(val) && val > 0) {
            total += val;
            count += 1;
          }
        });
      }
    }

    if (count === 0) return "0.0";
    return (total / count).toFixed(1);
  };

  const [lists, setLists] = useState<PlayerList[]>([]);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listForm, setListForm] = useState({
    name: "",
    description: "",
    playerNames: [] as string[],
  });
  const [listPlayerSearch, setListPlayerSearch] = useState("");
  const [isPlayerDropdownOpen, setIsPlayerDropdownOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"reports" | "lineups" | "compare">("reports");

  useEffect(() => {
    if (!user) return;

    // Using a simpler query first to avoid missing index errors since we dynamically created this
    const q = query(collection(db, `users/${user.uid}/reports`));

    const unsubscribeReports = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Report,
        );
        // Sort in memory to avoid needing composite indexes right away
        data.sort((a, b) => b.createdAt - a.createdAt);
        setReports(data);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          `users/${user.uid}/reports`,
        );
        setLoading(false);
      },
    );

    const qLists = query(collection(db, `users/${user.uid}/lists`));
    const unsubscribeLists = onSnapshot(
      qLists,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as PlayerList,
        );
        data.sort((a, b) => b.createdAt - a.createdAt);
        setLists(data);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          `users/${user.uid}/lists`,
        );
      },
    );

    return () => {
      unsubscribeReports();
      unsubscribeLists();
    };
  }, [user]);

  const handleDelete = (e: React.MouseEvent, reportId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(reportId);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, report: Report) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      const ref = doc(db, `users/${user.uid}/reports/${report.id}`);
      await updateDoc(ref, { favorite: !report.favorite });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `users/${user.uid}/reports/${report.id}`,
      );
    }
  };

  const confirmDelete = async () => {
    if (!user || !deleteId) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/reports/${deleteId}`));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `users/${user.uid}/reports/${deleteId}`,
      );
      setDeleteId(null);
    }
  };

  const confirmDeleteList = async () => {
    if (!user || !deleteListId) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/lists/${deleteListId}`));
      if (selectedList === deleteListId) {
        setSelectedList("All");
      }
      setDeleteListId(null);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `users/${user.uid}/lists/${deleteListId}`,
      );
      setDeleteListId(null);
    }
  };

  const handleSaveList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!listForm.name.trim()) return;

    try {
      if (editingListId) {
        await updateDoc(doc(db, `users/${user.uid}/lists/${editingListId}`), {
          name: listForm.name.trim(),
          description: listForm.description.trim(),
          playerNames: listForm.playerNames,
        });
      } else {
        await addDoc(collection(db, `users/${user.uid}/lists`), {
          name: listForm.name.trim(),
          description: listForm.description.trim(),
          playerNames: listForm.playerNames,
          createdAt: Date.now(),
        });
      }
      setIsListModalOpen(false);
      setListForm({ name: "", description: "", playerNames: [] });
      setEditingListId(null);
    } catch (error) {
      handleFirestoreError(
        error,
        editingListId ? OperationType.UPDATE : OperationType.CREATE,
        editingListId ? `users/${user.uid}/lists/${editingListId}` : `users/${user.uid}/lists`,
      );
    }
  };

  const allPlayerNames = Array.from(
    new Set(reports.map((r) => r.playerName).filter(Boolean)),
  ) as string[];

  const filteredListPlayers = allPlayerNames.filter((name) =>
    name.toLowerCase().includes(listPlayerSearch.toLowerCase())
  );

  const handleExportPdf = async (report: Report) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text("Reporte de Jugador", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${report.reportDate}`, 14, 30);

    let currentY = 40;

    // Load Image if exists
    if (report.imageUrl) {
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL("image/jpeg");
              doc.addImage(dataUrl, "JPEG", 150, 10, 40, 40, undefined, "FAST");
            }
            resolve();
          };
          img.onerror = () => {
            resolve(); // ignore error
          };
          img.src = report.imageUrl as string;
        });
      } catch (e) {
        // ignore
      }
    }

    // Player Info
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Información General", 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Campo", "Valor"]],
      body: [
        ["Nombre", report.playerName || "N/A"],
        ["Posición", report.position || "N/A"],
        ["Club", report.club || "N/A"],
        ["Liga", report.league || "N/A"],
        ["Puntuación General", calculateOverallScore(report)],
        [
          "Puntuación Rendimiento",
          calculateSectionScore(report, "performance"),
        ],
        [
          "Puntuación Psicológica",
          calculateSectionScore(report, "psychological"),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
      margin: { right: 70 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    const drawRadarChart = (
      data: { name: string; value: number }[],
      title: string,
      startY: number,
      color: [number, number, number],
    ) => {
      if (data.length < 3) return startY;
      let y = startY;
      if (y > 130) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text(title, 14, y);

      const xc = 105;
      const yc = y + 65;
      const R = 45;
      const steps = 5;
      const n = data.length;

      doc.setLineWidth(0.1);
      doc.setDrawColor(200, 200, 200);

      // Draw grid
      for (let s = 1; s <= steps; s++) {
        const r = (R / steps) * s;
        let px = 0,
          py = 0;
        let gridStartX = 0,
          gridStartY = 0;
        for (let i = 0; i < n; i++) {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const x = xc + Math.cos(angle) * r;
          const y = yc + Math.sin(angle) * r;
          if (i === 0) {
            px = x;
            py = y;
            gridStartX = x;
            gridStartY = y;
          } else {
            doc.line(px, py, x, y);
            px = x;
            py = y;
          }
        }
        doc.line(px, py, gridStartX, gridStartY);
      }

      // Draw axes
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = xc + Math.cos(angle) * R;
        const y = yc + Math.sin(angle) * R;
        doc.line(xc, yc, x, y);

        const textR = R + 5;
        let tx = xc + Math.cos(angle) * textR;
        let ty = yc + Math.sin(angle) * textR;

        let align = "center";
        // Adjust alignment based on angle to prevent overlap
        const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2);
        if (
          normalizedAngle > Math.PI * 1.5 + 0.1 ||
          normalizedAngle < Math.PI * 0.5 - 0.1
        ) {
          align = "left";
          tx += 2;
        } else if (
          normalizedAngle > Math.PI * 0.5 + 0.1 &&
          normalizedAngle < Math.PI * 1.5 - 0.1
        ) {
          align = "right";
          tx -= 2;
        }

        if (Math.abs(normalizedAngle - Math.PI * 1.5) <= 0.1) {
          ty -= 2;
        } else if (Math.abs(normalizedAngle - Math.PI * 0.5) <= 0.1) {
          ty += 3;
        }

        const label = data[i].name;
        doc.text(label, tx, ty, { align: align as any });
      }

      // Draw data polygon
      doc.setLineWidth(0.5);
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setFillColor(color[0], color[1], color[2]);
      const dataPath = [];
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const valR = R * (data[i].value / 10);
        const x = xc + Math.cos(angle) * valR;
        const y = yc + Math.sin(angle) * valR;
        dataPath.push([x, y]);
      }

      if (dataPath.length > 0) {
        try {
          doc.setGState(new (doc as any).GState({ opacity: 0.3 }));
        } catch (e) {}
        const lines = [];
        for (let i = 1; i < dataPath.length; i++) {
          lines.push([
            dataPath[i][0] - dataPath[i - 1][0],
            dataPath[i][1] - dataPath[i - 1][1],
          ]);
        }
        lines.push([
          dataPath[0][0] - dataPath[dataPath.length - 1][0],
          dataPath[0][1] - dataPath[dataPath.length - 1][1],
        ]);

        doc.lines(lines, dataPath[0][0], dataPath[0][1], [1, 1], "FD");
        try {
          doc.setGState(new (doc as any).GState({ opacity: 1 }));
        } catch (e) {}
      }

      return yc + R + 25;
    };

    // Prepare chart data
    const perfData: { name: string; value: number }[] = [];
    const perfCriteria = getPerformanceCriteriaForPosition(report.position);
    perfCriteria.forEach((crit) => {
      perfData.push({
        name: crit.name,
        value: Number(report.performance?.[crit.id]?.value || 5), // default to 5
      });
    });

    const psychData: { name: string; value: number }[] = [];
    if (config?.categories.psychological) {
      config.categories.psychological.criteria.forEach((crit) => {
        psychData.push({
          name: crit.name,
          value: Number(report.psychological?.[crit.id]?.value || 0),
        });
      });
    }

    // 1. Rendimiento
    if (perfCriteria.length > 0) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text("Rendimiento", 14, currentY);

      const perfBody = perfCriteria.map((crit) => [
        crit.name,
        report.performance?.[crit.id]?.value || "5",
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Criterio", "Puntuación"]],
        body: perfBody,
        theme: "grid",
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;

      currentY = drawRadarChart(
        perfData,
        "Gráfico de Rendimiento",
        currentY,
        [16, 185, 129],
      ); // emerald
    }

    // 2. Psicológico
    if (config?.categories.psychological) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text("Psicológico", 14, currentY);

      const psychBody = config.categories.psychological.criteria.map((crit) => [
        crit.name,
        report.psychological?.[crit.id]?.value || "N/A",
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Criterio", "Puntuación"]],
        body: psychBody,
        theme: "grid",
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;

      currentY = drawRadarChart(
        psychData,
        "Gráfico Psicológico",
        currentY,
        [59, 130, 246],
      ); // blue
    }

    // 3. Lesiones
    if (report.injuryHistory && report.injuryHistory.length > 0) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text("Historial de Lesiones", 14, currentY);

      const injuriesBody = report.injuryHistory.map((inj) => [
        new Date(inj.date).toLocaleDateString(),
        inj.type,
        inj.region,
        inj.duration,
        inj.description || "",
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Fecha", "Tipo", "Región", "Duración", "Descripción"]],
        body: injuriesBody,
        theme: "grid",
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // 4. Multimedia
    if (report.videos && report.videos.length > 0) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text("Multimedia", 14, currentY);

      const videosBody = report.videos.map((vid) => [vid.title, vid.url]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Título", "Enlace Web"]],
        body: videosBody,
        theme: "grid",
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Observations
    if (report.scoutNotes) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text("Notas / Observaciones", 14, currentY);

      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      const splitText = doc.splitTextToSize(report.scoutNotes, 180);
      doc.text(splitText, 14, currentY + 10);
    }

    doc.save(
      `${(report.playerName || "reporte").replace(/\s+/g, "_")}_${report.reportDate}.pdf`,
    );
  };

  const handleExportPng = async (report: Report) => {
    setExportingReport(report);
    try {
      // Allow React to render the invisible component and recharts to draw
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!reportExportRef.current) return;

      const dataUrl = await htmlToImage.toPng(reportExportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0f172a", // slate-950
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${(report.playerName || "reporte").replace(/\s+/g, "_")}_${report.reportDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exportando PNG:", err);
    } finally {
      setExportingReport(null);
    }
  };

  const filteredReports = reports.filter((report) => {
    const searchLower = searchTerm.toLowerCase();
    const matchName = (report.playerName || "Sin Nombre")
      .toLowerCase()
      .includes(searchLower);
    const matchPos = (report.position || "")
      .toLowerCase()
      .includes(searchLower);
    const matchClub = (report.club || "").toLowerCase().includes(searchLower);
    const matchLeague = (report.league || "")
      .toLowerCase()
      .includes(searchLower);

    const matchSearch = matchName || matchPos || matchClub || matchLeague;

    const overallScore = Number(calculateOverallScore(report));
    const scoreThreshold = Number(scoreFilter) || 0;
    const matchScore = overallScore >= scoreThreshold;

    const matchFavorite = showFavoritesOnly ? !!report.favorite : true;

    let matchList = true;
    if (selectedList !== "All") {
      const list = lists.find((l) => l.id === selectedList);
      if (list) {
        matchList = list.playerNames.includes(
          report.playerName || "Sin Nombre",
        );
      } else {
        matchList = false;
      }
    }

    return matchSearch && matchScore && matchFavorite && matchList;
  });

  const groupedReports = filteredReports.reduce(
    (acc, report) => {
      const key = (report.playerName || "Sin Nombre").trim();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(report);
      return acc;
    },
    {} as Record<string, Report[]>,
  );

  if (loading) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4 items-center">
          <h1 className="text-2xl font-bold text-slate-200">{t("myReports")}</h1>
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode("reports")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${viewMode === "reports" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
            >
              Reportes
            </button>
            <button
              onClick={() => setViewMode("lineups")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${viewMode === "lineups" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
            >
              Onces
            </button>
            <button
              onClick={() => setViewMode("compare")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${viewMode === "compare" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
            >
              Comparar
            </button>
          </div>
        </div>
        {viewMode === "reports" && (
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Buscar jugador, posición, club..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 text-slate-200"
              />
            </div>
            <div className="relative w-full sm:w-32">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="Min PTS general"
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 text-slate-200"
              />
            </div>
            <Link
              to="/reports/new"
              className="flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl font-bold hover:bg-emerald-600 transition tracking-wide text-sm uppercase shrink-0"
            >
              <PlusCircle size={20} />
              {t("newReport")}
            </Link>
          </div>
        )}
      </div>

      {viewMode === "reports" ? (
        <>
          <div className="flex flex-wrap items-center gap-2 px-1">
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
            showFavoritesOnly
              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          <Star size={14} fill={showFavoritesOnly ? "currentColor" : "none"} />
          Favoritos
        </button>
        <div className="w-[1px] h-6 bg-slate-800 mx-2"></div>
        <button
          onClick={() => setSelectedList("All")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
            selectedList === "All"
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
          }`}
        >
          Todos
        </button>
        {lists.map((list) => (
          <div
            key={list.id}
            className={`flex items-center rounded-lg border transition-colors overflow-hidden ${
              selectedList === list.id
                ? "bg-emerald-500/20 border-emerald-500/30"
                : "bg-slate-900 border-slate-800 hover:border-slate-700"
            }`}
          >
            <button
              onClick={() => setSelectedList(list.id)}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedList === list.id
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {list.name}
            </button>
            {selectedList === list.id && (
              <div className="flex items-center bg-emerald-500/10">
                <button
                  onClick={() => {
                    setEditingListId(list.id);
                    setListForm({
                      name: list.name,
                      description: list.description,
                      playerNames: list.playerNames || [],
                    });
                    setIsListModalOpen(true);
                  }}
                  className="p-1.5 text-emerald-500 hover:bg-emerald-500/30 transition-colors"
                  title="Editar lista"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteListId(list.id)}
                  className="p-1.5 text-red-500 hover:bg-red-500/20 transition-colors"
                  title="Eliminar lista"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
        <div className="w-[1px] h-6 bg-slate-800 mx-2"></div>
        <button
          onClick={() => setIsListModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
        >
          <PlusCircle size={14} />
          Crear Lista
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800 shadow-sm col-span-12">
          <FileText className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-2 text-sm font-semibold text-slate-200">
            No reports
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Get started by creating a new player report.
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800 shadow-sm col-span-12">
          <Search className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-2 text-sm font-semibold text-slate-200">
            No se encontraron resultados
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            No hay reportes que coincidan con la búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full min-w-0">
          <div className="md:col-span-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full min-w-0">
            {(Object.entries(groupedReports) as [string, Report[]][]).map(
              ([playerName, playerReports]) => {
                const latestReport = playerReports[0];
                return (
                  <div
                    key={playerName}
                    id={`player-card-${playerName}`}
                    className="bg-slate-900 border border-slate-800 rounded-3xl flex flex-col hover:border-emerald-500/30 transition-colors shadow-sm"
                  >
                    <div className="p-6 border-b border-slate-800/50">
                      <div className="flex gap-4 items-start">
                        {latestReport.imageUrl ? (
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-700 shrink-0">
                            <img
                              src={latestReport.imageUrl}
                              alt={playerName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shrink-0">
                            <FileText size={24} className="text-slate-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-slate-200 line-clamp-1">
                            {playerName}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {lists
                              .filter((l) => l.playerNames.includes(playerName))
                              .map((list) => (
                                <span
                                  key={list.id}
                                  className="px-2 py-0.5 border border-emerald-500/30 text-emerald-400 rounded-md text-[10px] uppercase font-bold tracking-wider truncate max-w-24"
                                >
                                  {list.name}
                                </span>
                              ))}
                            {latestReport.position && (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] uppercase font-bold tracking-wider truncate max-w-24">
                                {latestReport.position}
                              </span>
                            )}
                            {latestReport.club && (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] uppercase font-bold tracking-wider truncate max-w-24">
                                {latestReport.club}
                              </span>
                            )}
                            {latestReport.league && (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] uppercase font-bold tracking-wider truncate max-w-24">
                                {latestReport.league}
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className="flex flex-col items-center justify-center shrink-0 w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl relative"
                          title="Puntuación General (Último Reporte)"
                        >
                          <span className="text-emerald-400 font-black text-xl">
                            {calculateOverallScore(latestReport)}
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-500/70 absolute bottom-1.5 hidden">
                            Total
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleToggleFavorite(e, latestReport)}
                          className={`p-2 rounded-full transition-colors ${latestReport.favorite ? "text-yellow-400 hover:bg-yellow-400/10" : "text-slate-600 hover:text-slate-300 hover:bg-slate-800"}`}
                        >
                          <Star
                            size={20}
                            fill={
                              latestReport.favorite ? "currentColor" : "none"
                            }
                          />
                        </button>
                      </div>

                      <div className="mt-6 new-report-btn">
                        <Link
                          to="/reports/new"
                          state={{ initialData: latestReport }}
                          className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-500 hover:text-slate-950 transition-colors uppercase text-[11px] tracking-wider w-full"
                        >
                          <PlusCircle size={16} />
                          Nuevo Reporte
                        </Link>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/30 flex-1 flex flex-col rounded-b-3xl history-section">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">
                        Historial de Reportes
                      </h4>
                      <div className="space-y-2 flex-1">
                        {playerReports.map((report) => (
                          <div
                            key={report.id}
                            className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800/80 rounded-xl group hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700/50">
                                <Calendar size={14} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-300">
                                  {report.reportDate}
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                  Reporte
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleExportPng(report);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Exportar a PNG"
                              >
                                <ImageIcon size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleExportPdf(report);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Exportar a PDF"
                              >
                                <Download size={14} />
                              </button>
                              <Link
                                to={`/reports/edit/${report.id}`}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit size={14} />
                              </Link>
                              <button
                                onClick={(e) => handleDelete(e, report.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
        </>
      ) : viewMode === "lineups" ? (
        <LineupsTab reports={reports} />
      ) : (
        <CompareTab reports={reports} />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-200 mb-2">
              Eliminar reporte
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              ¿Estás seguro de que deseas eliminar este reporte? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold rounded-xl transition-colors text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteListId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-200 mb-2">
              Eliminar lista
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              ¿Estás seguro de que deseas eliminar esta lista? La acción no eliminará los reportes asociados, solo la lista.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteListId(null)}
                className="px-4 py-2 font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteList}
                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold rounded-xl transition-colors text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {exportingReport && config && (
        <div className="fixed top-0 left-[-9999px] z-[-1] pointer-events-none opacity-0">
          <ReportDocument
            ref={reportExportRef}
            report={exportingReport}
            config={config}
          />
        </div>
      )}

      {isListModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-200 mb-6">
              {editingListId ? "Editar Lista" : "Crear Nueva Lista"}
            </h3>
            <form onSubmit={handleSaveList} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nombre de la Lista
                </label>
                <input
                  type="text"
                  required
                  value={listForm.name}
                  onChange={(e) =>
                    setListForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Descripción
                </label>
                <textarea
                  value={listForm.description}
                  onChange={(e) =>
                    setListForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 text-slate-200"
                  rows={2}
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Seleccionar Jugadores
                </label>
                <div className="relative">
                  <div
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors"
                    onClick={() => setIsPlayerDropdownOpen(!isPlayerDropdownOpen)}
                  >
                    <span className="text-sm text-slate-400">
                      Seleccionar jugadores...
                    </span>
                    <span className="text-slate-500 text-xs text-opacity-50">▼</span>
                  </div>

                  {isPlayerDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-[60] overflow-hidden">
                      <div className="p-2 border-b border-slate-800">
                        <input
                          type="text"
                          placeholder="Buscar jugador..."
                          value={listPlayerSearch}
                          onChange={(e) => setListPlayerSearch(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2">
                        {allPlayerNames.length === 0 ? (
                          <p className="text-sm text-slate-500 p-2 text-center">
                            No hay jugadores disponibles.
                          </p>
                        ) : filteredListPlayers.length === 0 ? (
                          <p className="text-sm text-slate-500 p-2 text-center">
                            No se encontraron resultados.
                          </p>
                        ) : (
                          filteredListPlayers.map((playerName) => (
                            <label
                              key={playerName}
                              className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={listForm.playerNames.includes(playerName)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setListForm((prev) => ({
                                      ...prev,
                                      playerNames: [...prev.playerNames, playerName],
                                    }));
                                  } else {
                                    setListForm((prev) => ({
                                      ...prev,
                                      playerNames: prev.playerNames.filter(
                                        (p) => p !== playerName,
                                      ),
                                    }));
                                  }
                                }}
                                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                              />
                              <span className="text-sm font-medium text-slate-300">
                                {playerName}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {listForm.playerNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {listForm.playerNames.map((playerName) => (
                      <span key={playerName} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                        {playerName}
                        <button
                          type="button"
                          onClick={() => {
                            setListForm((prev) => ({
                              ...prev,
                              playerNames: prev.playerNames.filter((p) => p !== playerName),
                            }));
                          }}
                          className="hover:text-emerald-300 focus:outline-none"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsListModalOpen(false);
                    setListForm({ name: "", description: "", playerNames: [] });
                    setEditingListId(null);
                  }}
                  className="px-4 py-2 font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!listForm.name.trim()}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 hover:bg-emerald-600 font-bold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingListId ? "Guardar Cambios" : "Guardar Lista"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
