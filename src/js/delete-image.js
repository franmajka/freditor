'use strict';

import Message from './Message';
import baseRequest from './base-request';

export default async function deleteImage() {
  let url = new URL(location.origin + document.getElementById('gallery').dataset.urlDelete);
  url.search = new URLSearchParams({'pk': this.dataset.pk}).toString();
  let json = await baseRequest({url});

  if (!json) return false;

  this.closest('.img_wrapper').remove();

  let message = new Message();
  message.success = true;
  message.textContent = json.message;
  Message.append(message);

  return true;
}
