import Sortable from "../../node_modules/sortablejs/modular/sortable.complete.esm.js";
import { baseUrl, renderError, sendAPI } from "../../config.js";

class App {
  #data = {
    Shandilya: {
      currentTasks: [],
      savedForLaterTasks: [],
      completedTasks: [],
    },
    Aaditya: {
      currentTasks: [],
      savedForLaterTasks: [],
      completedTasks: [],
    },
  };
  #container;
  #addNewTaskButtons;
  constructor() {
    const self = this;
    const doEverything = async function () {
      try {
        self.#container = document.querySelector(".container");
        await self.#getTasks();
        self.#displayTasks();
        self.#enableDragging();
        self.#addNewTaskButtons = document.querySelectorAll(".add-new-task");

        self.#addNewTaskButtons.forEach((button) =>
          button.addEventListener("click", self.#addTask.bind(self))
        );
        self.#container.addEventListener("click", self.#showTasks);
        self.#container.addEventListener(
          "click",
          self.#goToResultsOrEdit.bind(self)
        );
      } catch (err) {
        renderError(self.#container, err);
        console.error(err);
      }
    };
    doEverything();
  }

  async #getTasks() {
    try {
      const requests = Object.keys(this.#data).map((key) =>
        sendAPI("GET", `${baseUrl}/positions/${key}`)
      );
      const responses = await Promise.all(requests);
      Object.keys(this.#data).forEach((key, i) => {
        this.#data[key] = Object.fromEntries(
          responses[i].data.tasks.map((el) => [el.position, el.tasks])
        );
      });
    } catch (err) {
      throw err;
    }
  }

  #addTask(e) {
    const person = e.target.closest(".row").querySelector(".name").textContent;
    const toDoTasks = e.target.closest(".row").querySelector(".tasks");
    const headingRow = e.target.closest(".row").querySelector(".list-group");
    const showButton = e.target.closest(".row").querySelector(".show-button");
    toDoTasks.classList.remove("hidden");
    showButton.textContent = "-";
    headingRow.insertAdjacentHTML(
      "beforeend",
      `<div class="row justify-content-center filtered">
    <div class="col col-1 my-col">${
      this.#data[person].currentTasks.length + 1
    }</div>
    <div class="col col-6 my-col"><input class="input-task-name" type="text" /></div>
    </div>`
    );
    const inputTaskName = document.querySelector(".input-task-name");
    inputTaskName.focus();
    inputTaskName.addEventListener("keydown", this.#saveTask.bind(this));
  }

  async #saveTask(e) {
    try {
      const inputTaskName = document.querySelector(".input-task-name");
      if (e.key !== "Enter" || !inputTaskName || inputTaskName.value === "")
        return;
      const person = inputTaskName
        .closest(".person-row")
        .querySelector(".name").textContent;
      const taskName = inputTaskName.value;
      this.#data[person].currentTasks.push(taskName);
      await sendAPI(
        "PATCH",
        `${baseUrl}/positions/${person}?position=currentTasks`,
        {
          tasks: this.#data[person].currentTasks,
        }
      );
      this.#data[person].currentTasks.reverse();
      inputTaskName.closest(".row").classList.add("hidden");
      this.#updateTasks(e);
      inputTaskName.value = "";
      inputTaskName.classList.remove(".input-task-name");
      await sendAPI("POST", `${baseUrl}/records`, {
        assignedTo: person,
        taskName: taskName,
        dates: [],
        works: [],
        startTimes: [],
        endTimes: [],
        timeElapsed: [],
        timeTaken: [],
        results: [],
        comments: [],
        status: [],
        grades: [],
      });
    } catch (err) {
      throw err;
    }
  }

  #editTask(e) {
    const task = e.target.closest(".linkclass");
    const currentTask = task.querySelector(".task").textContent;
    const taskNumber = task.querySelector(".my-col").textContent;
    task.innerHTML = `
    <div class="col col-1 my-col">${taskNumber}</div>
    <div class="col col-6 my-col"><input class="input-task-name" type="text" value="${currentTask}" /></div>
    </div>`;
    task.classList.add("filtered");
    task.classList.remove("linkclass");
    const inputTaskName = document.querySelector(".input-task-name");
    inputTaskName.focus();
    inputTaskName.addEventListener("keydown", async (e) => {
      try {
        const currentTarget = e.currentTarget;
        if (e.key !== "Enter" || !currentTarget || currentTarget.value === "")
          return;
        const closestListGroup = currentTarget.closest(".list-group");
        const person = closestListGroup.dataset.person;
        const position = closestListGroup.dataset.position;
        this.#data[person][position][taskNumber - 1] = currentTarget.value;
        this.#data[person][position].reverse();
        const res = (await sendAPI("GET", `${baseUrl}/tasks/${person}`)).data
          .requestedDateTask;
        res.forEach((task) => {
          const index = task.tasks.findIndex((el) => el === currentTask);
          task.tasks[index] = currentTarget.value;
        });
        const resArray = res.map((el) =>
          sendAPI(
            "PUT",
            `${baseUrl}/tasks/${person}/${el.date.split("/").join("-")}`,
            {
              assignedTo: person,
              date: el.date,
              tasks: el.tasks,
            }
          )
        );
        resArray.push(
          sendAPI("PATCH", `${baseUrl}/records/${person}/${currentTask}`, {
            taskName: currentTarget.value,
          })
        );
        resArray.push(
          sendAPI(
            "PATCH",
            `${baseUrl}/positions/${person}?position=${position}`,
            {
              tasks: this.#data[person][position].slice().reverse(),
            }
          )
        );
        await Promise.all(resArray);
        currentTarget.closest(".row").classList.add("hidden");
        this.#updateTasks(e);
        this.#data[person][position].reverse();
        currentTarget.value = "";
        currentTarget.classList.remove(".input-task-name");
      } catch (err) {
        throw err;
      }
    });
    inputTaskName.addEventListener("click", (e) => e.currentTarget.focus());
  }

  #updateTasks(e) {
    const closestListGroup = e.target.closest(".list-group");
    if (!closestListGroup) return;
    let markup = "";
    const person = closestListGroup.dataset.person;
    const position = closestListGroup.dataset.position;
    this.#data[person][position].forEach((_, i) => {
      const currentIndex = this.#data[person][position].length - i - 1;
      markup += `<div class="row justify-content-center linkclass">
        <div class="col col-1 my-col">${i + 1}</div>
        <div class="col col-6 task my-col">${
          this.#data[person][position][currentIndex]
        }</div>
        <div class="col col-1 my-col edit-col"><img src="edit.png" class="edit-icon"></div>
      </div>`;
    });
    closestListGroup.innerHTML = markup;
  }

  #displayTasks() {
    let bigMarkup = [];
    Object.keys(this.#data).forEach((key) => {
      let markup = [];
      Object.keys(this.#data[key]).forEach((newKey) => {
        let littleMarkup = "";
        this.#data[key][newKey].forEach((task, i) => {
          littleMarkup += `<div class="row justify-content-center linkclass">
            <div class="col col-1 my-col">${i + 1}</div>
            <div class="col col-6 task my-col">${task}</div>
            <div class="col col-1 my-col edit-col"><img src="edit.png" class="edit-icon"></div>
          </div>`;
        });
        markup.push(littleMarkup);
      });
      bigMarkup.push(markup);
    });
    Object.keys(this.#data).forEach((key, i) => {
      let markup = "";
      const arr = Object.keys(this.#data[key]);
      bigMarkup[i].forEach((mark, index) => {
        const result = arr[index].slice().replace(/([A-Z])/g, " $1");
        markup += `
        <div class="lists">
          <div class="row justify-content-center">
            ${result.charAt(0).toUpperCase() + result.slice(1)}
          </div>
          <div class="row justify-content-center">
            <div class="col col-1 my-col">Number</div>
            <div class="col col-6 my-col">Task</div>
            <div class="col col-1 my-col">Edit</div>
          </div>
          <div class="list-group" data-person=${key} data-position=${
          arr[index]
        }>
            ${mark}
          </div>
        </div>
        `;
      });
      this.#container.insertAdjacentHTML(
        "beforeend",
        `
      <div class="row person-row ${i ? "mt-5" : ""}">
      <div class="col-1 column">
        <button class="show-button">+</button>
      </div>
      <div class="col-2 name">${key}</div>
      <div class="tasks hidden">
        ${markup}
      </div>
      <div class="col-3">
          <button type="button" class="btn mt-2 add-new-task">
            Add New Task for ${key}
          </button>
        </div>
      `
      );
    });
  }

  #enableDragging() {
    const lists = document.querySelectorAll(".list-group");
    lists.forEach((list) => {
      const self = this;
      const sortable = new Sortable(list, {
        animation: 150,
        filter: ".filtered",
        group: `shared-${list.dataset.person}`,
        async onSort(e) {
          try {
            const person = list.dataset.person;
            const position = list.dataset.position;
            self.#data[person][position] = Array.from(
              e.target.querySelectorAll(".row")
            )
              .map((node) => node.querySelector(".col-6").textContent)
              .reverse();
            self.#data[person][position].reverse();
            await sendAPI(
              "PATCH",
              `${baseUrl}/positions/${person}?position=${position}`,
              {
                tasks: self.#data[person][position],
              }
            );
            self.#data[person][position].reverse();
            self.#updateTasks(e);
          } catch (err) {
            throw err;
          }
        },
      });
    });
  }

  #move(arr, fromIndex, toIndex) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
  }

  #showTasks(e) {
    const showButton = e.target.closest(".show-button");
    if (!showButton) return;
    const toDoTasks = showButton.closest(".row").querySelector(".tasks");
    toDoTasks.classList.toggle("hidden");
    if (showButton.textContent === "+") showButton.textContent = "-";
    else showButton.textContent = "+";
  }

  #goToResultsOrEdit(e) {
    if (e.target.closest("div").classList.contains("edit-col")) {
      this.#editTask(e);
      return;
    }
    if (!e.target.closest(".list-group") || !e.target.closest(".linkclass"))
      return;
    const person = e.target
      .closest(".person-row")
      .querySelector(".name").textContent;
    const taskName = e.target
      .closest(".row")
      .querySelector(".task")
      .textContent.split(" ")
      .join("%");
    const url = `${window.location.href.split("/")[0]}//${
      window.location.href.split("/")[2]
    }/admin/tasks/course/index.html?${person}+${taskName}`;
    window.open(url, "_blank");
  }
}

const app = new App();
