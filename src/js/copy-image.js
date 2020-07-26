'use strict';

import Message from './Message';

export default function copyImage(){
	let message = new Message();
	let copy_to_clipboard = document.createElement('div');
	copy_to_clipboard.textContent = this.dataset.copy;
	this.appendChild(copy_to_clipboard);
	const selection = window.getSelection();
	const range = document.createRange();
	range.selectNodeContents(copy_to_clipboard);
	selection.removeAllRanges();
	selection.addRange(range);
	try{
		document.execCommand('copy');
		selection.removeAllRanges();

		message.success = true;
		message.textContent = 'Тег зображення був скопійований у буфер обміну'
	}catch(e){
		message.success = false;
		message.textContent = e.message;
	}

	copy_to_clipboard.remove()

	Message.append(message);
}
