// Tilgå eksisterende elementer fra main.js via window
const addCurveButton = document.getElementById("addCurveButton");

// Dragging funktionalitet
let isDragging = false;
let dragCurveIndex = null;
let dragPointIndex = null;

// Funktion til at få verdenskoordinater
const getWorldCoordinates = (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const worldX = (mouseX - canvas.width / 2) / scale;
  const worldY = -(mouseY - canvas.height / 2) / scale;

  return { x: worldX, y: worldY };
};

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

canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getWorldCoordinates(e);

  // Find hvilket kontrolpunkt der er blevet klikket
  for (
    let curveIndex = 0;
    curveIndex < bezierSpline.curves.length;
    curveIndex++
  ) {
    const curve = bezierSpline.curves[curveIndex];
    for (
      let pointIndex = 0;
      pointIndex < curve.controlPoints.length;
      pointIndex++
    ) {
      const point = curve.controlPoints[pointIndex];
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < 10 / scale) {
        // Juster afstand baseret på skala
        isDragging = true;
        dragCurveIndex = curveIndex;
        dragPointIndex = pointIndex;
        return; // Stop efter at have fundet det første match
      }
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDragging || dragCurveIndex === null || dragPointIndex === null) return;

  const { x, y } = getWorldCoordinates(e);

  // Snap til grid
  const snappedX = snapToGrid(x);
  const snappedY = snapToGrid(y);

  // Opdater kontrolpunkter
  bezierSpline.curves[dragCurveIndex].controlPoints[dragPointIndex].x =
    snappedX;
  bezierSpline.curves[dragCurveIndex].controlPoints[dragPointIndex].y =
    snappedY;

  // Hvis det er et delingspunkt mellem kurver, oprethold C1-kontinuitet
  if (
    dragPointIndex ===
    bezierSpline.curves[dragCurveIndex].controlPoints.length - 1
  ) {
    const nextCurve = bezierSpline.curves[dragCurveIndex + 1];
    if (nextCurve) {
      // Opdater nextCurve's P0 til at matche den flyttede P3
      nextCurve.controlPoints[0].x = snappedX;
      nextCurve.controlPoints[0].y = snappedY;

      // Beregn den forrige tangent baseret på den aktuelle kurves type
      const currentCurve = bezierSpline.curves[dragCurveIndex];
      const prevTangent = getPreviousTangent(currentCurve);
      const tangentLength = Math.sqrt(prevTangent.x ** 2 + prevTangent.y ** 2);

      // Håndter tilfælde, hvor tangentLength er 0 for at undgå division med 0
      const normalizedTangent =
        tangentLength !== 0
          ? {
              x: prevTangent.x / tangentLength,
              y: prevTangent.y / tangentLength,
            }
          : { x: 1, y: 0 }; // Standardretning hvis længden er 0

      // Bestem skala for tangentens længde
      const tangentScale = 1; 

      // Beregn den nye tangent
      const newTangent = {
        x: normalizedTangent.x * tangentScale * gridSpacing,
        y: normalizedTangent.y * tangentScale * gridSpacing,
      };

      // Juster nextCurve's P1 baseret på den forrige tangent og kurvetypen
      switch (currentCurve.type) {
        case "linear":
          if (nextCurve.controlPoints.length >= 2) {
            nextCurve.controlPoints[1].x =
              nextCurve.controlPoints[0].x + newTangent.x;
            nextCurve.controlPoints[1].y =
              nextCurve.controlPoints[0].y + newTangent.y;
          }
          break;

        case "quadratic":
          if (nextCurve.controlPoints.length >= 3) {
            // Juster P1 for quadratic kurven
            nextCurve.controlPoints[1].x =
              2 * nextCurve.controlPoints[0].x -
              currentCurve.controlPoints[1].x;
            nextCurve.controlPoints[1].y =
              2 * nextCurve.controlPoints[0].y -
              currentCurve.controlPoints[1].y;
          }
          break;

        case "cubic":
        default:
          if (nextCurve.controlPoints.length >= 2) {
            // Juster P1 for cubic kurven
            nextCurve.controlPoints[1].x =
              2 * nextCurve.controlPoints[0].x -
              currentCurve.controlPoints[2].x;
            nextCurve.controlPoints[1].y =
              2 * nextCurve.controlPoints[0].y -
              currentCurve.controlPoints[2].y;
          }
          break;
      }
    }
  }

  updateCanvas();
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  dragCurveIndex = null;
  dragPointIndex = null;
});
canvas.addEventListener("mouseleave", () => {
  isDragging = false;
  dragCurveIndex = null;
  dragPointIndex = null;
});

// Håndter kurvetype ændring
curveTypeSelect.addEventListener("change", (e) => {
  currentCurveType = e.target.value;
  
  if (currentCurveType === "bezier-spline") {
    addCurveButton.disabled = true; 
  } else {
    addCurveButton.disabled = false; 
  }

  initializeControlPoints();
  updateCanvas();
});

// Gem canvas som billede
saveButton.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "bezier-spline.png";
  // Fjern midlertidigt formel for at gemme ren canvas
  const tempFormula = formulaContent.innerHTML;
  formulaContent.innerHTML = "";
  link.href = bezierCanvas.toDataURL();
  link.click();
  formulaContent.innerHTML = tempFormula;
});

// Tilføj kurve knap
addCurveButton.addEventListener("click", () => {
  addCurve();
});

// Zoom knapper
zoomInButton.addEventListener("click", () => {
  zoomIn();
});

zoomOutButton.addEventListener("click", () => {
  zoomOut();
});

// Implementer zoom via musens scroll
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  },
  { passive: false }
);
