import defaultImage from '../img/default_image.png';
import Message from './Message';
import baseRequest from './base-request';
import resizeGallery from './resize-gallery';
import deleteImage from './delete-image';
import createImage from './create-image';

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
      return `
        <div id='preloader'>
          <div class='outer_circle'></div>
          <div class='outer_circle_shadow'></div>
          <div class='inner_circle'></div>
        </div>
      `;
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
   * @param {HTMLElement} caller An element that triggered the event
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

    this.setupOverlay();

    document.body.append(this.$element);

    this.currentCaller = null;
    this.children = {};
  }

  /** Adds click event listener to the base overlay object */
  setupOverlay() {
    this.$element.addEventListener('click', e => {
      if (e.target.dataset.hide || e.target.classList.contains('insert_image')) this.hide();

      if (e.target.classList.contains('insert_image')) {
        let textarea = this.currentCaller.closest('.freditor').querySelector('textarea');
        textarea.value = textarea.value.slice(0, textarea.selectionStart) + e.target.dataset.image_link +
          textarea.value.slice(textarea.selectionEnd);

        let message = new Message();
        message.success = true;
        message.textContent = 'Зображення було додано';
        Message.append(message);

        textarea.focus();
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

    switch (this.currentCaller.dataset.get) {
      case 'gallery': {
        let gallerWrapper = this.children.gallery;
        if (gallerWrapper) {
          gallerWrapper.style.display = '';
          break;
        }

        if (!this.setupGallery(this.currentCaller.dataset)) return;
        break;
      }
    }

    this.$element.style.display = '';
    this.$element.style.opacity = 1;
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
    for (let pk in json.images) {
      let image = createImage(pk, json.images[pk]);
      gallery.append(image);
      images.push(image);
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
