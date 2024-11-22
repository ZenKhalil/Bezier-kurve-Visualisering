// Hjælpefunktion til at formatere tal
const formatNumber = (num) =>
  Number.isInteger(num) ? `${num}` : `${num.toFixed(1)}`;

// BezierCurve Klasse
class BezierCurve {
  constructor(controlPoints, type = "cubic") {
    this.controlPoints = controlPoints; // Array af punkter {x, y, label}
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
    this.curves = []; // Array af BezierCurve instanser
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
