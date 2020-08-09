/**
 * Creates an element representing an image with delete and insert buttons
 * @param {String} pk Primary key of the image at database
 * @param {String} url URL to the image
 * @returns {HTMLDivElement} Element represanting an image
 */
export default function createImage(pk, url) {
  let imgWrapper = document.createElement('div');
  imgWrapper.classList.add('img_wrapper');
  imgWrapper.dataset.pk = pk;
  imgWrapper.dataset.url = url;

  imgWrapper.insertAdjacentHTML('afterbegin', `
    <img src='${url}' class='img'>
    <div class='controls'>
      <div class='delete_image'>Видалити зображення</div>
      <div class='insert_image'>Додати зображення</div>
    </div>
  `);

  return imgWrapper;
}
