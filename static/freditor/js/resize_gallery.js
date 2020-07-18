"use strict";
function resizeGallery(){
	let cols = 1
	if(gallery.clientWidth >= 1600){
		cols = 5;
	}else if(gallery.clientWidth >= 1360){
		cols = 4;
	}else if(gallery.clientWidth >= 1024){
		cols = 3;
	}else if(gallery.clientWidth >= 720){
		cols = 2;
	}
	gallery.style.columnCount = cols;
}