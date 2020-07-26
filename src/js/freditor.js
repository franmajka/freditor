"use strict";

import Message from './Message';
import resizeGallery from './resize-gallery';
import deleteImage from './delete-image'

import '../css/freditor.scss';
import '../css/preloader.scss';
const images = require.context('../img', true, /(?<!default_image)\.png$/)
import defaultImage from "../img/default_image.png";

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

function btnClickHandler() {
  let btnType = this.dataset.btn;
  if (btnType == 'link' || btnType == 'image') {
    for (let btn of this.parentElement.children) {
      if (btn.classList.contains('active') || btn == this) {
        btn.classList.toggle('active');

        let add_form = btn.closest('.controls_btns').querySelector(`.add_${btn.dataset.btn}`);
        add_form.classList.toggle('hidden');

        let input = add_form.querySelector('.link_value');
        input.value = '';

        if (btn == this) input.focus();
      }
    }
    return;
  }

  if (!BTN_VALUES.hasOwnProperty(btnType)) return;

  let textarea = this.closest('.controls_btns').nextElementSibling;
  let value = textarea.value;

  let sS = textarea.selectionStart;
  let sE = textarea.selectionEnd;
  if (sS != sE) {
    textarea.value = `${value.slice(0, sS)}[${BTN_VALUES[btnType]}]${value.slice(sS, sE)}[/${BTN_VALUES[btnType]}]${value.slice(sE)}`;
  } else {
    textarea.value = `${value.slice(0, sS)}[${BTN_VALUES[btnType]}][/${BTN_VALUES[btnType]}]${value.slice(sE)}`;
    textarea.selectionStart = sS + `[${BTN_VALUES[btnType]}]`.length;
    textarea.selectionEnd = textarea.selectionStart;
  }

  textarea.focus();
  return
}

function submitLinkHandler() {
  let linkUrl = this.previousElementSibling.value;
  if (!linkUrl) return;

  let urlStr = linkUrl;

  urlStr = urlStr.replace(/https?:\/\//, '');

  let slashIndex = urlStr.indexOf('/');
  if (~slashIndex) urlStr = urlStr.slice(0, slashIndex);

  this.previousElementSibling.value = '';

  let textarea = this.closest('.controls_btns').nextElementSibling;
  let value = textarea.value;
  let sS = textarea.selectionStart;
  let sE = textarea.selectionEnd;
  if (this.dataset.submitLink === 'link') {
    if (sS != sE) {
      textarea.value = `${value.slice(0, sS)}[url=${linkUrl}]${value.slice(sS, sE)}[/url]${value.slice(sE)}`;
      return;
    } else {
      textarea.value = `${value.slice(0, sE)}[url=${linkUrl}]${urlStr}[/url]${value.slice(sE)}`;
      textarea.selectionStart = sS + `[url=${linkUrl}]`.length;
      textarea.selectionEnd = sE + `[url=${linkUrl}]${urlStr}`.length;
      return
    }
  } else if (this.dataset.submitLink === 'image') {
    textarea.value = `${value.slice(0, sE)}[img url=${linkUrl}]${value.slice(sE)}`;
    return
  }

  textarea.focus();
}

function getGallery() {
  let overlay = document.querySelector('#overlay');
}

/**
 * Handles user's clicks
 * @param {MouseEvent} e Click event
 */
function clickEventHadler(e) {
  if (e.target.dataset.btn) {
    btnClickHandler.call(e.target);
    return;
  }

  if (e.target.dataset.submitLink) {
    e.preventDefault();
    submitLinkHandler.call(e.target);
    return;
  }

  if (e.target.dataset.get === 'gallery') {
    e.preventDefault();
    getGallery.call(e.target);
    return;
  }
}

window.addEventListener('load', () => {
  document.addEventListener('click', clickEventHadler)

  document.querySelectorAll('.freditor textarea').forEach(textarea => {
    textareaAutoResize.call(textarea);
    textarea.addEventListener('input', textareaAutoResize);
  })

  document.querySelectorAll('.btn').forEach(i => {
    i.addEventListener('keyup', function(e){
      if(e.key == 'Enter'){
        this.click();
      }
    });
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

              let message = new Message();
              message.success = true;
              message.textContent = 'Зображення було додано'
              Message.append(message)

              textarea.focus();
            }).call(e.target);
          }else if(e.target.classList.contains('delete_image')){
            deleteImage.call(e.target);
          }
        });

        document.body.appendChild(overlay);

        let xhr = new XMLHttpRequest();
        xhr.open('POST', this.dataset.getUrl, true);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

        xhr.onreadystatechange = function(){
          if(xhr.readyState == 4){
            let message = new Message();
            message.success = false;
            if(xhr.status == 200){
              overlay.style.opacity = 1;
              if(xhr.responseText){
                let response = JSON.parse(xhr.responseText);
                if(response.success){

                  for(let pk in response.images){
                    overlay.querySelector('#gallery').appendChild(createImage(pk, response.images[pk]));
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
                        i.img.src = defaultImage;
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
                        console.log(defaultImage);
                        console.log('defaultImage указан не верно');
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
                  message.textContent = response.error;
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

  if (url && url != defaultImage){
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
