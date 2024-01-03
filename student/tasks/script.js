"use strict";

import { baseUrl, sendAPI, renderError } from "../../config.js";

class App {
  #container;
  #person;
  #data = {
    status: [],
    startTimes: [],
    timeTaken: [],
    results: [],
    comments: [],
    grades: [],
  };
  #colors = ["pink", "red", "orange", "yellow", "green", "blue"];
  #dateSelector;
  #tasks = [];
  #currentDate;
  #date;
  #overlay;
  #closeModalButton;
  constructor() {
    const self = this;
    const doEverything = async function () {
      try {
        self.#container = document.querySelector(".container");
        self.#overlay = document.querySelector(".overlay");
        self.#closeModalButton = document.querySelector(".close-modal");

        self.#getPerson();
        self.#changeHeading();
        self.#date = self.#currentDate;
        self.#dateSelector = document.querySelector(".date-selector");
        await self.#getTasks();
        await self.#getData();
        self.#generateTable();

        self.#container.addEventListener("click", self.#goToCourse.bind(self));
        self.#dateSelector.addEventListener(
          "keydown",
          self.#getDaysTasks.bind(self)
        );
        // Enforce Schema changes javascript code
        // ADD GRADES TO RECORDS TABLE
        // const records = (await sendAPI("GET", `${baseUrl}/records`)).data
        //   .allRecords;
        // records.forEach(async (record) => {
        //   delete record.initials;
        //   await sendAPI(
        //     "PUT",
        //     `${baseUrl}/records/${record.assignedTo}/${record.taskName}`,
        //     record
        //   );
        // });
        // ADD GRADES TO TASKS TABLE
        // const tasks = (await sendAPI("GET", `${baseUrl}/tasks`)).data
        //   .allRecords;
        // tasks.forEach(async (record) => {
        //   delete record.statuses;
        //   delete record.startTimes;
        //   delete record.timeTaken;
        //   delete record.results;
        //   delete record.comments;
        //   delete record.grades;
        //   await sendAPI(
        //     "PUT",
        //     `${baseUrl}/tasks/${record.assignedTo}/${record.date
        //       .split("/")
        //       .join("-")}`,
        //     record
        //   );
        // });
        self.#closeModalButton.addEventListener(
          "click",
          self.#closeModal.bind(self)
        );
        self.#overlay.addEventListener("click", self.#closeModal.bind(self));
      } catch (err) {
        renderError(self.#container, err);
        console.error(err);
      }
    };
    doEverything();
  }

  #getPerson() {
    this.#person = window.location.href.split("?").slice(-1)[0];
  }

  #changeHeading() {
    const h1 = document.querySelector("h1");
    this.#currentDate = `${`${new Date().getMonth() + 1}`.padStart(
      2,
      "0"
    )}/${`${new Date().getDate()}`.padStart(
      2,
      "0"
    )}/${new Date().getFullYear()}`;
    let formattedDate = this.#currentDate.split("/");
    formattedDate = `${formattedDate[2]}-${formattedDate[0]}-${formattedDate[1]}`;
    h1.innerHTML = `${
      this.#person
    }'s todo tasks for the day <input type="date" class="date-selector" value="${formattedDate}" max="${formattedDate}">`;
  }

  async #getTasks() {
    try {
      this.#tasks = (
        await sendAPI("GET", `${baseUrl}/positions/${this.#person}`)
      ).data.tasks[0].tasks.reverse();
    } catch (err) {
      throw err;
    }
  }

  async #getData() {
    try {
      Object.keys(this.#data).forEach((key) => (this.#data[key] = []));
      const res = this.#tasks.map((task) =>
        sendAPI("GET", `${baseUrl}/records/${this.#person}/${task}`)
      );
      const data = await Promise.all(res);
      const filteredData = data.map((obj) => obj.data.records[0]);
      this.#tasks.forEach((_, i) => {
        const datesIndexes = filteredData[i].dates
          .map((date, i) => (date === this.#date ? i : -1))
          .filter((index) => index >= 0);
        Object.keys(this.#data).forEach((key) => {
          const datas = datesIndexes.map(
            (index) => filteredData[i][key][index]
          );
          if (datas.length === 0 && key === "status")
            this.#data[key].push(["Moved"]);
          else if (datas.length === 0) this.#data[key].push([""]);
          else this.#data[key].push(datas);
        });
      });
      if (this.#data["status"].flat().every((el) => el !== "Incomplete")) {
        await this.#completeDaysTasks();
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async #getDaysTasks(e) {
    try {
      if (e.key !== "Enter") return;
      const spinner = document.querySelector(".spinner-grow");
      spinner.classList.remove("hidden");
      this.#date = e.currentTarget.value.split("-");
      this.#date = `${this.#date[1]}/${this.#date[2]}/${this.#date[0]}`;
      const formattedDate = this.#date.split("/").join("-");
      const data = (
        await sendAPI(
          "GET",
          `${baseUrl}/tasks/${this.#person}/${formattedDate}`
        )
      ).data.requestedDateTask[0];

      if (!data) {
        if (this.#date === this.#currentDate) location.reload();
        else {
          const dataTasks = document.querySelector(".tasks");
          dataTasks.innerHTML = "";
          dataTasks.insertAdjacentHTML(
            "afterbegin",
            `<div>No records for ${this.#date}.</div>`
          );
          spinner.classList.add("hidden");
        }
      } else {
        this.#tasks = data.tasks;
        await this.#getData();
        this.#generateTable();
      }
    } catch (err) {
      throw err;
    }
  }

  #generateTable() {
    const spinner = document.querySelector(".spinner-grow");
    spinner.classList.add("hidden");
    const data = document.querySelector(".tasks");
    data.innerHTML = "";
    this.#tasks.forEach((task, i) => {
      const currentIndex = this.#tasks.length - i;
      const grades = this.#data.grades[i];
      let markup = "";
      Object.keys(this.#data).forEach((key) => {
        if (key === "grades") return;
        let string = "";
        let countOfString = 0;
        let flag = true;
        this.#data[key][i].forEach((piece, index) => {
          if (!flag) return;
          countOfString += piece.length;
          if (countOfString > 12) {
            if (index > 0) {
              piece = `${piece.substring(
                0,
                countOfString - piece.length - 3
              )}...`;
            } else {
              console.log("INSIDE ELSE");
              piece = piece.substring(0, 12) + "...";
            }
            flag = false;
          }
          string += `<span class="color-${
            this.#colors[grades[index]]
          }">${piece}</span> / `;
        });
        string = string.substring(0, string.length - 2);
        markup += `<div class="col col-1 ${key} container-rows" id="${key}">${string}</div>`;
      });
      data.insertAdjacentHTML(
        "afterbegin",
        `<div class="row justify-content-center linkclass container-rows" style="margin-top: ${
          currentIndex === 1 ? "65px" : "0px"
        }">
           <div class="col col-1 number container-rows">${currentIndex}</div>
           <div class="col col-2 task container-rows">${
             task.length > 10 ? `${task.substring(0, 9)}...` : task
           }</div>
           ${markup}
         </div>`
      );
    });
    document.querySelector(".js-class").style.width = `${
      this.#container.offsetWidth
    }px`;
    document.querySelector(".header").style.width = `${
      this.#container.offsetWidth
    }px`;
  }

  #openModal(text) {
    const modal = document.querySelector(".my-modal");
    const overlay = document.querySelector(".overlay");
    modal.classList.remove("hidden");
    overlay.classList.remove("hidden");
    modal.querySelector(".text-content").innerHTML = text;
  }

  #closeModal() {
    this.#overlay.classList.add("hidden");
    const modal = document.querySelector(".my-modal");
    modal.classList.add("hidden");
  }

  #goToCourse(e) {
    if (!e.target.closest(".col")) return;
    if (e.target.closest(".header")) return;
    let currentIndex = 0;
    for (
      let i = 0;
      document.querySelector(".tasks").children.item(i) !==
      e.target.closest(".row");
      i++
    )
      currentIndex = i + 1;
    currentIndex = this.#tasks.length - currentIndex - 1;
    if (e.target.closest(".number")) {
      const taskName = this.#tasks[currentIndex].split(" ").join("%");
      const url = `${window.location.href.split("/")[0]}//${
        window.location.href.split("/")[2]
      }/student/tasks/course/index.html?${window.location.href
        .split("?")
        .slice(1, 2)}+${taskName}`;
      window.open(url, "_blank");
    } else {
      const column = e.target.closest(".col");
      if (!column.textContent.trim().includes("...")) return;
      if (column.classList.contains("task"))
        this.#openModal(this.#tasks[currentIndex]);
      else
        this.#openModal(
          this.#createSubstring(
            this.#data[column.id][currentIndex],
            this.#data.grades[currentIndex]
          )
        );
    }
  }

  #createSubstring(arr, grades) {
    let substr = "";
    arr.forEach((sub) => (substr += `${sub} / `));
    substr = substr.substring(0, substr.length - 2);
    substr = substr
      .substring(0, substr.length - 1)
      .split("/")
      .map(
        (status, i) =>
          `<span class="color-${
            grades ? this.#colors[grades[i]] : ""
          }">${status}</span>`
      )
      .join("/");
    return substr;
  }

  async #completeDaysTasks() {
    try {
      const formattedDate = this.#date.split("/").join("-");
      await sendAPI(
        "PUT",
        `${baseUrl}/tasks/${this.#person}/${formattedDate}`,
        {
          assignedTo: this.#person,
          date: this.#date,
          tasks: this.#tasks,
        }
      );
    } catch (err) {
      throw err;
    }
  }
}

const app = new App();
