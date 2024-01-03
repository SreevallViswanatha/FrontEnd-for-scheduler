let time1 = 0;
let timerId;

self.onmessage = function (e) {
  if (e.data === "startTimer") timerId = setInterval(tick, 1000);
  else clearInterval(timerId);
};

function tick() {
  const text = `${`${Math.trunc(time1 / 3600)}`.padStart(2, 0)}:${`${Math.trunc(
    (time1 / 60) % 60
  )}`.padStart(2, 0)}:${`${time1 % 60}`.padStart(2, 0)}`;
  time1++;
  postMessage(text);
}
