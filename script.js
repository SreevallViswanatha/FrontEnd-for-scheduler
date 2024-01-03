"use strict";

// Make a GET request to the server's API endpoint
// const request = new XMLHttpRequest();
// request.open("GET", "data.json", false);
// request.send();
// const data = JSON.parse(request.responseText);
// console.log(data);

class App {
  #modalBody;
  constructor() {
    this.#modalBody = document.querySelector(".modal-body");
    this.#modalBody.addEventListener("click", this.#goToTasks.bind(this));
  }

  #goToTasks(e) {
    const person = e.target.closest(".person");
    if (!person) return;
    const personName = person.textContent;
    const url = `${window.location.href.split("/")[0]}/${
      personName === "Mom" ? "admin" : "student"
    }/tasks/index.html?${personName}`;
    window.open(url, "_blank");
  }
}

const app = new App();
