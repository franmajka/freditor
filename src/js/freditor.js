'use strict';

import Message from './Message';
import Overlay from './Overlay';
import createImage from './create-image';
import baseRequest from './base-request';

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
  let { value, selectionStart: sS, selectionEnd: sE } = textarea;

  textarea.setRangeText(`[${BTN_VALUES[btnType]}]${value.slice(sS, sE)}[/${BTN_VALUES[btnType]}]`, sS, sE);
  if (sS === sE) {
    textarea.selectionStart += `[${BTN_VALUES[btnType]}]`.length;
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
  let { value, selectionStart: sS, selectionEnd: sE } = textarea;

  if (this.dataset.submitLink === 'link') {
    textarea.setRangeText(`[url=${linkUrl}]${value.slice(sS, sE) || urlStr}[/url]`, sS, sE);
    if (sS === sE) {
      textarea.selectionStart += `[url=${linkUrl}]`.length;
      textarea.selectionEnd = sE + `[url=${linkUrl}]${urlStr}`.length;
    }
  } else if (this.dataset.submitLink === 'image') {
    textarea.setRangeText(`[img url=${linkUrl}]`, sS, sE);
    textarea.selectionStart += `[img url=${linkUrl}]`.length;
    textarea.selectionEnd = textarea.selectionStart;
  }

  textarea.focus();
}

function getGallery() {
  if (!window.overlay) {
    window.overlay = new Overlay();
  }

  window.overlay.open(this);
}

function previewHandler() {
  let form = document.querySelector('form');

  let original_target = form.target;
  let original_action = form.action;

  form.target = '_blank';
  form.action = this.dataset.url;
  form.submit();

  form.target = original_target;
  form.action = original_action;
}

/**
 * Handles user's clicks
 * @param {MouseEvent} e
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

  if (e.target.dataset.preview === 'true') {
    e.preventDefault();
    previewHandler.call(e.target);
    return;
  }
}

/**
 * Handles user's keypresses
 * @param {KeyboardEvent} e
 */
function keydownEventHandler(e) {
  if (e.target.dataset.btn && e.key === 'Enter') {
    e.preventDefault();
    btnClickHandler.call(e.target);
    return;
  }

  if (e.target.nextElementSibling?.dataset.submitLink && e.key === 'Enter') {
    e.preventDefault();
    submitLinkHandler.call(e.target.nextElementSibling);
    return;
  }
}

/**
 * Shows the tooltip of the element
 * @param {HTMLElement} anchorElement Element that has tooltip
 * @param {String} textcontent Text of the tooltip
 */
function showTooltip(anchorElement, textcontent) {
  const ARROW_SIZE = 10;
  let tooltipElement = document.createElement('div');
  tooltipElement.className = 'tooltip';
  tooltipElement.textContent = textcontent;
  document.body.append(tooltipElement);

  let anchorCoords = anchorElement.getBoundingClientRect();

  tooltipElement.style.left = `${anchorCoords.left + pageXOffset +
    (anchorElement.offsetWidth - tooltipElement.offsetWidth) / 2}px`;
  tooltipElement.style.top = `${anchorCoords.top + pageYOffset +
    anchorElement.offsetHeight + ARROW_SIZE}px`;
}

/**
 * Handles mouseover event
 * @param {MouseEvent} e
 */
function mouseoverEventHandler(e) {
  let anchorElement = e.target.closest('[data-tooltip]');
  if (anchorElement) showTooltip(anchorElement, anchorElement.dataset.tooltip);
}

/**
 * Handles mouseout event
 */
function mouseoutEventHandler() {
  document.querySelectorAll('.tooltip').forEach(i => i.remove());
}

async function loadImage() {
  const formData = new FormData();
  if (this.files && this.files[0] && this.files[0].type.slice(0, 5) == 'image') {
    formData.append('image', this.files[0]);
  } else {
    let message = new Message();
    message.success = false;
    message.textContent = 'Спробуйте завантажити зображення';
    Message.append(message);
    return false;
  }

  let json = await baseRequest({
    url: this.dataset.url,
    method: 'POST',
    body: formData,
  });

  if (!json) return false;

  let textarea = this.closest('.controls_btns').nextElementSibling;
  let { selectionStart: sS, selectionEnd: sE } = textarea;

  textarea.setRangeText(`[img=${json.pk}]`, sS, sE);
  textarea.selectionStart += `[img=${json.pk}]`.length;
  textarea.selectionEnd = textarea.selectionStart;

  textarea.focus();

  if (window.overlay && Object.prototype.hasOwnProperty.call(window.overlay.children, 'gallery')) {
    window.overlay.children.gallery.firstElementChild.append(createImage(json.pk, json.url));
  }

  let message = new Message();
  message.success = true;
  message.textContent = json.message;
  Message.append(message);
  return true;
}

async function loadFile() {

  const formData = new FormData();
  if (this.files && this.files[0]) {
    formData.append('file', this.files[0]);
  } else {
    let message = new Message();
    message.success = false;
    message.textContent = 'Ви не завантажили файл';
    Message.append(message);
    return false;
  }

  let json = await baseRequest({
    url: this.dataset.url,
    method: 'POST',
    body: formData,
  });

  if (!json) return false;

  let textarea = this.closest('.controls_btns').nextElementSibling;
  let { value, selectionStart: sS, selectionEnd: sE } = textarea;

  textarea.setRangeText(`[file=${json.pk}]${value.slice(sS, sE) || json.pk}[/file]`, sS, sE);

  if (sS === sE) {
    textarea.selectionStart += `[file=${json.pk}]`.length;
    textarea.selectionEnd = sE + `[file=${json.pk}]${json.pk}`.length;
  }

  textarea.focus();

  let message = new Message();
  message.success = true;
  message.textContent = json.message;
  Message.append(message);
  return true;
}

/**
 * Handles change event
 * @param {Event} e
 */
function changeEventHandler(e) {
  if (e.target.dataset.load === 'image') {
    loadImage.call(e.target);
    return;
  }

  if (e.target.dataset.load === 'file') {
    loadFile.call(e.target);
    return;
  }
}

function textareaAutoResize() {
  this.parentElement.style.height = this.parentElement.offsetHeight + 'px';
  this.style.height = 0;
  this.style.height = `${this.scrollHeight - parseInt(getComputedStyle(this).padding) * 2}px`;
  this.parentElement.style.height = null;
}

/**
 * Handles input event
 * @param {InputEvent} e
 */
function inputEventHandler(e) {
  if (e.target.dataset.textarea === 'true') {
    textareaAutoResize.call(e.target);
  }
}

window.addEventListener('load', () => {
  document.addEventListener('click', clickEventHadler);
  document.addEventListener('keydown', keydownEventHandler);
  document.addEventListener('mouseover', mouseoverEventHandler);
  document.addEventListener('mouseout', mouseoutEventHandler);
  document.addEventListener('change', changeEventHandler);
  document.addEventListener('input', inputEventHandler);

  document.querySelectorAll('[data-textarea]').forEach(textarea => textareaAutoResize.call(textarea));
});
