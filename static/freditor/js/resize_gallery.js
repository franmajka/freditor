"use strict";
function resizeGallery(){
	const gallery = document.querySelector('#gallery')
	let cols = 1
	if(gallery.clientWidth >= 1600){
		cols = 5;
	}else if(gallery.clientWidth >= 1024){
		cols = 4;
	}else if(gallery.clientWidth >= 700){
		cols = 3;
	}else if(gallery.clientWidth >= 500){
		cols = 2;
	}
	gallery.style.columnCount = cols;
}
