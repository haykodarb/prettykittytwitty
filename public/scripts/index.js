const primerSlider = document.getElementById("primerSlider");
const segundoSlider = document.getElementById("segundoSlider");
let username = document.getElementById("username").dataset.username;
const primerCargando = document.getElementById("cargando1");
const segundoCargando = document.getElementById("cargando2");
const uploadForm  = document.getElementById("uploadForm");

uploadForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const myImage = document.getElementById("myImage");
  const messageBox = document.getElementById('messageBox');
  let endpoint = "https://prettykittytwitty.herokuapp.com/upload";
  let formData = new FormData();

  formData.append("myImage", myImage);
  console.log(myImage);
  
  fetch(endpoint, {
    method: "POST",
    body: formData,
  })
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      if(json.isError) {
        messageBox.className = 'error';
      } else {
        messageBox.className = 'notError';
      }
      messageBox.innerText = message;
    });
});

fetchNoSubidas();
fetchSubidas();

function uploadPicture() {}

function fetchSubidas() {
  let data = {
    username: username,
  };
  fetch("./images/subidas", {
    mode: "cors",
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      if (json.data) {
        primerCargando.style.display = "none";
        json.data.forEach((file) => {
          let sliderCellDiv = document.createElement("div");
          sliderCellDiv.classList.add("carousel-cell");
          primerSlider.appendChild(sliderCellDiv);
          let sliderCellImg = document.createElement("img");
          sliderCellImg.setAttribute(
            "src",
            `data:${file.fileType};base64, ${file.b64content}`
          );
          sliderCellDiv.appendChild(sliderCellImg);
        });
        let elem = document.getElementById("primerSlider");
        primerSlider = new Flickity(elem, {
          cellAlign: "left",
          contain: true,
        });
      } else {
        primerCargando.textContent = json.error;
      }
    });
}

function fetchNoSubidas() {
  let data = {
    username: username,
  };
  fetch("./images/nosubidas", {
    mode: "cors",
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      if (json.data) {
        segundoCargando.style.display = "none";
        json.data.forEach((file) => {
          let sliderCellDiv = document.createElement("div");
          sliderCellDiv.classList.add("carousel-cell");
          segundoSlider.appendChild(sliderCellDiv);
          let sliderCellImg = document.createElement("img");
          sliderCellImg.setAttribute(
            "src",
            `data:${file.fileType};base64, ${file.b64content}`
          );
          sliderCellDiv.appendChild(sliderCellImg);
        });
        let elem = document.getElementById("segundoSlider");
        segundoSlider = new Flickity(elem, {
          cellAlign: "left",
          contain: true,
        });
      } else {
        segundoCargando.textContent = json.error;
      }
    });
}
