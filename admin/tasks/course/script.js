"use strict";

import { baseUrl, renderError, sendAPI } from "../../../config.js";
import Course from "../../../course.js";

class Tasks extends Course {
  #addRecordButton;
  #form;

  constructor() {
    super(1);

    this.#form = document.querySelector("form");
    this.#addRecordButton = document.querySelector(".add-records");

    this.#addRecordButton.addEventListener("click", this.#addRecord.bind(this));
    this.table.addEventListener("mouseover", this.#showEditButton.bind(this));
    this.table.addEventListener("mouseout", this.#hideEditButton.bind(this));
    this.table.addEventListener("click", this.#editRecord.bind(this));
  }

  #addRecord() {
    let addingAfter;
    const datePickerDate = this.#createDatePickerDate(this.currentDate);
    if (this.sorted) addingAfter = this.headingRow;
    else addingAfter = this.table.lastChild;
    addingAfter.insertAdjacentHTML(
      "afterend",
      `<tr>
  <td>
  <input type="date" class="adding-date" name="dates" value=${datePickerDate} min="${datePickerDate}">
  </td>
     <td><textarea name="works"></textarea></td>
   </tr>`
    );
    const inputDate = document.querySelector(".adding-date");
    inputDate.focus();
    this.#form.addEventListener("submit", this.#saveRecord.bind(this));
  }

  #showEditButton(e) {
    const dateCell = e.target.closest(".dates");
    if (!dateCell) return;
    if (dateCell.closest("tr").classList.contains("table-row-inactive")) return;
    const editButton = dateCell.querySelector(".edit-button");
    if (!editButton) return;
    editButton.classList.remove("hidden");
  }

  #editRecord(e) {
    const editButton = e.target.closest(".edit-button");
    if (!editButton) return;
    const tableRow = editButton.closest("tr");
    const currentDate = tableRow.querySelector(".dates").textContent.trim();
    const datePickerDate = this.#createDatePickerDate(currentDate);
    const currentDatePickerDate = this.#createDatePickerDate(this.currentDate);
    tableRow.querySelector(
      ".dates"
    ).innerHTML = `<input type="date" class="adding-date" value=${datePickerDate} min="${currentDatePickerDate}" name="dates">`;
    tableRow.querySelector(
      ".works"
    ).innerHTML = `<textarea name="works"></textarea>`;
    const inputDate = document.querySelector(".adding-date");
    inputDate.focus();
    this.#form.addEventListener("submit", this.#saveRecord.bind(this));
  }

  #createDatePickerDate(date) {
    const formattedDate = `${date.split("/")[2]}-${date.split("/")[0]}-${
      date.split("/")[1]
    }`;
    return formattedDate;
  }

  async #saveRecord(e) {
    try {
      e.preventDefault();
      const data = Object.fromEntries([...new FormData(this.#form)]);
      if (Object.values(data).some((el) => el === "")) return;
      data.dates = `${data.dates.split("-")[1]}/${data.dates.split("-")[2]}/${
        data.dates.split("-")[0]
      }`;
      let currentIndex;
      const closestTbody = e.target
        .querySelector(".adding-date")
        .closest("tbody");
      if (
        Array.from(this.table.children).some(
          (el) => el.querySelector("tr")?.children.length === 2
        )
      ) {
        currentIndex = this.data.dates.length;
        Object.keys(this.data).forEach((key) => {
          if (!data[key]) {
            if (key === "status") data[key] = "Incomplete";
            else data[key] = "";
          }
        });
      } else {
        for (let i = 0; this.table.children.item(i) !== closestTbody; i++)
          currentIndex = i;
      }
      if (this.sorted) currentIndex = this.data.dates.length - currentIndex - 1;
      await sendAPI(
        "PATCH",
        `${baseUrl}/records/${this.person}/${this.task}?currentIndex=${currentIndex}`,
        data
      );
      location.reload();
    } catch (err) {
      throw err;
    }
  }

  #hideEditButton(e) {
    const dateCell = e.target.closest(".dates");
    if (!dateCell) return;
    const editButton = dateCell.querySelector(".edit-button");
    if (!editButton) return;
    editButton.classList.add("hidden");
  }
}

const tasks = new Tasks();
