'use strict';

function copyImage(){
	let original = this.textContent;
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
		this.textContent = 'Готово!'
		setTimeout(() => {
			this.textContent = original;
		}, 5000)
	}catch(e){
		console.log(e);
		this.removeChild(copy_to_clipboard);
	}

}