'use strict';

import '../css/drag-n-drop.scss'

function previewImage(){
	if(this.files && this.files[0]){
		const preview = document.querySelector('.preview');
		if(this.files[0].type.slice(0, 5) == 'image'){
			const reader = new FileReader();
			reader.onload = e => {
				const image = new Image();
				image.onload = e => {
					const img = document.createElement("img");
					img.src = e.target.src;
					img.classList.add('img_preview');
					if(e.target.width > e.target.height){
						img.style.width = '100%';
					}else{
						img.style.height = '100%';
					}
					preview.replaceChild(img, preview.firstChild);
				}
				image.src = e.target.result;
			};
			reader.readAsDataURL(this.files[0]);
		}else{
			document.querySelector('.preview').textContent = "Це не схоже на зображення..."
		}
	}
}

window.addEventListener('load', () => {
	const file = document.getElementById('box_file');
	const box_input = document.querySelector('.box_input')
	file.onchange = previewImage;
	['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'].forEach(evt =>
		box_input.addEventListener(evt, e => {
			e.preventDefault();
			e.stopPropagation();
		}));
	['dragover', 'dragenter'].forEach(evt =>
		box_input.addEventListener(evt, function(){this.classList.add('is_dragover')}));
	['dragleave', 'dragend', 'drop'].forEach(evt =>
		box_input.addEventListener(evt, function(){this.classList.remove('is_dragover')}));
	box_input.addEventListener('drop', function(e){
		let droppedFiles = e.dataTransfer.files;
		file.files = droppedFiles;
		file.onchange()
	})
})
