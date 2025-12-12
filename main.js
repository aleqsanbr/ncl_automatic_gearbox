import { CarSimulator } from './car-simulator.js';
import { Gauge } from './gauges.js';

let car = new CarSimulator();
let speedGauge, rpmGauge;
let lastTime = Date.now();
let gearDisplay;

const init = () => {
  speedGauge = new Gauge('speedGauge', 220, 'km/h', false);
  rpmGauge = new Gauge('rpmGauge', 8000, 'RPM', true);
  gearDisplay = document.getElementById('gearDisplay');

  document.getElementById('btnDrive').classList.add('active');

  document.getElementById('btnDrive').addEventListener('click', () => setMode('D'));
  document.getElementById('btnSport').addEventListener('click', () => setMode('S'));

  const gasSlider = document.getElementById('gasSlider');
  const brakeSlider = document.getElementById('brakeSlider');

  gasSlider.addEventListener('input', (e) => {
    car.setThrottle(parseFloat(e.target.value));
    if (car.throttle > 0) {
      brakeSlider.value = 0;
    }
  });

  brakeSlider.addEventListener('input', (e) => {
    car.setBrake(parseFloat(e.target.value));
    if (car.brake > 0) {
      gasSlider.value = 0;
    }
  });

  document.addEventListener('keydown', handleKeyboard);

  animate();
};

const setMode = (mode) => {
  car.setMode(mode);

  if (mode === 'D') {
    document.getElementById('btnDrive').classList.add('active');
    document.getElementById('btnSport').classList.remove('active');
  } else {
    document.getElementById('btnDrive').classList.remove('active');
    document.getElementById('btnSport').classList.add('active');
  }
};

const handleKeyboard = (e) => {
  const gasSlider = document.getElementById('gasSlider');
  const brakeSlider = document.getElementById('brakeSlider');

  switch(e.key.toLowerCase()) {
    case 'z':
      car.setThrottle(Math.max(0, car.throttle - 2));
      gasSlider.value = car.throttle;
      if (car.throttle > 0) {
        brakeSlider.value = 0;
      }
      break;
    case 'x':
      car.setThrottle(Math.min(100, car.throttle + 2));
      gasSlider.value = car.throttle;
      if (car.throttle > 0) {
        brakeSlider.value = 0;
      }
      break;
    case ',':
    case '<':
      car.setBrake(Math.max(0, car.brake - 5));
      brakeSlider.value = car.brake;
      if (car.brake > 0) {
        gasSlider.value = 0;
      }
      break;
    case '.':
    case '>':
      car.setBrake(Math.min(100, car.brake + 5));
      brakeSlider.value = car.brake;
      if (car.brake > 0) {
        gasSlider.value = 0;
      }
      break;
  }
};

const animate = () => {
  const now = Date.now();
  const deltaTime = now - lastTime;
  lastTime = now;

  const result = car.update(deltaTime);

  speedGauge.draw(car.speed);
  rpmGauge.draw(car.rpm);

  if (result) {
    gearDisplay.textContent = car.fuzzy.currentGear;
  } else {
    gearDisplay.textContent = '1';
  }

  requestAnimationFrame(animate);
};

document.addEventListener('DOMContentLoaded', init);
