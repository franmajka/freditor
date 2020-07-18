"use strict";
function deleteImage(){
	let xhr = new XMLHttpRequest();
	xhr.open("POST", document.getElementById('gallery').dataset.urlDelete, true)
	xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	const delete_link = this;
	xhr.onreadystatechange = function(){
		if(xhr.readyState === 4){
			if(xhr.status === 200){
				if(xhr.responseText){
					let data = JSON.parse(xhr.responseText)
					if(data['success']){
						delete_link.parentElement.parentElement.remove()
						return
					}else{
						delete_link.textContent = data['message']
					}
				}else{
					delete_link.textContent = 'Щось пішло не так...'
				}
			}else if(xhr.status === 403){
				delete_link.textContent = 'Відмовлено в доступі'
			}else if(xhr.status === 0){
				delete_link.textContent = 'Немає доступу до інтернету'
			}
			else{
				delete_link.textContent = 'Щось пішло не так...'
			}
			setTimeout(() => {
				delete_link.textContent = 'Видалити зображення'
			}, 5000)
			
		}
	}
	xhr.send(JSON.stringify({'pk': this.dataset.pk}));
}