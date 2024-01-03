"use strict";

import { baseUrl, renderError, sendAPI } from "../../../../config.js";

class App {
  #colors = [
    "color-pink",
    "color-red",
    "color-orange",
    "color-yellow",
    "color-green",
    "color-blue",
  ];
  #gradesText;
  #statusText;
  #currentIndex;
  #person;
  #task;

  constructor() {
    const self = this;
    const doEverything = async function () {
      try {
        self.#getPerson();
        self.#getTask();
        self.#getCurrentIndex();

        self.#gradesText = document.querySelector(".grade");
        self.#statusText = document.querySelector(".status");

        self.#gradesText.addEventListener(
          "change",
          self.#changeColor.bind(self)
        );
        self.#statusText.addEventListener(
          "change",
          self.#changeGrade.bind(self)
        );
        document.addEventListener("click", self.#saveResults.bind(self));
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

  #getCurrentIndex() {
    this.#currentIndex = +window.location.href
      .split("?")[1]
      .split("+")
      .slice(-1)[0];
  }

  #changeColor() {
    const gradesRow = this.#gradesText.closest("tr");
    gradesRow.removeAttribute("class");
    gradesRow.classList.add(this.#colors[+this.#gradesText.value]);
  }

  #changeGrade() {
    if (this.#statusText.value === "Obsolete") {
      this.#gradesText.disabled = true;
      const option = document.createElement("option");
      option.text = "Obsolete";
      option.value = "1";
      this.#gradesText.add(option, 1);
      this.#gradesText.value = "1";
      this.#changeColor();
      return;
    }
    this.#gradesText.disabled = false;
    this.#gradesText.value = "0";
    if (this.#gradesText.options[1].textContent === "Obsolete")
      this.#gradesText.remove(1);
    this.#changeColor();
  }

  async #saveResults(e) {
    try {
      if (e.target.closest("textarea") || e.target.closest("select")) return;
      const form = document.querySelector(".form-element");
      const data = Object.fromEntries([...new FormData(form)]);
      if (Object.values(data).some((el) => el === "")) return;
      if (!data.grades) data.grades = 1;
      else data.grades = +data.grades;
      await sendAPI(
        "PATCH",
        `${baseUrl}/records/${this.#person}/${this.#task}?currentIndex=${
          this.#currentIndex
        }`,
        data
      );
      close();
    } catch (err) {
      throw err;
    }
  }
}

const app = new App();
