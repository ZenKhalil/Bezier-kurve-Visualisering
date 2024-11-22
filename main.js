const canvas = document.getElementById("bezierCanvas");
const bezierCanvasElement = document.getElementById("bezierCanvas");

// Konstanter
const gridSpacing = 50; // Juster denne værdi efter behov
const snappingThreshold = 10;

// Zoom Variabler
let scale = 1;
const scaleFactor = 1.1;

// BezierCurve Klasse
class BezierCurve {
  constructor(controlPoints, type = "cubic") {
    this.controlPoints = controlPoints; // Array of points {x, y, label}
    this.type = type; // 'linear', 'quadratic', 'cubic'
  }

  draw(ctx) {
    if (this.controlPoints.length < 2) return;

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.controlPoints[0].x, this.controlPoints[0].y);

    switch (this.type) {
      case "linear":
        ctx.lineTo(this.controlPoints[1].x, this.controlPoints[1].y);
        break;
      case "quadratic":
        if (this.controlPoints.length < 3) return;
        ctx.quadraticCurveTo(
          this.controlPoints[1].x,
          this.controlPoints[1].y,
          this.controlPoints[2].x,
          this.controlPoints[2].y
        );
        break;
      case "cubic":
      default:
        if (this.controlPoints.length < 4) return;
        ctx.bezierCurveTo(
          this.controlPoints[1].x,
          this.controlPoints[1].y,
          this.controlPoints[2].x,
          this.controlPoints[2].y,
          this.controlPoints[3].x,
          this.controlPoints[3].y
        );
        break;
    }

    ctx.stroke();
  }

  // Funktion til at formatere et punkt som (x, y)
  formatPoint(p) {
    return `(${p.x}, ${p.y})`;
  }

  generateFormula() {
    const points = this.controlPoints.map((p) => ({
      x: formatNumber(p.x / gridSpacing),
      y: formatNumber(p.y / gridSpacing),
    }));

    // Debugging: Sørg for, at punkterne er korrekt formaterede
    console.log(points);

    let formula = "";
    switch (this.type) {
      case "linear":
        formula = `\\[ \\mathbf{B}(t) = (1-t)${this.formatPoint(
          points[0]
        )} + t${this.formatPoint(points[1])}, \\quad 0 \\leq t \\leq 1 \\]`;
        break;
      case "quadratic":
        formula = `\\[ \\mathbf{B}(t) = (1-t)^2${this.formatPoint(
          points[0]
        )} + 2(1-t)t${this.formatPoint(points[1])} + t^2${this.formatPoint(
          points[2]
        )}, \\quad 0 \\leq t \\leq 1 \\]`;
        break;
      case "cubic":
      default:
        formula = `\\[ \\mathbf{B}(t) = (1-t)^3${this.formatPoint(
          points[0]
        )} + 3(1-t)^2t${this.formatPoint(
          points[1]
        )} + 3(1-t)t^2${this.formatPoint(points[2])} + t^3${this.formatPoint(
          points[3]
        )}, \\quad 0 \\leq t \\leq 1 \\]`;
        break;
    }

    return formula;
  }
}

// BezierSpline Klasse
class BezierSpline {
  constructor() {
    this.curves = []; // Array of BezierCurve instances
  }

  addCurve(bezierCurve) {
    this.curves.push(bezierCurve);
  }

  draw(ctx) {
    this.curves.forEach((curve) => curve.draw(ctx));
  }

  generateFormulas() {
    let formulas = [];
    if (
      this.curves.length === 4 &&
      this.curves.every((curve) => curve.type === "cubic")
    ) {
      // Antag at det er en Bezier Spline hvis der er fire kubiske kurver
      formulas.push("<b>Bezier Spline:</b>");
      this.curves.forEach((curve, index) => {
        formulas.push(`Kurve ${index + 1}: ${curve.generateFormula()}`);
      });
    } else {
      // For andre tilfælde, vis enkeltkurver
      this.curves.forEach((curve, index) => {
        formulas.push(`Kurve ${index + 1}: ${curve.generateFormula()}`);
      });
    }
    return formulas.join("<br>");
  }
}

const bezierCanvas = document.getElementById("bezierCanvas");
const ctx = bezierCanvas.getContext("2d");
const curveTypeSelect = document.getElementById("curveType");
const formulaContent = document.getElementById("formulaContent");
const saveButton = document.getElementById("saveButton");
const zoomInButton = document.getElementById("zoomInButton");
const zoomOutButton = document.getElementById("zoomOutButton");

// Gør variabler tilgængelige globalt via window
window.zoomInButton = zoomInButton;
window.zoomOutButton = zoomOutButton;

// Initialiser BezierSpline
let bezierSpline = new BezierSpline();

// Initial kurvetype
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
    "bezier-spline": [
      // Ny Case for Bezier Spline
      // Kurve 1
      [
        { x: -1, y: 2, label: "P0" },
        { x: -1, y: 0, label: "P1" },
        { x: 1, y: 0, label: "P2" },
        { x: 1, y: 2, label: "P3" },
      ],
      // Kurve 2
      [
        { x: 1, y: 2, label: "P3" }, // Starter hvor Kurve 1 slutter
        { x: 1, y: 4, label: "P4" },
        { x: -3, y: 4, label: "P5" },
        { x: -3, y: 2, label: "P6" },
      ],
      // Kurve 3
      [
        { x: -3, y: 2, label: "P6" }, // Starter hvor Kurve 2 slutter
        { x: -4, y: 2, label: "P7" },
        { x: -4, y: -2, label: "P8" },
        { x: -3, y: -2, label: "P9" },
      ],
      // Kurve 4
      [
        { x: -3, y: -2, label: "P9" }, // Starter hvor Kurve 3 slutter
        { x: 2, y: -2, label: "P10" },
        { x: 2, y: -1, label: "P11" },
        { x: -3, y: -1, label: "P12" },
      ],
    ],
  };

  // Clear existing curves
  bezierSpline.curves = [];

  if (currentCurveType === "bezier-spline") {
    // Tilføj alle fire kurver for Bezier Spline
    pointsMap["bezier-spline"].forEach((controlPoints, index) => {
      const scaledPoints = controlPoints.map((p, i) => ({
        x: p.x * gridSpacing,
        y: p.y * gridSpacing,
        label: p.label,
      }));
      const curve = new BezierCurve(scaledPoints, "cubic");
      bezierSpline.addCurve(curve);
    });
  } else {
    // Add the initial curve for other types
    const initialCurve = new BezierCurve(
      pointsMap[currentCurveType].map((p) => ({
        x: p.x * gridSpacing,
        y: p.y * gridSpacing,
        label: p.label,
      })),
      currentCurveType
    );
    bezierSpline.addCurve(initialCurve);
  }
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

  // Beregn synligt område i verdenskoordinater
  const left = -canvas.width / 2 / scale;
  const right = canvas.width / 2 / scale;
  const bottom = -canvas.height / 2 / scale;
  const top = canvas.height / 2 / scale;

  // Beregn startpunkter for gridlinjer
  const startX = Math.floor(left / gridSpacing) * gridSpacing;
  const endX = Math.ceil(right / gridSpacing) * gridSpacing;
  const startY = Math.floor(bottom / gridSpacing) * gridSpacing;
  const endY = Math.ceil(top / gridSpacing) * gridSpacing;

  // Tegn vertikale gridlinjer
  for (let x = startX; x <= endX; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, top);
    ctx.stroke();
  }

  // Tegn horisontale gridlinjer
  for (let y = startY; y <= endY; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
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
      axis === "X" ? -canvas.width / 2 / scale : 0,
      axis === "Y" ? -canvas.height / 2 / scale : 0
    );
    ctx.lineTo(
      axis === "X" ? canvas.width / 2 / scale : 0,
      axis === "Y" ? canvas.height / 2 / scale : 0
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
  bezierSpline.curves.forEach((curve, curveIndex) => {
    curve.controlPoints.forEach(({ x, y, label }) => {
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
  });
};

// Tegn linjer mellem kontrolpunkter
const drawControlLines = () => {
  bezierSpline.curves.forEach((curve, curveIndex) => {
    if (curve.controlPoints.length < 2) return;
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(curve.controlPoints[0].x, curve.controlPoints[0].y);
    curve.controlPoints.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  });
};

// Tegn Bezier-spline
const drawSpline = () => {
  bezierSpline.draw(ctx);
};

// Generer LaTeX-formler for alle kurver
const generateFormulas = () => {
  const formulas = bezierSpline.generateFormulas();
  formulaContent.innerHTML = formulas;
  MathJax.typeset();
};

// Opdater canvas og formler
const updateCanvas = () => {
  ctx.save();
  // Reset transformations
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Anvend skalering og translation
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(scale, -scale); // Inverter y-aksen

  // Tegn alle elementer
  drawGrid();
  drawAxes();
  drawControlLines();
  drawSpline();
  drawControlPoints();

  ctx.restore();
  generateFormulas();
};

// Tilføj en ny Bezier-kurve til splinen
const addCurve = () => {
  if (currentCurveType === "bezier-spline") {
    alert("Kan ikke tilføje individuelle kurver, når Bezier Spline er valgt.");
    return;
  }

  if (bezierSpline.curves.length === 0) return;

  const lastCurve = bezierSpline.curves[bezierSpline.curves.length - 1];
  const lastPoint = lastCurve.controlPoints[lastCurve.controlPoints.length - 1];

  let newControlPoints = [];

  // Funktion til at beregne den forrige tangent baseret på kurvetypen
  const getPreviousTangent = (curve) => {
    const cp = curve.controlPoints;
    switch (curve.type) {
      case "linear":
        return {
          x: cp[1].x - cp[0].x,
          y: cp[1].y - cp[0].y,
        };
      case "quadratic":
        return {
          x: cp[2].x - cp[1].x,
          y: cp[2].y - cp[1].y,
        };
      case "cubic":
      default:
        return {
          x: cp[3].x - cp[2].x,
          y: cp[3].y - cp[2].y,
        };
    }
  };

  // Beregn den nye start tangent
  const prevTangent = getPreviousTangent(lastCurve);
  const tangentLength = Math.sqrt(prevTangent.x ** 2 + prevTangent.y ** 2);

  // Normaliser tangenten
  const normalizedTangent = {
    x: prevTangent.x / tangentLength,
    y: prevTangent.y / tangentLength,
  };

  // Bestem skala for tangentens længde (juster efter behov)
  const tangentScale = 1; // Ændr denne værdi for at justere tangentens længde

  // Beregn den nye tangent
  const newTangent = {
    x: normalizedTangent.x * tangentScale * gridSpacing,
    y: normalizedTangent.y * tangentScale * gridSpacing,
  };

  switch (currentCurveType) {
    case "linear":
      // Lineær kurve med C1-kontinuitet
      newControlPoints = [
        {
          x: lastPoint.x,
          y: lastPoint.y,
          label: `P${
            bezierSpline.curves.flatMap((c) => c.controlPoints).length
          }`,
        },
        {
          x: lastPoint.x + newTangent.x,
          y: lastPoint.y + newTangent.y,
          label: `P${
            bezierSpline.curves.flatMap((c) => c.controlPoints).length + 1
          }`,
        },
      ];
      break;

    case "quadratic":
      // Kvadratisk kurve med C1-kontinuitet
      // Beregn det første kontrolpunkt baseret på tangenten
      const newControlPoint = {
        x: lastPoint.x + newTangent.x,
        y: lastPoint.y + newTangent.y,
      };

      // Definer et slutpunkt (kan tilpasses efter behov)
      const endPointQuadratic = {
        x: lastPoint.x + 3 * gridSpacing,
        y: lastPoint.y + 3 * gridSpacing,
      };

      newControlPoints = [
        {
          x: lastPoint.x,
          y: lastPoint.y,
          label: `P${
            bezierSpline.curves.flatMap((c) => c.controlPoints).length
          }`,
        },
        {
          x: newControlPoint.x,
          y: newControlPoint.y,
          label: `P${
            bezierSpline.curves.flatMap((c) => c.controlPoints).length + 1
          }`,
        },
        {
          x: endPointQuadratic.x,
          y: endPointQuadratic.y,
          label: `P${
            bezierSpline.curves.flatMap((c) => c.controlPoints).length + 2
          }`,
        },
      ];
      break;

    case "cubic":
    default:
      // Kubisk kurve med C1-kontinuitet
      const previousP2 =
        lastCurve.controlPoints[lastCurve.controlPoints.length - 2];
      const newP1 = {
        x: lastPoint.x + prevTangent.x,
        y: lastPoint.y + prevTangent.y,
      };

      newControlPoints = [
        // P0 er samme som den sidste kurves P3
        {
          x: lastPoint.x,
          y: lastPoint.y,
          label: lastPoint.label, // Bevar den samme etiket
        },
        {
          x: newP1.x,
          y: newP1.y,
          label: `P${
            bezierSpline.curves.flatMap((c) => c.controlPoints).length + 1
          }`,
        },
        {
          x: lastPoint.x + 1 * gridSpacing,
          y: lastPoint.y + 4 * gridSpacing,
          label: `P${
            bezierSpline.curves.flatMap((c) => c.controlPoints).length + 2
          }`,
        },
        {
          x: lastPoint.x + 3 * gridSpacing,
          y: lastPoint.y - 2 * gridSpacing,
          label: `P${
            bezierSpline.curves.flatMap((c) => c.controlPoints).length + 3
          }`,
        },
      ];
      break;
  }

  // Opret og tilføj den nye kurve
  const newCurve = new BezierCurve(newControlPoints, currentCurveType);
  bezierSpline.addCurve(newCurve);
  updateCanvas();
};

// Zoom funktioner
const zoomIn = () => {
  if (scale < 5) {
    // Maksimal zoom ind
    scale *= scaleFactor;
    updateCanvas();
  }
};

const zoomOut = () => {
  if (scale > 0.2) {
    // Minimal zoom ud
    scale /= scaleFactor;
    updateCanvas();
  }
};

// Juster canvas' størrelse baseret på containerens størrelse
const canvasWrapper = document.getElementById("canvasWrapper");

const resizeCanvas = () => {
  bezierCanvas.width = canvasWrapper.clientWidth;
  bezierCanvas.height = canvasWrapper.clientHeight;

  // Genopret transformationerne efter resize
  updateCanvas();
};

// Kald resizeCanvas ved vinduesstørrelsesændring
window.addEventListener("resize", resizeCanvas);

// Initialiser og tegn første gang
initializeControlPoints();
resizeCanvas();

// Eksport af addCurve og zoom funktioner for brug i events.js
window.addCurve = addCurve;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
