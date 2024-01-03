"use strict";

import { baseUrl, renderError, sendAPI } from "../../../../config.js";

class App {
  #worker1 = new Worker("timer1-worker.js");
  #worker2 = new Worker("timer2-worker.js");
  #person;
  #task;
  #startTimer;
  #pauseTimer;
  #endTimer;
  #startPauseTimerCell;
  #timer1;
  #timer2;
  #accessible = 1;
  #data = {};
  #currentIndex;
  constructor() {
    const self = this;
    const doEverything = async function () {
      try {
        self.#getPerson();
        self.#getTask();
        self.#getCurrentIndex();
        await self.#getData();
        self.#generateList();
        self.#startTimer = document.querySelector(".start-timer");
        self.#pauseTimer = document.querySelector(".pause-timer");
        self.#endTimer = document.querySelector(".end-timer");
        self.#startPauseTimerCell = self.#startTimer.closest("td");
        self.#startTimer.addEventListener(
          "click",
          self.#startTimerHandler.bind(self)
        );
        self.#pauseTimer.addEventListener(
          "click",
          self.#pauseTimerHandler.bind(self)
        );
        self.#endTimer.addEventListener(
          "click",
          self.#endTimerHandler.bind(self)
        );
        self.#startPauseTimerCell.addEventListener(
          "click",
          self.#toggleIcons.bind(self)
        );
      } catch (err) {
        const container = document.querySelector(".container");
        renderError(container, err);
        console.error(err);
      }
    };
    doEverything();
  }

  #getPerson() {
    this.#person = window.location.href.split("?").slice(-1)[0].split("+")[0];
    console.log(this.#person);
  }

  #getTask() {
    this.#task = window.location.href
      .split("?")
      .slice(-1)[0]
      .split("+")[1]
      .split("%")
      .join(" ");
    console.log(this.#task);
  }

  async #getData() {
    try {
      const data = (
        await sendAPI(
          "GET",
          `${baseUrl}/records/${this.#person}/${
            this.#task
          }/?fields=dates,works&currentIndex=${this.#currentIndex}`
        )
      ).data.records;
      if (!data) return;
      this.#data = { ...data };
      console.log(this.#data);
    } catch (err) {
      throw err;
    }
  }

  #getCurrentIndex() {
    this.#currentIndex = +window.location.href
      .split("?")[1]
      .split("+")
      .slice(-1)[0];
  }

  #generateList() {
    const tableBody = document.querySelector("tbody");
    tableBody.insertAdjacentHTML(
      "afterbegin",
      `<tr>
      <td class="starting-cell">Task</td>
      <td>${this.#task}</td>
      </tr>
      <tr>
      <td class="starting-cell">Date</td>
      <td>${this.#data.dates}</td>
      </tr>
      <tr>
      <td class="starting-cell">Work</td>
      <td>${this.#data.works}</td>
      </tr>`
    );
  }

  #startTimerHandler() {
    const timeTaken = document.querySelector(".time-taken");
    if (this.#accessible) {
      const startTime = document.querySelector(".start-time");
      const timeElapsed = document.querySelector(".time-elapsed");
      startTime.value = this.#formatTime(new Date());
      this.#worker1.postMessage("startTimer");
      this.#worker1.onmessage = function (e) {
        timeElapsed.value = e.data;
      };
      this.#endTimer.classList.remove("btn-disable");
      this.#endTimer.disabled = false;
      const workDescriptionElement =
        document.querySelector(".work-description");
      workDescriptionElement.classList.remove("btn-disable");
      workDescriptionElement.disabled = false;
      this.#accessible = 0;
    }
    this.#worker2.postMessage("startTimer");
    this.#worker2.onmessage = function (e) {
      timeTaken.value = e.data;
    };
  }

  #pauseTimerHandler() {
    this.#worker2.postMessage("stopTimer");
  }

  async #endTimerHandler() {
    try {
      const endTime = document.querySelector(".end-time");
      endTime.value = this.#formatTime(new Date());
      clearInterval(this.#timer1);
      clearInterval(this.#timer2);
      this.#startTimer.disabled = true;
      this.#pauseTimer.disabled = true;
      this.#endTimer.disabled = true;
      this.#startTimer.classList.add("btn-disable");
      this.#pauseTimer.classList.add("btn-disable");
      this.#endTimer.classList.add("btn-disable");
      this.#startTimer.classList.remove("hidden");
      this.#pauseTimer.classList.add("hidden");
      document.querySelectorAll("input").forEach((input) => {
        if (input.disabled) input.disabled = false;
      });
      const form = document.querySelector(".form-element");
      const data = Object.fromEntries([...new FormData(form)]);
      console.log(data);
      document.querySelectorAll("input").forEach((input) => {
        if (!input.disabled) input.disabled = true;
      });
      await sendAPI(
        "PATCH",
        `${baseUrl}/records/${this.#person}/${this.#task}/?currentIndex=${
          this.#currentIndex
        }`,
        data
      );
      close();
    } catch (err) {
      throw err;
    }
  }

  #toggleIcons(e) {
    const button = e.target.closest("button");
    if (!button) return;
    if (button.classList.contains("btn-disable")) return;
    this.#startTimer.classList.toggle("hidden");
    this.#pauseTimer.classList.toggle("hidden");
  }

  #formatTime(date) {
    return `${
      date.getHours() > 12 ? date.getHours() - 12 : date.getHours()
    }:${`${date.getMinutes()}`.padStart(2, 0)} ${
      date.getHours() >= 12 ? "PM" : "AM"
    }`;
  }
}

const app = new App();
