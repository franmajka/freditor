export default class Additions {
  constructor(elem) {
    this.$element = elem;
    this.$textarea = elem.previousElementSibling;

    this._setup();
  }

  _setup() {
    if (!this.$element.textContent.trim()) {
      this._links = [];
      this._images = [];
      this._files = [];

      this.hide();
      return;
    }
    try {
      let json = JSON.parse(this.$element.textContent);
      if (json) {
        this._links = json.links;
        this._images = json.images;
        this._files = json._files;
      }
    } catch (err) {
      if (err.name !== 'SyntaxError') throw err;
      this._links = [];
      this._images = [];
      this._files = [];
    }

    this.show();
    this.updateInnerHTML();
  }

  show() {
    this.$element.dataset.hidden = 'false';
    this.hidden = false;
  }

  hide() {
    this.$element.dataset.hidden = 'true';
    this.hidden = true;
  }

  submit() {
    this.$textarea.value += `
    #--ADDITIONS--#
    ${this.$element.textContent}`;
  }

  /**
   * Goes through the elements of the list and remove the unnecessary ones
   * @param {Function} callback Function that has to return regexp
   * @param {Array<String>} list List of the addition (links / images / files)
   */
  clean(callback, list) {
    let skipped = 0;
    for (let i = 0; i < list.length; i++) {
      let reg = callback(i + skipped + 1);
      if (!reg.test(this.$textarea.value)) {
        list.splice(i, 1);
        skipped++;
        i--;
        continue;
      }
      if (!skipped) continue;
      this.$textarea.value = this.$textarea.value.replace(
        reg,
        (match, index) => match.replace(index, index - skipped)
      );
    }
  }

  cleanLinks() {
    this.clean(
      i => new RegExp(`\\[url=(${i})\\].*?\\[\\/url\\]`, 'g'),
      this._links,
    );
    return this._links.length;
  }

  cleanImages() {
    this.clean(
      i => new RegExp(`\\[img(?: url)?=(${i})\\]`, 'g'),
      this._images,
    );
    return this._images.length;
  }

  cleanFiles() {
    this.clean(
      i => new RegExp(`\\[file=(${i})\\].*?\\[\\/file\\]`, 'g'),
      this._files,
    );
    return this._files.length;
  }

  /**
   * Cleans the unnecessary additions
   * @returns {Boolean} State of the additions, true if there is any currently needed one else false
   */
  updateLists() {
    this.cleanLinks();
    this.cleanImages();
    this.cleanFiles();

    return Boolean(this._links.length || this._images.length || this._files.length);
  }

  generateInnerHTML() {
    let html = '';

    if (this._links.length) {
      html += generateAdditionsPartHTML(this._links, 'Посилання');
    }

    if (this._images.length) {
      html += generateAdditionsPartHTML(this._images, 'Зображення');
    }

    if (this._files.length) {
      html += generateAdditionsPartHTML(this._files, 'Файли');
    }

    return html;
  }

  updateInnerHTML() {
    if (!this.updateLists()) {
      this.$element.innerHTML = '';
      if (!this.hidden) this.hide();
      return false;
    }
    this.$element.innerHTML = this.generateInnerHTML();
    if (this.hidden) this.show();
    return true;
  }

  appendLink(link) {
    this._links.push(link);
    this.updateInnerHTML();
  }

  appendImage(image) {
    this._images.push(image);
    this.updateInnerHTML();
  }

  appendFile(file) {
    this._files.push(file);
    this.updateInnerHTML();
  }
}

function generateAdditionsPartHTML(list, title) {
  let html = '';

  html += `<h4 class='additions_title'>${title}:</h4>
    <ul class='additions_list'>
    `;
  for (let i = 0; i < list.length; i++) {
    html += `<li class='additions_item'>[${i + 1}]: <a href='${list[i].href || list[i]}'>${list[i].pk || list[i]}</a></li>
      `;
  }
  html += '</ul>';

  return html;
}
