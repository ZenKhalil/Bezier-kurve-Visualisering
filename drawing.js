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
