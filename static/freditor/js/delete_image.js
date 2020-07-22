"use strict";
function deleteImage() {
	let message = new Message();

	let xhr = new XMLHttpRequest();
	xhr.open("POST", document.getElementById('gallery').dataset.urlDelete, true)
	xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

	const deleteLink = this;

	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				if (xhr.responseText) {
					let data = JSON.parse(xhr.responseText)
					if (data.success) deleteLink.parentElement.parentElement.remove();
					message.success = data.success;
					message.textContent = data.message;
				} else {
					message.success = false;
					message.textContent = 'Щось пішло не так...';
				}
			} else if (xhr.status === 403) {
				message.success = false;
				message.textContent = 'Відмовлено в доступі';
			} else if (xhr.status === 0) {
				message.success = false;
				message.textContent = 'Немає доступу до інтернету';
			}
			else {
				message.success = false;
				message.textContent = 'Щось пішло не так...';
			}

			Message.append(message);
		}
	}
	xhr.send(JSON.stringify({ 'pk': this.dataset.pk }));
}
