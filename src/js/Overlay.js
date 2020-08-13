import defaultImage from '../img/default_image.png';
import Message from './Message';
import Additions from './Additions';
import baseRequest from './base-request';
import resizeGallery from './resize-gallery';
import deleteImage from './delete-image';
import createImage from './create-image';

import DOCUMENTATION from './documentation';
import PRELOADER from './preloader-html';

const OVERLAY_CHILDREN = {
  gallery: {
    id: 'gallery_wrapper',
    html(urlDelete) {
      return `
        <div id='gallery_wrapper'>
          <div id='gallery' data-url-delete=${urlDelete}></div>
        </div>
      `;
    }
  },
  preloader: {
    id: 'preloader',
    html() {
      return PRELOADER;
    }
  },
  documentation: {
    id: 'documentation',
    html() {
      return `
        <div id='documentation'></div>
      `;
    }
  }
};

function createImagePromise(img) {
  return new Promise(resolve => {
    img.onload = () => resolve({ 'loaded': true });
    img.onerror = () => resolve({ 'loaded': false, 'img': img });
  });
}


/** Class representing an overlay */
export default class Overlay {

  /**
   * Constructs Overlay object by creating a base HTMLElement
   */
  constructor() {
    this.$element = document.createElement('div');
    this.$element.id = 'overlay';
    this.$element.dataset.hide = 'true';
    this.$element.insertAdjacentHTML('afterbegin', `
      <div class='overlay_window'>
        <button class='hide' data-hide='true'></button>
      </div>
    `);

    this._setup();

    document.body.append(this.$element);

    this.currentCaller = null;
    this.children = {};
  }

  /** Adds click event listener to the base overlay object */
  _setup() {
    this.$element.addEventListener('click', e => {
      if (e.target.dataset.hide || e.target.classList.contains('insert_image')) this.hide();

      if (e.target.classList.contains('insert_image')) {
        insertImage.call(this, e);
      } else if (e.target.classList.contains('delete_image')) {
        deleteImage.call(e.target);
      }
    });
  }

  /**
   * Opens the overlay
   * @param {HTMLElement} caller Element that triggered the event
   */
  open(caller) {
    this.currentCaller = caller;

    switch (this.currentCaller.dataset.getOverlay) {
      case 'gallery': {
        let gallerWrapper = this.children.gallery;
        if (gallerWrapper) {
          gallerWrapper.style.display = '';
          break;
        }

        if (!this.setupGallery(this.currentCaller.dataset)) return;
        break;
      }
      case 'documentation': {
        let documentation = this.children.documentation;
        if (documentation) {
          documentation.style.display = '';
          break;
        }

        this.setupDocumentation(this.currentCaller.dataset);
        break;
      }
    }

    this.$element.style.display = '';
    setTimeout(() => this.$element.style.opacity = 1, 0);
  }

  /**
   * Makes structure of gallery
   * @param {DOMStringMap} dataset dataset object of caller
   * @returns {Boolean} Was setup successfull
   */
  async setupGallery(dataset) {
    let overlayWindow = this.$element.querySelector('.overlay_window');

    overlayWindow.insertAdjacentHTML('afterbegin', OVERLAY_CHILDREN.gallery.html(dataset.urlDelete));
    let gallerWrapper = overlayWindow.querySelector(`#${OVERLAY_CHILDREN.gallery.id}`);
    let gallery = gallerWrapper.firstElementChild;
    this.children.gallery = gallerWrapper;

    overlayWindow.insertAdjacentHTML('afterbegin', OVERLAY_CHILDREN.preloader.html());
    let preloader = overlayWindow.querySelector(`#${OVERLAY_CHILDREN.preloader.id}`);
    this.children.preloader = preloader;

    let json = await baseRequest({url: dataset.getUrl});

    if (!json) return false;

    let images = [];
    for (let image of json.images) {
      let $image = createImage(image.pk, image.url);
      gallery.append($image);
      images.push($image);
    }

    Promise.all(images.map(createImagePromise)).then(responses => {
      let rejected = [];
      responses.forEach(i => {
        if (!i.loaded) {
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
        if (!i.loaded) {
          i.img.parentElement.remove();
          console.log(`
            ${i.img.src}
            'Картинка отсутствует,
            ${defaultImage}
            defaultImage указан не верно
          `);
        }
      });
    });

    resizeGallery();
    if (preloader) {
      preloader.classList.add('loaded_hiding');
      setTimeout(() => {
        gallery.classList.add('loaded');
        preloader.remove();
        delete this.children.preloader;
      }, 200);
    }

    window.addEventListener('resize', () => {
      if (this.children.gallery) resizeGallery();
    });

    return true;
  }

  setupDocumentation(dataset) {
    let overlayWindow = this.$element.querySelector('.overlay_window');

    overlayWindow.insertAdjacentHTML('afterbegin', OVERLAY_CHILDREN.documentation.html());
    let documentation = overlayWindow.querySelector(`#${OVERLAY_CHILDREN.documentation.id}`);
    this.children.documentation = documentation;

    let allowed = JSON.parse(dataset.allowed);

    let texIndex = allowed.indexOf('tex');
    if (~texIndex) allowed.splice(texIndex, 1);

    if (!allowed.length && ~texIndex) {
      documentation.textContent = 'Звичайний текст...';
      return true;
    }

    let allowedHighlights = {};
    for (let highlight of ['bold', 'italic', 'strike']) {
      let index = allowed.indexOf(highlight);
      if (~index) {
        allowedHighlights[allowed[index]] = true;
        allowed.splice(index, 1);
      }
    }
    documentation.insertAdjacentHTML('beforeend', DOCUMENTATION.highlight(allowedHighlights));

    for (let allowance of allowed) {
      documentation.insertAdjacentHTML('beforeend', DOCUMENTATION[allowance] || '');
    }

    if (~texIndex) {
      DOCUMENTATION.tex().then(
        html => documentation.insertAdjacentHTML('beforeend', html)
      );
    }

    return true;
  }

  /** Hides the overlay and its children */
  hide() {
    this.$element.style.opacity = 0;
    this.$element.ontransitionend = () => {
      this.$element.ontransitionend = null;
      this.$element.style.display = 'none';

      for (let child of Object.values(this.children)){
        child.style.display = 'none';
      }
    };
  }
}

function insertImage(e) {
  let textarea = this.currentCaller.closest('.freditor').querySelector('.main_body');
  let imgWrapper = e.target.closest('.img_wrapper');
  let additions = Additions.additionsMap.get(this.currentCaller.closest('.freditor').querySelector('.additions'));

  let { selectionStart: sS, selectionEnd: sE } = textarea;

  additions.appendTo('images', {
    pk: imgWrapper.dataset.pk,
    url: imgWrapper.dataset.url,
  }, index => {
    let imageLink = `[img=${index}]`;

    textarea.setRangeText(imageLink, sS, sE);
    textarea.selectionStart += imageLink.length;
    textarea.selectionEnd = textarea.selectionStart;
  });

  let message = new Message();
  message.success = true;
  message.textContent = 'Зображення було додано';
  Message.append(message);

  textarea.focus();
}
