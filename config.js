export const baseUrl =
  "https://k4k3f0n17e.execute-api.us-east-2.amazonaws.com/dev";
// export const baseUrl = "http://127.0.0.1:3000";

export const sendAPI = async function (
  typeOfRequest,
  url,
  data = { nothing: null }
) {
  try {
    let dataReturned;
    if (typeOfRequest === "GET") dataReturned = await (await fetch(url)).json();
    else
      await (
        await fetch(url, {
          method: typeOfRequest,
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify(data),
        })
      ).json();
    return dataReturned;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const renderError = function (element, err) {
  const markup = `
  <div>
    Whoops! Something went wrong!
    <br>
    Please refresh the page.
    <br>
    If nothing still works, please contact Tech Support. Please provide him with the following error:
    <br>
    <br>
    <br>
    <div style="color:rgb(100, 10, 0)">
      ${err}
    </div>
    <br>
    <br>
    Tech Support Phone Number: 612-735-0384.
    <br>
    Tech Support Email: shandilya.nookala@gmail.com
  </div>
  `;
  element.innerHTML = markup;
};
