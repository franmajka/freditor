'use strict';

import Message from './Message';
import baseRequest from './base-request';

export default async function deleteImage() {
  let imgWrapper = this.closest('.img_wrapper');

  let url = new URL(location.origin + document.getElementById('gallery').dataset.urlDelete);
  url.search = new URLSearchParams({'pk': imgWrapper.dataset.pk}).toString();
  let json = await baseRequest({url});

  if (!json) return false;

  imgWrapper.remove();

  let message = new Message();
  message.success = true;
  message.textContent = json.message;
  Message.append(message);

  return true;
}
