"use strict";

const DEFAULT_IMAGE = '/static/img/default_image.png';
const BTN_VALUES = {
  'bold':      'b',
  'italic':    'i',
  'strike':    's',
  'paragraph': 'p',
  'subtitle':  'h2',
  'tex':       'tex',
  'supscript': 'sup',
  'subscript': 'sub',
};

window.addEventListener('load', () => {

  document.querySelectorAll('.freditor').forEach(i => {
    const freditor = i.querySelector('textarea');
    textareaAutoResize.call(freditor);
    freditor.addEventListener('input', textareaAutoResize);
  })

  document.querySelectorAll('.btn').forEach(i => {

    i.addEventListener('keyup', function(e){
      if(e.key == 'Enter'){
        this.click();
      }
    });

    if(i.classList[1] == 'link' || i.classList[1] == 'image'){
      i.onclick = function(e){
        if(e){
          e.preventDefault();
        }

        for (let i of this.parentElement.children){
          if(i.classList.contains('active') || i == this){
            i.classList.toggle('active');
            let add_form = i.parentElement.parentElement.querySelector('.add_' + i.classList[1]);
            add_form.classList.toggle('hidden');

            let input = add_form.querySelector('.link_value');
            input.value = '';
            if(i == this){
              input.focus();
            }
          }
        };
      };
    }else if(i.classList[1] in BTN_VALUES){
      i.onclick = function(e){
        if(e){
          e.preventDefault();
        }

        let textarea = this.parentElement.parentElement.nextElementSibling;
        let value = textarea.value;
        let sS = textarea.selectionStart;
        let sE = textarea.selectionEnd;
        if(sS != sE){
          textarea.value = value.slice(0, sS) + `[${BTN_VALUES[this.classList[1]]}]` +
          value.slice(sS, sE) + `[/${BTN_VALUES[this.classList[1]]}]` + value.slice(sE);
        }else{
          textarea.value = value.slice(0, sS) + `[${BTN_VALUES[this.classList[1]]}]` +
          `[/${BTN_VALUES[this.classList[1]]}]` + value.slice(sE);
          textarea.selectionStart = sS + `[${BTN_VALUES[this.classList[1]]}]`.length;
          textarea.selectionEnd = textarea.selectionStart;
        }

        textarea.focus();
      };
    }
  });

  document.querySelectorAll('.submit_link').forEach(i => {
    i.onclick = function(e){
      if(e){
        e.preventDefault();
      }

      let link_url = this.previousElementSibling.value;
      if(link_url){
        let url_str = link_url;
        if(url_str.startsWith('http://')){
          url_str = url_str.slice(7);
        }else if(url_str.startsWith('https://')){
          url_str = url_str.slice(8);
        }
        if(url_str.includes('/')){
          url_str = url_str.slice(0, url_str.indexOf('/'));
        }

        this.previousElementSibling.value = '';

        let textarea = this.closest('.controls_btns').nextElementSibling;
        let value = textarea.value;
        let sS = textarea.selectionStart;
        let sE = textarea.selectionEnd;
        if(this.parentElement.classList[0] == 'add_link'){
          if(sS != sE){
            textarea.value = value.slice(0, sS) + `[url=${link_url}]` +
            value.slice(sS, sE) + '[/url]' + value.slice(sE);
          }else{
            textarea.value = value.slice(0, textarea.selectionEnd) +
            `[url=${link_url}]${url_str}[/url]` + value.slice(textarea.selectionEnd);
            textarea.selectionStart = sS + `[url=${link_url}]`.length;
            textarea.selectionEnd = sE + `[url=${link_url}]${url_str}`.length;
          }
        }else if(this.parentElement.classList[0] == 'add_image'){
          textarea.value = value.slice(0, sE) + `[img url=${link_url}]` + value.slice(sE);
        }

        textarea.focus();
      }
    };
  });

  document.querySelectorAll('.link_value').forEach(i => {
    i.addEventListener('keyup', function(e){
      if(e.key == 'Enter'){
        this.nextElementSibling.onclick();
      }
    });
  });

  document.querySelectorAll('.get_gallery').forEach( i => {
    i.addEventListener('click', function(e){
      e.preventDefault();

      let overlay = document.querySelector('#overlay');
      if(!overlay){
        overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.dataset.id = 'id_' + this.dataset.name;
        overlay.dataset.hide = 'true';

        overlay.insertAdjacentHTML('afterbegin', `
          <div class='overlay_window'>
            <div id='gallery_wrapper'>
              <div id='gallery' data-url-delete=${document.querySelector('.get_gallery').dataset.urlDelete}></div>
            </div>
            <div class='preloader'>
              <div class='outer_circle'></div>
              <div class='outer_circle_shadow'></div>
              <div class='inner_circle'></div>
            </div>
            <button class='hide' data-hide='true'></button>
          </div>
        `)

        overlay.addEventListener('click', function(e){
          if(e.target.dataset.hide || e.target.classList.contains('insert_image')){
            this.style.opacity = null;
            this.style.pointerEvents = 'none';
          }
          if(e.target.classList.contains('insert_image')){
            let overlay = this;
            (function(){
              let textarea = document.getElementById(overlay.dataset.id);
              textarea.value = textarea.value.slice(0, textarea.selectionStart) + this.dataset.image_link +
              textarea.value.slice(textarea.selectionEnd);

              textarea.focus();
            }).call(e.target);
          }else if(e.target.classList.contains('delete_image')){
            deleteImage.call(e.target);
          }
        });

        document.body.appendChild(overlay);

        let xhr = new XMLHttpRequest();
        xhr.open('POST', this.dataset.urlGet, true);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

        xhr.onreadystatechange = function(){
          if(xhr.readyState == 4){
            let message = new Message();
            message.success = false;
            if(xhr.status == 200){
              overlay.style.opacity = 1;
              if(xhr.responseText){
                let response = JSON.parse(xhr.responseText);
                if(!response[0]){

                  for(let pk in response[1]){
                    overlay.querySelector('#gallery').appendChild(createImage(pk, response[1][pk]));
                  }

                  function createImagePromise(img){
                    return new Promise(resolve => {
                      img.onload  = () => resolve({'loaded': true});
                      img.onerror = () => resolve({'loaded': false, 'img': img});
                    })
                  }

                  Promise.all(Array.from(document.querySelectorAll('#gallery img'))
                  .map(createImagePromise)).then(responses => {
                    let rejected = [];
                    responses.forEach(i => {
                      if(!i.loaded){
                        i.img.src = DEFAULT_IMAGE;
                        i.img.parentElement.querySelector('.controls .insert_image').remove();
                        i.img.parentElement.querySelector('.controls .delete_image')
                        .innerText = 'Видалити шлях';
                        rejected.push(i.img);
                      }
                    });
                    return Promise.all(rejected.map(createImagePromise));
                  }).then(responses => {
                    responses.forEach(i => {
                      if(!i.loaded){
                        i.img.parentElement.remove();
                        console.log(i.img.src);
                        console.log('Картинка отсутствует,');
                        console.log(DEFAULT_IMAGE);
                        console.log('DEFAULT_IMAGE указан не верно');
                      }
                    });
                    let gallery = document.getElementById('gallery_wrapper');
                    resizeGallery();
                    if(gallery.nextElementSibling){
                      gallery.nextElementSibling.classList.add('loaded_hiding');
                      setTimeout(() =>{
                        gallery.firstElementChild.classList.add('loaded');
                        gallery.nextElementSibling.remove();
                      }, 200);
                    }
                  });
                  Message.delete(message);
                }else{
                  document.body.removeChild(overlay);
                  message.textContent = response[1];
                  Message.append(message);
                }
              }else{
                document.body.removeChild(overlay);
                message.textContent = 'Щось пішло не так...';
                Message.append(message);
              }
            }else{
              document.body.removeChild(overlay);

              if(xhr.status === 403){
                message.textContent = 'Відмовлено в доступі';
              }else if(xhr.status === 0){
                message.textContent = 'Немає доступу до інтернету';
              }else{
                message.textContent = 'Щось пішло не так...';
              }

              Message.append(message)
            }
          }
        };

        xhr.send();
      }else{
        overlay.style.opacity = 1;
        overlay.style.pointerEvents = null;
      }
    });
  });

  document.getElementById('load_file').addEventListener('change', function(){
    let message = new Message();
    message.success = false;

    const formData = new FormData();
    if(this.files && this.files[0]){
      formData.append('file', this.files[0]);
    }else{
      return;
    }

    let xhr = new XMLHttpRequest();
    xhr.open("POST", this.dataset.url, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

    let file_input = this;
    xhr.onreadystatechange = function(){
      if(xhr.readyState === 4){
        switch(xhr.status){
          case 200:
            let textarea = file_input.closest('.controls_btns').nextElementSibling;
            let value = textarea.value;

            if(xhr.responseText){
              let data = JSON.parse(xhr.responseText);
              if(data.pk){
                let sS = textarea.selectionStart;
                let sE = textarea.selectionEnd;

                if(sS != sE){
                  textarea.value = value.slice(0, sS) + `[file=${data.pk}]` +
                  value.slice(sS, sE) + '[/file]' + value.slice(sE);
                }else{
                  textarea.value = value.slice(0, textarea.selectionEnd) +
                  `[file=${data.pk}]${data.pk}[/file]` + value.slice(textarea.selectionEnd);
                  textarea.selectionStart = sS + `[file=${data.pk}]`.length;
                  textarea.selectionEnd = sE + `[file=${data.pk}]${data.pk}`.length;
                }

                textarea.focus();

                message.success = true;

              }
              message.textContent = data.message;
            }else{
              message.textContent = 'Щось пішло не так...';
            }
            break;
          case 403:
            message.textContent = 'Відмовлено в доступі';
            break;
          case 0:
            message.textContent = 'Немає доступу до інтернету';
            break;
          default:
            message.textContent = 'Щось пішло не так...';
        }
        Message.append(message);
      }
    };
    xhr.send(formData);
  });

  document.getElementById('image_load').addEventListener('change', function(){
    let message = new Message();
    message.success = false;

    const formData = new FormData();
    if(this.files && this.files[0] && this.files[0].type.slice(0, 5) == 'image'){
      formData.append('image', this.files[0]);
    }else{
      message.success = false;
      message.textContent = 'Спробуйте завантажити зображення';
      Message.append(message);
      return;
    }

    let xhr = new XMLHttpRequest();
    xhr.open("POST", this.dataset.url, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

    let file_input = this;
    xhr.onreadystatechange = function(){
      if(xhr.readyState === 4){
        switch(xhr.status){
          case 200:
            let textarea = file_input.closest('.controls_btns').nextElementSibling;
            let value = textarea.value;

            if(xhr.responseText){
              let data = JSON.parse(xhr.responseText);
              if(data.pk){
                textarea.value = value.slice(0, textarea.selectionEnd) +
                `[img=${data.pk}]` + value.slice(textarea.selectionEnd);

                textarea.focus();

                message.success = true;

                let overlay = document.getElementById('overlay');
                if(overlay){
                  overlay.querySelector('#gallery').appendChild(createImage(data.pk, data.url));
                }
              }
              message.textContent = data.message;
            }else{
              message.textContent = 'Щось пішло не так...';
            }
            break;
          case 403:
            message.textContent = 'Відмовлено в доступі';
            break;
          case 0:
            message.textContent = 'Немає доступу до інтернету';
            break;
          default:
            message.textContent = 'Щось пішло не так...';
        }
        Message.append(message);
      }
    };
    xhr.send(formData);
  });

  document.querySelector('.preview').addEventListener('click', function(e){
    e.preventDefault()
    let form = document.querySelector('form');
    let original_target = form.target;
    let original_action = form.action;
    form.target = '_blank';
    form.action = this.dataset.url;
    form.submit();
    form.target = original_target;
    form.action = original_action;
  })
});

window.addEventListener('resize', () => {
  let overlay = document.getElementById('overlay');
  if(overlay){
    resizeGallery();
  }
});

function createImage(pk, url){
  let img_wrapper = document.createElement('div');
  img_wrapper.classList.add('img_wrapper');

  img_wrapper.insertAdjacentHTML('afterbegin', `
    <img src='${url}' class='img'>
    <div class='controls'>

    </div>
  `);

  let controls = img_wrapper.querySelector('.controls');

  let delete_image = document.createElement('div');
  delete_image.classList.add('delete_image');
  delete_image.dataset.pk = pk;

  if(url && url != DEFAULT_IMAGE){
    let insert_image = document.createElement('div');
    insert_image.classList.add('insert_image');
    insert_image.dataset.image_link = `[img=${pk}]`;

    insert_image.appendChild(document.createTextNode('Додати зображення'));
    controls.appendChild(insert_image);

    delete_image.appendChild(document.createTextNode('Видалити зображення'));
  }else{
    delete_image.appendChild(document.createTextNode('Видалити шлях'));
  }

  controls.appendChild(delete_image);

  return img_wrapper
}

function textareaAutoResize() {
  this.parentElement.style.height = this.parentElement.offsetHeight + 'px';
  this.style.height = 0
  this.style.height = `${this.scrollHeight - parseInt(getComputedStyle(this).padding) * 2}px`;
  this.parentElement.style.height = null;
}
