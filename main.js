const canvas = document.getElementById("bezierCanvas");
const ctx = canvas.getContext("2d");
const curveTypeSelect = document.getElementById("curveType");
const formulaContent = document.getElementById("formulaContent");
const saveButton = document.getElementById("saveButton");

// Sæt oprindelsen til midten og invert y-aksen
ctx.translate(canvas.width / 2, canvas.height / 2);
ctx.scale(1, -1);

// Konstanter
const gridSpacing = 50;
const snappingThreshold = 10;

// Kontrolpunkter og nuværende kurvetype
let controlPoints = [];
let currentCurveType = curveTypeSelect.value;

// Hjælpefunktion til at formatere tal
const formatNumber = (num) =>
  Number.isInteger(num) ? `${num}` : `${num.toFixed(1)}`;

// Initialiser kontrolpunkter baseret på kurvetype
const initializeControlPoints = () => {
  const pointsMap = {
    linear: [
      { x: -3, y: 0, label: "P0" },
      { x: 3, y: 0, label: "P1" },
    ],
    quadratic: [
      { x: -3, y: -2, label: "P0" },
      { x: 0, y: 4, label: "P1" },
      { x: 3, y: -2, label: "P2" },
    ],
    cubic: [
      { x: -3, y: -2, label: "P0" },
      { x: -1, y: 4, label: "P1" },
      { x: 1, y: 4, label: "P2" },
      { x: 3, y: -2, label: "P3" },
    ],
  };
  controlPoints = pointsMap[currentCurveType].map((p) => ({
    x: p.x * gridSpacing,
    y: p.y * gridSpacing,
    label: p.label,
  }));
};

// Snap en værdi til grid, hvis inden for threshold
const snapToGrid = (value) => {
  const snapped = Math.round(value / gridSpacing) * gridSpacing;
  return Math.abs(value - snapped) < snappingThreshold ? snapped : value;
};

// Tegn gridlinjer
const drawGrid = () => {
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;
  for (let i = -canvas.width / 2; i <= canvas.width / 2; i += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(i, -canvas.height / 2);
    ctx.lineTo(i, canvas.height / 2);
    ctx.stroke();
  }
  for (let j = -canvas.height / 2; j <= canvas.height / 2; j += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(-canvas.width / 2, j);
    ctx.lineTo(canvas.width / 2, j);
    ctx.stroke();
  }
};

// Tegn akser med labels
const drawAxes = () => {
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  // X og Y akser
  ["X", "Y"].forEach((axis) => {
    ctx.beginPath();
    ctx.moveTo(
      axis === "X" ? -canvas.width / 2 : 0,
      axis === "Y" ? -canvas.height / 2 : 0
    );
    ctx.lineTo(
      axis === "X" ? canvas.width / 2 : 0,
      axis === "Y" ? canvas.height / 2 : 0
    );
    ctx.stroke();
  });

  // Labels
  ctx.save();
  ctx.scale(1, -1);
  ctx.fillStyle = "#000000";
  ctx.font = "12px Arial";
  for (let i = 1; i < canvas.width / gridSpacing; i++) {
    ctx.fillText(formatNumber(i), i * gridSpacing, 15);
    ctx.fillText(formatNumber(-i), -i * gridSpacing, 15);
  }
  for (let j = 1; j < canvas.height / gridSpacing; j++) {
    ctx.fillText(formatNumber(j), 5, -j * gridSpacing + 3);
    ctx.fillText(formatNumber(-j), 5, j * gridSpacing + 3);
  }
  ctx.restore();
};

// Tegn kontrolpunkter og labels
const drawControlPoints = () => {
  controlPoints.forEach(({ x, y, label }) => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.save();
    ctx.scale(1, -1);
    ctx.fillText(label, x + 7, -y + 5);
    ctx.restore();
  });
};

// Tegn linjer mellem kontrolpunkter
const drawControlLines = () => {
  if (controlPoints.length < 2) return;
  ctx.strokeStyle = "gray";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(controlPoints[0].x, controlPoints[0].y);
  controlPoints.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.stroke();
};

// Tegn Bezier-kurven baseret på kurvetype
const drawBezierCurve = () => {
  if (controlPoints.length < 2) return;
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(controlPoints[0].x, controlPoints[0].y);

  switch (currentCurveType) {
    case "linear":
      ctx.lineTo(controlPoints[1].x, controlPoints[1].y);
      break;
    case "quadratic":
      ctx.quadraticCurveTo(
        controlPoints[1].x,
        controlPoints[1].y,
        controlPoints[2].x,
        controlPoints[2].y
      );
      break;
    case "cubic":
    default:
      ctx.bezierCurveTo(
        controlPoints[1].x,
        controlPoints[1].y,
        controlPoints[2].x,
        controlPoints[2].y,
        controlPoints[3].x,
        controlPoints[3].y
      );
      break;
  }
  ctx.stroke();
};

// Generer LaTeX-formel
const generateFormula = () => {
  const points = controlPoints.map((p) => ({
    x: p.x / gridSpacing,
    y: p.y / gridSpacing,
  }));
  const formattedPoints = points.map(
    (p) => `(${formatNumber(p.x)}, ${formatNumber(p.y)})`
  );

  let formula;
  switch (currentCurveType) {
    case "linear":
      formula = `\\[ \\mathbf{B}(t) = (1-t)${formattedPoints[0]} + t${formattedPoints[1]}, \\quad 0 \\leq t \\leq 1 \\]`;
      break;
    case "quadratic":
      formula = `\\[ \\mathbf{B}(t) = (1-t)^2${formattedPoints[0]} + 2(1-t)t${formattedPoints[1]} + t^2${formattedPoints[2]}, \\quad 0 \\leq t \\leq 1 \\]`;
      break;
    case "cubic":
    default:
      formula = `\\[ \\mathbf{B}(t) = (1-t)^3${formattedPoints[0]} + 3(1-t)^2t${formattedPoints[1]} + 3(1-t)t^2${formattedPoints[2]} + t^3${formattedPoints[3]}, \\quad 0 \\leq t \\leq 1 \\]`;
      break;
  }

  formulaContent.innerHTML = formula;
  MathJax.typeset();
};

// Opdater canvas og formel
const updateCanvas = () => {
  ctx.clearRect(
    -canvas.width / 2,
    -canvas.height / 2,
    canvas.width,
    canvas.height
  );
  drawGrid();
  drawAxes();
  drawControlLines();
  drawBezierCurve();
  drawControlPoints();
  generateFormula();
};

// Initialiser og tegn første gang
initializeControlPoints();
updateCanvas();
