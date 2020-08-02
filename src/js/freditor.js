'use strict';

import Message from './Message';
import Overlay from './Overlay';
import createImage from './create-image';

import '../css/freditor.scss';
import '../css/gallery.scss';
import '../css/preloader.scss';
// eslint-disable-next-line no-unused-vars
const images = require.context('../img', true, /(?<!default_image)\.png$/);

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

  if (!Object.prototype.hasOwnProperty.call(BTN_VALUES, btnType)) return;

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
  return;
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
      return;
    }
  } else if (this.dataset.submitLink === 'image') {
    textarea.value = `${value.slice(0, sE)}[img url=${linkUrl}]${value.slice(sE)}`;
    return;
  }

  textarea.focus();
}

function getGallery() {
  if (!window.overlay) {
    window.overlay = new Overlay();
  }

  window.overlay.open(this);
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
  document.addEventListener('click', clickEventHadler);

  document.querySelectorAll('.freditor textarea').forEach(textarea => {
    textareaAutoResize.call(textarea);
    textarea.addEventListener('input', textareaAutoResize);
  });

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
    xhr.open('POST', this.dataset.url, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    let file_input = this;
    xhr.onreadystatechange = function(){
      if(xhr.readyState === 4){
        switch(xhr.status){
          case 200: {
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
          }
          case 403: {
            message.textContent = 'Відмовлено в доступі';
            break;
          }
          case 0: {
            message.textContent = 'Немає доступу до інтернету';
            break;
          }
          default: {
            message.textContent = 'Щось пішло не так...';
          }
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
    xhr.open('POST', this.dataset.url, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    let file_input = this;
    xhr.onreadystatechange = function(){
      if(xhr.readyState === 4){
        switch(xhr.status){
          case 200: {
            let textarea = file_input.closest('.controls_btns').nextElementSibling;
            let value = textarea.value;

            if(xhr.responseText){
              let data = JSON.parse(xhr.responseText);
              if(data.pk){
                textarea.value = value.slice(0, textarea.selectionEnd) +
                `[img=${data.pk}]` + value.slice(textarea.selectionEnd);

                textarea.focus();

                message.success = true;

                if(window.overlay && Object.prototype.hasOwnProperty.call(window.overlay.children, 'gallery')){
                  window.overlay.children.gallery.firstElementChild.append(createImage(data.pk, data.url));
                }
              }
              message.textContent = data.message;
            }else{
              message.textContent = 'Щось пішло не так...';
            }
            break;
          }
          case 403: {
            message.textContent = 'Відмовлено в доступі';
            break;
          }
          case 0: {
            message.textContent = 'Немає доступу до інтернету';
            break;
          }
          default: {
            message.textContent = 'Щось пішло не так...';
          }
        }
        Message.append(message);
      }
    };
    xhr.send(formData);
  });

  document.querySelector('.preview').addEventListener('click', function(e){
    e.preventDefault();
    let form = document.querySelector('form');
    let original_target = form.target;
    let original_action = form.action;
    form.target = '_blank';
    form.action = this.dataset.url;
    form.submit();
    form.target = original_target;
    form.action = original_action;
  });
});

function textareaAutoResize() {
  this.parentElement.style.height = this.parentElement.offsetHeight + 'px';
  this.style.height = 0;
  this.style.height = `${this.scrollHeight - parseInt(getComputedStyle(this).padding) * 2}px`;
  this.parentElement.style.height = null;
}
