export class Gauge {
  constructor(canvasId, maxValue, unit, isRPM = false) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.maxValue = maxValue;
    this.unit = unit;
    this.isRPM = isRPM;
    this.currentValue = 0;
    this.targetValue = 0;
  }

  draw(value) {
    this.targetValue = value;
    this.currentValue += (this.targetValue - this.currentValue) * 0.15;

    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = 120;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Внешняя обводка
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Деления и цифры
    const startAngle = Math.PI * 0.65;
    const endAngle = Math.PI * 2.35;
    const angleRange = endAngle - startAngle;

    const divisions = this.isRPM ? 8 : 11;

    for (let i = 0; i <= divisions; i++) {
      const angle = startAngle + (angleRange * i) / divisions;
      const isMainDivision = i % 2 === 0;
      const innerRadius = isMainDivision ? radius - 20 : radius - 12;
      const outerRadius = radius - 5;

      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * outerRadius;
      const y2 = centerY + Math.sin(angle) * outerRadius;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = isMainDivision ? 2 : 1;
      ctx.stroke();

      if (isMainDivision) {
        const labelValue = Math.round((this.maxValue * i) / divisions);
        const labelRadius = radius - 35;
        const labelX = centerX + Math.cos(angle) * labelRadius;
        const labelY = centerY + Math.sin(angle) * labelRadius;

        ctx.fillStyle = '#999';
        ctx.font = this.isRPM ? '14px Arial' : '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelValue, labelX, labelY);
      }
    }

    // Красная зона на тахометре
    if (this.isRPM) {
      const redStart = startAngle + (angleRange * 6.5) / 8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 5, redStart, endAngle);
      ctx.strokeStyle = '#e53935';
      ctx.lineWidth = 8;
      ctx.stroke();
    }

    // Стрелка
    const valueAngle = startAngle + (angleRange * this.currentValue) / this.maxValue;
    const needleLength = radius - 25;
    const needleX = centerX + Math.cos(valueAngle) * needleLength;
    const needleY = centerY + Math.sin(valueAngle) * needleLength;

    const needleStartRadius = radius * 0.35;
    const needleStartX = centerX + Math.cos(valueAngle) * needleStartRadius;
    const needleStartY = centerY + Math.sin(valueAngle) * needleStartRadius;

    ctx.beginPath();
    ctx.moveTo(needleStartX, needleStartY);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = '#4dd0e1';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.shadowColor = '#4dd0e1';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Центральный круг
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
    ctx.strokeStyle = '#4dd0e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(77, 208, 225, 0.1)';
    ctx.fill();

    // Значение внутри круга
    ctx.fillStyle = '#4dd0e1';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayValue = this.isRPM ? Math.round(this.currentValue / 100) / 10 : Math.round(this.currentValue);
    ctx.fillText(displayValue, centerX, centerY - 5);

    // Единица измерения
    ctx.font = '11px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText(this.unit, centerX, centerY + 20);
  }
}
