'use strict';

import resizeGallery from './resize-gallery';
import deleteImage from './delete-image';
import copyImage from './copy-image';

import '../css/gallery.scss';

window.addEventListener('load', function(){
  const gallery = document.getElementById('gallery');
  if(gallery){
    gallery.nextElementSibling.classList.add('loaded_hiding');
    resizeGallery();
    setTimeout(() =>{
      gallery.classList.add('loaded');
      gallery.parentElement.removeChild(gallery.nextElementSibling);
    }, 200);
    window.addEventListener('resize', resizeGallery);
    document.querySelectorAll('.delete_image').forEach( i => i.addEventListener('click', deleteImage) );
    document.querySelectorAll('.copy_image').forEach( i => i.addEventListener('click', copyImage) );
  }
});
