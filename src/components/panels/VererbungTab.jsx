// ============================================================
// VererbungTab.jsx — Class inheritance diagram (UML-style)
// ============================================================
// Static SVG showing Zeichenobjekt as the base class with
// lines connecting to its 7 subclasses.
// ============================================================

const baseClass = 'Zeichenobjekt';
const subClasses = [
  'Rechteck',
  'Ellipse',
  'Linie',
  'Dreieck',
  'Polygon',
  'TextObjekt',
  'BildObjekt',
];

// Layout constants
const SVG_WIDTH = 210;
const SVG_HEIGHT = 340;
const BOX_WIDTH = 80;
const BOX_HEIGHT = 28;
const BASE_X = (SVG_WIDTH - BOX_WIDTH) / 2;
const BASE_Y = 20;
const SUB_START_Y = 220;
const SUB_COLS = 2;
const COL_GAP = 10;
const ROW_GAP = 10;
const SUB_BOX_WIDTH = (SVG_WIDTH - COL_GAP * (SUB_COLS + 1)) / SUB_COLS;

function getSubClassPositions() {
  const positions = [];
  const rows = Math.ceil(subClasses.length / SUB_COLS);

  for (let i = 0; i < subClasses.length; i++) {
    const col = i % SUB_COLS;
    const row = Math.floor(i / SUB_COLS);
    const x = COL_GAP + col * (SUB_BOX_WIDTH + COL_GAP);
    const y = SUB_START_Y + row * (BOX_HEIGHT + ROW_GAP);
    positions.push({ x, y, name: subClasses[i] });
  }

  return positions;
}

function VererbungTab() {
  const subPositions = getSubClassPositions();

  // Calculate total SVG height based on last subclass row
  const lastPos = subPositions[subPositions.length - 1];
  const totalHeight = lastPos.y + BOX_HEIGHT + 20;

  // Base class center bottom point (where lines originate)
  const baseCenterX = BASE_X + BOX_WIDTH / 2;
  const baseBottomY = BASE_Y + BOX_HEIGHT;

  // Junction point for inheritance lines
  const junctionY = (baseBottomY + SUB_START_Y) / 2;

  return (
    <div className="p-3 overflow-auto">
      <p className="text-xs font-medium text-slate-600 mb-2">Klassendiagramm</p>
      <svg
        width={SVG_WIDTH}
        height={totalHeight}
        viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
        className="block"
      >
        {/* Base class box */}
        <rect
          x={BASE_X}
          y={BASE_Y}
          width={BOX_WIDTH}
          height={BOX_HEIGHT}
          rx={3}
          fill="#f0f0f0"
          stroke="#333"
          strokeWidth={2}
        />
        <text
          x={baseCenterX}
          y={BASE_Y + BOX_HEIGHT / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fontWeight="bold"
          fontStyle="italic"
          fill="#333"
        >
          {baseClass}
        </text>

        {/* Vertical line from base class down to junction */}
        <line
          x1={baseCenterX}
          y1={baseBottomY}
          x2={baseCenterX}
          y2={junctionY}
          className="inheritance-line"
        />

        {/* Horizontal line across junction */}
        {subPositions.length > 1 && (
          <line
            x1={subPositions[0].x + SUB_BOX_WIDTH / 2}
            y1={junctionY}
            x2={subPositions[subPositions.length - 1].x + SUB_BOX_WIDTH / 2}
            y2={junctionY}
            className="inheritance-line"
          />
        )}

        {/* Subclass boxes and vertical connectors */}
        {subPositions.map((pos) => {
          const subCenterX = pos.x + SUB_BOX_WIDTH / 2;
          return (
            <g key={pos.name}>
              {/* Vertical line from junction to subclass */}
              <line
                x1={subCenterX}
                y1={junctionY}
                x2={subCenterX}
                y2={pos.y}
                className="inheritance-line"
              />

              {/* Inheritance arrow (open triangle) at subclass top */}
              <polygon
                points={`${subCenterX},${junctionY - 8} ${subCenterX - 5},${junctionY} ${subCenterX + 5},${junctionY}`}
                className="inheritance-arrow"
              />

              {/* Subclass box */}
              <rect
                x={pos.x}
                y={pos.y}
                width={SUB_BOX_WIDTH}
                height={BOX_HEIGHT}
                rx={3}
                fill="white"
                stroke="#333"
                strokeWidth={1.5}
              />
              <text
                x={subCenterX}
                y={pos.y + BOX_HEIGHT / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontWeight="600"
                fill="#333"
              >
                {pos.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default VererbungTab;
