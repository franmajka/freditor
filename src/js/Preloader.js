import '../css/preloader.scss';
export default class Preloader {
  /**
   * Constructs the preloader
   * @param {HTMLElement} content Element that preloader is waiting for
   * @param {HTMLELement} parent Element in what the preloader will be stored
   */
  constructor(content, parent) {
    this.$element = document.createElement('div');
    this.$element.id = 'preloader';
    this.$element.insertAdjacentHTML('beforeend', `
      <div class='outer_circle'></div>
      <div class='outer_circle_shadow'></div>
      <div class='inner_circle'></div>
    `);

    parent.append(this.$element);

    this.$content = content;
    this.$content.classList.add('loading');
  }

  remove() {
    this.$element.classList.add('loaded_hiding');
    this.$element.ontransitionend = () => {
      this.$element.ontransitionend = null;
      this.$content.classList.remove('loading');
      this.$element.remove();
    };
  }
}
