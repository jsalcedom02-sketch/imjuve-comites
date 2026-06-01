import { useState } from 'react';
import mexicoMap from '@svg-country-maps/mexico';

const LOC_TO_ESTADO: Record<string, string> = {
  'Aguascalientes': 'AGUASCALIENTES',
  'Baja California': 'BAJA CALIFORNIA',
  'Baja California Sur': 'BAJA CALIFORNIA SUR',
  'Campeche': 'CAMPECHE',
  'Chiapas': 'CHIAPAS',
  'Chihuahua': 'CHIHUAHUA',
  'Coahuila': 'COAHUILA DE ZARAGOZA',
  'Colima': 'COLIMA',
  'Durango': 'DURANGO',
  'Guanajuato': 'GUANAJUATO',
  'Guerrero': 'GUERRERO',
  'Hidalgo': 'HIDALGO',
  'Jalisco': 'JALISCO',
  'Mexico City': 'CIUDAD DE MÉXICO',
  'México': 'MÉXICO',
  'Michoacán': 'MICHOACÁN DE OCAMPO',
  'Morelos': 'MORELOS',
  'Nayarit': 'NAYARIT',
  'Nuevo León': 'NUEVO LEÓN',
  'Oaxaca': 'OAXACA',
  'Puebla': 'PUEBLA',
  'Querétaro': 'QUERÉTARO',
  'Quintana Roo': 'QUINTANA ROO',
  'San Luis Potosí': 'SAN LUIS POTOSÍ',
  'Sinaloa': 'SINALOA',
  'Sonora': 'SONORA',
  'Tabasco': 'TABASCO',
  'Tamaulipas': 'TAMAULIPAS',
  'Tlaxcala': 'TLAXCALA',
  'Veracruz': 'VERACRUZ DE IGNACIO DE LA LLAVE',
  'Yucatán': 'YUCATÁN',
  'Zacatecas': 'ZACATECAS',
};

const MIN_COLOR = '#f7ebee';
const MAX_COLOR = '#6d0f22';

function intensityColor(t: number): string {
  if (t <= 0) return '#e5e7eb';
  const r1 = 0xf7, g1 = 0xeb, b1 = 0xee;
  const r2 = 0x6d, g2 = 0x0f, b2 = 0x22;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

interface MexicoMapProps {
  estadoCount?: Record<string, number>;
  highlightEstado?: string;
}

export default function MexicoMap({ estadoCount = {}, highlightEstado }: MexicoMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const maxCount = Math.max(...Object.values(estadoCount), 1);

  return (
    <div className="relative">
      <svg
        viewBox={mexicoMap.viewBox}
        className="w-full h-auto"
        aria-label={mexicoMap.label}
        style={{ minHeight: 200 }}
      >
        {mexicoMap.locations.map((loc) => {
          const estadoKey = LOC_TO_ESTADO[loc.name];
          const count = estadoKey ? (estadoCount[estadoKey] || 0) : 0;
          const intensity = count / maxCount;
          const isHovered = hovered === loc.id;
          const isSelected = selected === loc.id;
          const isActive = isHovered || isSelected;
          const isHighlighted = highlightEstado && estadoKey === highlightEstado;
          const isDimmed = highlightEstado && estadoKey !== highlightEstado;
          return (
            <path
              key={loc.id}
              id={loc.id}
              name={loc.name}
              d={loc.path}
              className="transition-all duration-150 cursor-pointer"
              fill={
                isHighlighted
                  ? MAX_COLOR
                  : isDimmed
                    ? '#e5e7eb'
                    : isActive
                      ? MAX_COLOR
                      : count > 0
                        ? intensityColor(intensity)
                        : '#e5e7eb'
              }
              stroke={isActive ? '#fff' : count > 0 ? '#d693a1' : '#d1d5db'}
              strokeWidth={isHighlighted ? 2 : isActive ? 1.5 : count > 0 ? 1.2 : 0.8}
              opacity={isDimmed ? 0.3 : 1}
              onMouseEnter={() => setHovered(loc.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(selected === loc.id ? null : loc.id)}
            />
          );
        })}
      </svg>
      {hovered && !highlightEstado && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-guinda text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-none">
          {mexicoMap.locations.find((l) => l.id === hovered)?.name}
          {(() => {
            const loc = mexicoMap.locations.find((l) => l.id === hovered);
            if (!loc) return null;
            const key = LOC_TO_ESTADO[loc.name];
            const c = key ? estadoCount[key] : 0;
            return c ? ` · ${c} comités` : ' · sin registro';
          })()}
        </div>
      )}
      {highlightEstado && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-guinda text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg pointer-events-none">
          {mexicoMap.locations.find((l) => LOC_TO_ESTADO[l.name] === highlightEstado)?.name ?? highlightEstado}
        </div>
      )}
    </div>
  );
}
