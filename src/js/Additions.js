/**
 * @typedef {Object} Addition
 * @property {String} Addition.pk Primary key of the file/image
 * @property {String} Addition.url Url of the file/image
 */

 /**
  * @callback appendToTextarea
  * @param {Number} index
  */
export default class Additions {
  /** @type {WeakMap<HTMLDivElement, Additions>} Links the HTML with Addtions class */
  static additionsMap = new WeakMap();

  /**
   * Constructs the instance of the Additions
   * @param {HTMLDivElement} elem HTML represantation of additions for the certain freditor
   */
  constructor(elem) {
    this.$element = elem;

    /** @type {HTMLTextAreaElement} Textarea linked with additions */
    this.$textarea = elem.previousElementSibling;

    this.extensions = {
      links: new Extension({
        reg: /\[url=(\d+)\].*?\[\/url\]/g,
        title: 'Посилання',
      }),
      images: new Extension({
        reg: /\[img(?: url)?=(\d+)\]/g,
        title: 'Зображення',
      }),
      files: new Extension({
        reg: /\[file=(\d+)\].*?\[\/file\]/g,
        title: 'Файли',
      })
    }

    Additions.additionsMap.set(this.$element, this);

    this._setup();
  }

  /** If json given make additions from it and then show them */
  _setup() {
    if (!this.$element.textContent.trim()) {
      this.hidden = true;
      return;
    }
    try {
      let json = JSON.parse(this.$element.textContent);
      if (json) {
        for (let key in this.extensions) {
          this.extensions[key].list = json[key];
        }
      }
    } catch (err) {
      if (!(err instanceof SyntaxError)) throw err;
    }

    this.updateInnerHTML();
  }

  get hidden() {
    return this.$element.dataset.hidden === 'true' ? true : false;
  }

  set hidden(bool) {
    this.$element.dataset.hidden = String(bool);
    return true;
  }

  /** Method that triggers when the form is submited */
  submit() {
    this.$textarea.value += `\n\n#--ADDITIONS--#\n${this.$element.innerText}`;
  }

  /**
   * Goes through the elements of the lists and remove the unnecessary ones
   */
  clean() {
    for (let extension of Object.values(this.extensions)) {
      let skipped = 0;
      let matches = Array.from(this.$textarea.value.matchAll(extension.reg));
      for (let i = 0; i < extension.list.length; i++) {
        let references = matches.filter(match => match[1] == i + skipped + 1);
        if (!references.length) {
          extension.list.splice(i, 1);
          skipped++;
          i--;
          continue;
        }
        if (!skipped) continue;

        let [pattern, index] = references[0];

        this.$textarea.value = this.$textarea.value
          .split(pattern)
          .join(pattern.replace(index, +index - skipped));
      }
    }
  }

  /**
   * Cleans the unnecessary additions
   * @returns {Boolean} State of the additions, true if there is any currently needed one else false
   */
  updateLists() {
    this.clean()

    return Object.values(this.extensions).some(i => !i.empty);
  }

  /**
   * Generates HTML for additions element
   * @returns {String} HTML
   */
  generateInnerHTML() {
    let html = '';

    for (let extension of Object.values(this.extensions)) {
      if (extension.empty) continue;
      html += extension.generateHTML();
    }

    return html;
  }

  /**
   * Displays the changes and hides the whole element if needed
   * @returns {Boolean} true if there is a content else false
   */
  updateInnerHTML() {
    if (!this.updateLists()) {
      this.$element.innerHTML = '';
      if (!this.hidden) this.hidden = true;
      return false;
    }
    this.$element.innerHTML = this.generateInnerHTML();
    if (this.hidden) this.hidden = false;
    return true;
  }

  /**
   *
   * @param {String} extension Key for the extensions object
   * @param {String|Addition} item Single addition that can be represented as a string or object
   * with pk and url properies
   * @param {appendToTextarea} callback Function that will append item with certain index to textarea
   */
  appendTo(extension, item, callback) {
    let list = this.extensions[extension]?.list;
    if (!list) return;

    let index = list.findIndex(compare.bind(null, item));
    if(!~index) {
      index = list.length;
      list.push(item);
    }

    callback(index + 1);
    this.updateInnerHTML();
  }
}

/**
 * Compares 2 values in the simplest way
 * but includes extra compare for the first level of nesting of objects
 * @param {*} a First value
 * @param {*} b Second value
 * @returns {Boolean} Result of the compare
 */
function compare(a, b) {
  if (!(a instanceof Object) && !(b instanceof Object)) return a === b;
  if ((a instanceof Object) && (b instanceof Object)) {
    let bool = true;

    for (let key in a) {
      bool = (a[key] === b[key]) && bool;
    }

    return bool;
  }
  return false;
}

/** Class representing a single extension of additions */
class Extension {
  /**
   * Constructs the extension instance
   * @param {Object} [options={}]
   * @param {Array<Addition|String>} [options.list = []] List that can contain strings or objects
   * @param {RegExp} options.reg RegExp that allows to find extension references in the text
   * @param {String} [options.title=''] Title of the extension
   */
  constructor({list = [], reg = i => i, title = ''} = {}) {
    this.list = list;
    this.reg = reg;
    this.title = title;
  }

  /**
   * Getter that returns the state of extension's list
   * @return {Boolean}
   */
  get empty() {
    return !this.list.length
  }

  /**
   * Generates a part of additions that will be included in html representation of the additions
   * @returns {String} HTML
   */
  generateHTML() {
    let html = '';

    html += `<h4 class='additions_title'>${this.title}:</h4>
      <ul class='additions_list'>
      `;
    for (let i = 0; i < this.list.length; i++) {
      html += `<li class='additions_item'>[${i + 1}]: <a href='${this.list[i].url || this.list[i]}' target='_blank'>${this.list[i].pk || this.list[i]}</a></li>
        `;
    }
    html += '</ul>';

    return html;
  }

}
