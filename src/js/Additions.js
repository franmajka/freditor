export default class Additions {
  constructor(elem) {
    this.$element = elem;
    this.$textarea = elem.previousElementSibling;
    this.links = [];
    this.images = [];
    this.files = [];
  }

  show() {
    this.$element.dataset.hidden = 'false';
  }

  hide() {
    this.$element.dataset.hidden = 'true';
  }

  submit() {
    this.$textarea.value += `
    #--ADDITIONS--#
    ${this.$element.textcontent}`;
  }

  decreaseIndexes(callback, list) {
    let skipped = 0;
    for (let i = 0; i < list.length; i++) {
      let reg = callback(i + skipped);
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

  update() {
    this.decreaseIndexes(
      i => new RegExp(`\\[url=(${i})\\].*?\\[\\/url\\]`, 'g'),
      this.links,
    );
    this.decreaseIndexes(
      i => new RegExp(`\\[img(?: url)?=(${i})\\]`, 'g'),
      this.images,
    );
    this.decreaseIndexes(
      i => new RegExp(`\\[file=(${i})\\].*?\\[\\/file\\]`, 'g'),
      this.files,
    );

    return this.links.length || this.images.length || this.files.length;
  }
}
