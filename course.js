"use strict";

import { baseUrl, renderError, sendAPI } from "../../../config.js";

export default class Course {
  data = {
    dates: [],
    works: [],
    startTimes: [],
    endTimes: [],
    timeElapsed: [],
    timeTaken: [],
    workDescription: [],
    results: [],
    comments: [],
    status: [],
    grades: [],
  };
  #admin;
  #colors = ["pink", "red", "orange", "yellow", "green", "blue"];
  #gradeWorks = [
    "Birdie",
    "Obsolete",
    "Below Avg.",
    "Average",
    "Above Avg.",
    "Excellent",
  ];
  currentDate;
  person;
  #sortButton;
  headingRow;
  table;
  sorted = 1;
  #closeModalButton;
  #overlay;
  constructor(admin = 0) {
    const self = this;
    const doEverything = async function () {
      try {
        self.#admin = admin;
        console.log(self.#admin);
        self.#sortButton = document.querySelector(".sort-button");
        self.headingRow = document.querySelector(".heading-row");
        self.table = document.querySelector("table");
        self.#closeModalButton = document.querySelector(".close-modal");
        self.#overlay = document.querySelector(".overlay");

        self.#sortButton.innerHTML = `Date
    <span>
        <span class="arrow-icon"> &uarr;</span>
        <span class="arrow-icon hidden"> &darr;</span>
    </span>`;

        self.currentDate = self.#createDate(new Date());
        self.#getPerson();
        self.#getTask();
        self.#changeHeading();
        await self.#getData();
        self.#displayTable();

        self.#sortButton.addEventListener("click", self.#sort.bind(self));
        self.table.addEventListener("click", self.#goToResults.bind(self));
        self.#closeModalButton.addEventListener(
          "click",
          self.#closeModal.bind(self)
        );
        self.#overlay.addEventListener("click", self.#closeModal.bind(self));
      } catch (err) {
        const container = document.querySelector("table");
        renderError(container, err);
        console.error(err);
      }
    };
    doEverything();
  }

  #getPerson() {
    this.person = window.location.href.split("?").slice(-1)[0].split("+")[0];
  }

  #getTask() {
    this.task = window.location.href
      .split("?")
      .slice(-1)[0]
      .split("+")[1]
      .split("%")
      .join(" ");
  }

  #changeHeading() {
    const h1 = document.querySelector("h1");
    h1.textContent = this.task;
  }

  #createDate(date) {
    const formattedDate = `${`${date.getMonth() + 1}`.padStart(
      2,
      0
    )}/${`${date.getDate()}`.padStart(2, 0)}/${date.getFullYear()}`;
    return formattedDate;
  }

  async #getData() {
    try {
      const data = (
        await sendAPI("GET", `${baseUrl}/records/${this.person}/${this.task}`)
      ).data.records[0];
      if (!data) return;
      Object.keys(this.data).forEach((key) => {
        this.data[key] = data[key].reverse();
      });
    } catch (err) {
      throw err;
    }
  }

  #displayTable() {
    this.table.innerHTML = "";
    this.table.insertAdjacentElement("afterbegin", this.headingRow);
    this.data.dates.forEach((_, i) => {
      const currentIndex = this.data.dates.length - i - 1;
      const didNotDoText = "";
      let markup = "";
      Object.keys(this.data).forEach((key) => {
        let workingString = "";
        if (key === "grades")
          workingString = this.#gradeWorks[this.data[key][currentIndex]] || "";
        else workingString = this.data[key][currentIndex] || "";
        const string = (
          workingString.length < 11
            ? workingString
            : `
                ${workingString.substring(
                  0,
                  9
                )}... <span style="text-decoration:underline color: blue" class="modal-opener"></span>
              `
        ).trim();
        if (this.#admin && key === "dates")
          markup += `<td class="${key} preserving" id="${key}">${
            string || didNotDoText
          }<button class="edit-button hidden" type="button"><img src="edit.png" class="edit-icon"></button></td>`;
        else
          markup += `<td class="${key} preserving" id="${key}">${
            string || didNotDoText
          }</td>`;
      });
      this.headingRow.insertAdjacentHTML(
        "afterend",
        `<tr class="table-row-${
          this.#checkIfAllowed(
            this.data.dates[currentIndex],
            this.data.results[currentIndex]
          )
            ? ""
            : "in"
        }active color-${this.#colors[this.data.grades[currentIndex]]}">
            ${markup}
          </tr>`
      );
    });
  }

  #checkIfAllowed(date, results) {
    let returning = 1;
    const formattedDate = `${date.split("/")[2]}/${date.split("/")[0]}/${
      date.split("/")[1]
    }`;
    if (new Date(formattedDate) < new Date(this.currentDate)) returning = 0;
    else if (results !== "") returning = 0;
    return returning;
  }

  async #sort(e) {
    try {
      const newArray = this.data.dates
        .map((date, i) => [date, i])
        .sort((a, b) => (new Date(a[0]) > new Date(b[0]) ? -1 : 1));
      console.log(newArray);
      if (
        newArray
          .map((dateArray) => dateArray[0])
          .every((val, index) => val === this.data.dates[index]) ||
        newArray
          .map((dateArray) => dateArray[0])
          .reverse()
          .every((val, index) => val === this.data.dates[index])
      ) {
        const arrowIcons = e.currentTarget.querySelectorAll(".arrow-icon");
        arrowIcons.forEach((arrowIcon) => arrowIcon.classList.toggle("hidden"));
        Object.keys(this.data).forEach((key) => this.data[key].reverse());
        if (this.sorted) this.sorted = 0;
        else this.sorted = 1;
      } else {
        const sortedArray = [];
        Object.keys(this.data).forEach((key, i) => {
          if (key === "dates") return;
          else sortedArray[i - 1] = [];
        });
        newArray.forEach((dateArray, i) => {
          this.data.dates[i] = dateArray[0];
          Object.keys(this.data).forEach((key, index) => {
            if (key === "dates") return;
            else sortedArray[index - 1].push(this.data[key][dateArray[1]]);
          });
        });
        console.log(sortedArray[0][0]);
        Object.keys(this.data).forEach((key, i) => {
          if (key === "dates") return;
          else this.data[key] = sortedArray[i - 1];
        });
        Object.keys(this.data).forEach((key) => this.data[key].reverse());
        await sendAPI(
          "PATCH",
          `${baseUrl}/records/${this.person}/${this.task}`,
          this.data
        );
        Object.keys(this.data).forEach((key) => this.data[key].reverse());
      }
      this.#displayTable();
    } catch (err) {
      throw err;
    }
  }

  #openModal(text) {
    console.log("OPENING MODAL");
    const modal = document.querySelector(".my-modal");
    const overlay = document.querySelector(".overlay");
    modal.classList.remove("hidden");
    overlay.classList.remove("hidden");
    modal.querySelector(".text-content").textContent = text;
  }

  #closeModal() {
    this.#overlay.classList.add("hidden");
    const modal = document.querySelector(".my-modal");
    modal.classList.add("hidden");
  }

  #goToResults(e) {
    if (e.target.closest(".edit-button")) return;
    if (
      e.target.closest("td").querySelector("input") ||
      e.target.closest("td").querySelector("textarea")
    )
      return;
    const tableRow = e.target.closest("tr");
    const excluded = [
      "dates",
      "startTimes",
      "endTimes",
      "timeElapsed",
      "timeTaken",
      "status",
      "grades",
    ];
    const keys = Object.keys(this.data);
    excluded.forEach((el) => keys.splice(keys.indexOf(el), 1));
    let currentIndex;
    for (
      let i = 0;
      this.table.children.item(i) !== e.target.closest("tbody");
      i++
    )
      currentIndex = i;
    if (this.sorted) currentIndex = this.data.dates.length - currentIndex - 1;
    let url;
    const startTime = tableRow.querySelector(".startTimes");
    const elementClicked = e.target.closest("td");
    if (
      keys.find((id) => id === elementClicked.id) &&
      elementClicked.querySelector(".modal-opener")
    ) {
      this.#openModal(
        this.data[elementClicked.id][this.data.dates.length - currentIndex - 1]
      );
      return;
    }
    if (tableRow.classList.contains("table-row-inactive")) return;
    if (tableRow === this.headingRow) return;
    if (!this.#admin) {
      if (startTime.textContent === "") {
        url = `${window.location.href.split("/")[0]}//${
          window.location.href.split("/")[2]
        }/student/tasks/course/enter/index.html?${window.location.href
          .split("?")
          .slice(1, 2)}+${currentIndex}`;
        window.open(url, "_blank");
      }
    } else {
      if (startTime.textContent !== "") {
        url = `${window.location.href
          .split("/")
          .slice(0, -1)
          .join("/")}/results/index.html?${
          window.location.href.split("?")[1]
        }+${currentIndex}`;
        window.open(url, "_blank");
      }
    }
  }
}
