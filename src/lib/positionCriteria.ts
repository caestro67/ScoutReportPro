import { UserConfig } from "../types";

export interface PerformanceCriteria {
  id: string;
  name: string;
  category: "Físicos" | "Creativos" | "Mentales" | string;
}

export const getPerformanceCriteriaForPosition = (
  position?: string,
  config?: UserConfig | null
): PerformanceCriteria[] => {
  const criteriaByPos: Record<string, PerformanceCriteria[]> = {
    Portero: [
      { id: "por_fis_1", name: "Reflejos", category: "Físicos" },
      { id: "por_fis_2", name: "Agilidad", category: "Físicos" },
      { id: "por_fis_3", name: "Fuerza de salto", category: "Físicos" },
      { id: "por_fis_4", name: "Alcance", category: "Físicos" },
      { id: "por_cre_1", name: "Distribución rápida", category: "Creativos" },
      { id: "por_cre_2", name: "Salida con el pie", category: "Creativos" },
      { id: "por_cre_3", name: "Pase largo dirigido", category: "Creativos" },
      { id: "por_cre_4", name: "Amagos de saque", category: "Creativos" },
      { id: "por_men_1", name: "Concentración", category: "Mentales" },
      { id: "por_men_2", name: "Valentía", category: "Mentales" },
      { id: "por_men_3", name: "Mando en el área", category: "Mentales" },
      { id: "por_men_4", name: "Toma de decisiones", category: "Mentales" },
    ],
    Central: [
      { id: "cen_fis_1", name: "Fuerza", category: "Físicos" },
      { id: "cen_fis_2", name: "Potencia de salto", category: "Físicos" },
      { id: "cen_fis_3", name: "Velocidad de carrera", category: "Físicos" },
      { id: "cen_fis_4", name: "Equilibrio", category: "Físicos" },
      { id: "cen_cre_1", name: "Pase largo cruzado", category: "Creativos" },
      { id: "cen_cre_2", name: "Conducción rompedora", category: "Creativos" },
      { id: "cen_cre_3", name: "Pases filtrados", category: "Creativos" },
      { id: "cen_cre_4", name: "Fintas de cuerpo", category: "Creativos" },
      { id: "cen_men_1", name: "Colocación", category: "Mentales" },
      { id: "cen_men_2", name: "Anticipación", category: "Mentales" },
      { id: "cen_men_3", name: "Agresividad controlada", category: "Mentales" },
      { id: "cen_men_4", name: "Liderazgo", category: "Mentales" },
    ],
    Lateral: [
      { id: "lat_fis_1", name: "Resistencia", category: "Físicos" },
      { id: "lat_fis_2", name: "Aceleración", category: "Físicos" },
      { id: "lat_fis_3", name: "Velocidad máxima", category: "Físicos" },
      { id: "lat_fis_4", name: "Recuperación física", category: "Físicos" },
      {
        id: "lat_cre_1",
        name: "Centros al primer toque",
        category: "Creativos",
      },
      { id: "lat_cre_2", name: "Paredes rápidas", category: "Creativos" },
      { id: "lat_cre_3", name: "Pases interiores", category: "Creativos" },
      { id: "lat_cre_4", name: "Centros retrasados", category: "Creativos" },
      { id: "lat_men_1", name: "Sacrificio", category: "Mentales" },
      { id: "lat_men_2", name: "Disciplina táctica", category: "Mentales" },
      { id: "lat_men_3", name: "Concentración", category: "Mentales" },
      { id: "lat_men_4", name: "Tenacidad", category: "Mentales" },
    ],
    Mediocentro: [
      { id: "mc_fis_1", name: "Resistencia", category: "Físicos" },
      { id: "mc_fis_2", name: "Fuerza", category: "Físicos" },
      { id: "mc_fis_3", name: "Equilibrio", category: "Físicos" },
      { id: "mc_fis_4", name: "Potencia en carrera", category: "Físicos" },
      { id: "mc_cre_1", name: "Cambios de orientación", category: "Creativos" },
      { id: "mc_cre_2", name: "Pases de primer toque", category: "Creativos" },
      { id: "mc_cre_3", name: "Distribución fluida", category: "Creativos" },
      { id: "mc_cre_4", name: "Retención bajo presión", category: "Creativos" },
      { id: "mc_men_1", name: "Colocación", category: "Mentales" },
      { id: "mc_men_2", name: "Anticipación", category: "Mentales" },
      { id: "mc_men_3", name: "Disciplina táctica", category: "Mentales" },
      { id: "mc_men_4", name: "Trabajo en equipo", category: "Mentales" },
    ],
    Mediapunta: [
      { id: "mp_fis_1", name: "Agilidad", category: "Físicos" },
      { id: "mp_fis_2", name: "Aceleración", category: "Físicos" },
      { id: "mp_fis_3", name: "Coordinación", category: "Físicos" },
      { id: "mp_fis_4", name: "Velocidad en giros", category: "Físicos" },
      { id: "mp_cre_1", name: "Visión de juego", category: "Creativos" },
      { id: "mp_cre_2", name: "Pases entre líneas", category: "Creativos" },
      { id: "mp_cre_3", name: "Improvisación", category: "Creativos" },
      { id: "mp_cre_4", name: "Pases de tacón", category: "Creativos" },
      { id: "mp_men_1", name: "Determinación", category: "Mentales" },
      { id: "mp_men_2", name: "Confianza", category: "Mentales" },
      { id: "mp_men_3", name: "Frialdad", category: "Mentales" },
      { id: "mp_men_4", name: "Visión táctica", category: "Mentales" },
    ],
    Extremo: [
      { id: "ext_fis_1", name: "Velocidad explosiva", category: "Físicos" },
      { id: "ext_fis_2", name: "Aceleración", category: "Físicos" },
      { id: "ext_fis_3", name: "Agilidad", category: "Físicos" },
      { id: "ext_fis_4", name: "Potencia", category: "Físicos" },
      { id: "ext_cre_1", name: "Regate imprevisible", category: "Creativos" },
      { id: "ext_cre_2", name: "Centros con rosca", category: "Creativos" },
      { id: "ext_cre_3", name: "Fintas de tiro", category: "Creativos" },
      {
        id: "ext_cre_4",
        name: "Diagonales inesperadas",
        category: "Creativos",
      },
      { id: "ext_men_1", name: "Descaro", category: "Mentales" },
      { id: "ext_men_2", name: "Persistencia", category: "Mentales" },
      { id: "ext_men_3", name: "Agresividad ofensiva", category: "Mentales" },
      { id: "ext_men_4", name: "Confianza", category: "Mentales" },
    ],
    Delantero: [
      { id: "del_fis_1", name: "Fuerza", category: "Físicos" },
      { id: "del_fis_2", name: "Potencia de salto", category: "Físicos" },
      { id: "del_fis_3", name: "Velocidad de reacción", category: "Físicos" },
      { id: "del_fis_4", name: "Aceleración", category: "Físicos" },
      { id: "del_cre_1", name: "Desmarques de ruptura", category: "Creativos" },
      { id: "del_cre_2", name: "Remates acrobáticos", category: "Creativos" },
      { id: "del_cre_3", name: "Arrastre de marcas", category: "Creativos" },
      { id: "del_cre_4", name: "Fintas de desmarque", category: "Creativos" },
      { id: "del_men_1", name: "Olfato de gol", category: "Mentales" },
      { id: "del_men_2", name: "Compostura", category: "Mentales" },
      { id: "del_men_3", name: "Determinación", category: "Mentales" },
      { id: "del_men_4", name: "Anticipación", category: "Mentales" },
    ],
  };

  if (!position) return [];

  // Check if we have user-overridden config for this position
  if (config?.performanceByPosition?.[position]) {
    return config.performanceByPosition[position].criteria.map(c => ({
      id: c.id,
      name: c.name,
      category: c.group || "Técnica"
    }));
  }

  // Fallback to defaults
  if (criteriaByPos[position]) {
    return criteriaByPos[position];
  }

  return [];
};
