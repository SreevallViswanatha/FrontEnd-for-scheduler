let time2 = 0;
let timerId;

self.onmessage = function (e) {
  if (e.data === "startTimer") timerId = setInterval(tick, 1000);
  else clearInterval(timerId);
};

function tick() {
  const text = `${`${Math.trunc(time2 / 3600)}`.padStart(2, 0)}:${`${Math.trunc(
    (time2 / 60) % 60
  )}`.padStart(2, 0)}:${`${time2 % 60}`.padStart(2, 0)}`;
  time2++;
  postMessage(text);
}
