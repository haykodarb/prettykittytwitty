  const primerSlider = document.getElementById('primerSlider');
  const segundoSlider = document.getElementById('segundoSlider');
  let username = document.getElementById('username').dataset.username;
  const primerCargando = document.getElementById('cargando1');
  const segundoCargando = document.getElementById('cargando2');

  fetchNoSubidas();
  fetchSubidas();


  function fetchSubidas() {
    let data = {
      username: username,
    };
    fetch('./images/subidas', {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => {
      primerCargando.style.display = 'none';
      return res.json();
    }).then((json) => {
      console.log(json);
      json.data.forEach(((file) => {
        let sliderCellDiv = document.createElement('div');
        sliderCellDiv.classList.add("carousel-cell");
        primerSlider.appendChild(sliderCellDiv);
        let sliderCellImg = document.createElement('img')
        sliderCellImg.setAttribute('src', `data:${file.fileType};base64, ${file.b64content}`)
        sliderCellDiv.appendChild(sliderCellImg);
      }));
    }).then(() => {
      let elem = document.getElementById('primerSlider');
      let primerSlider = new Flickity(elem, {
        cellAlign: 'left',
        contain: true
      });
    });
  }

  function fetchNoSubidas() {
    let data = {
      username: username,
    };
    fetch('./images/nosubidas', {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => {
      segundoCargando.style.display = 'none';
      return res.json();
    }).then((json) => {
      console.log(json);
      json.data.forEach(((file) => {
        let sliderCellDiv = document.createElement('div');
        sliderCellDiv.classList.add("carousel-cell");
        segundoSlider.appendChild(sliderCellDiv);
        let sliderCellImg = document.createElement('img')
        sliderCellImg.setAttribute('src', `data:${file.fileType};base64, ${file.b64content}`)
        sliderCellDiv.appendChild(sliderCellImg);
      }));
    }).then(() => {
      let elem = document.getElementById('segundoSlider');
      let segundoSlider = new Flickity(elem, {
        cellAlign: 'left',
        contain: true
      });
    });
  }
