'use strict';

import Preloader from './Preloader';
import resizeGallery from './resize-gallery';
import deleteImage from './delete-image';
import copyImage from './copy-image';

import '../css/gallery.scss';

window.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('gallery');

  if (!gallery) return;

  window.preloader = new Preloader(
    gallery,
    document.getElementById('content')
  );
});

window.addEventListener('load', function(){
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  resizeGallery();
  window.preloader.remove();
  window.addEventListener('resize', resizeGallery);
  document.querySelectorAll('.delete_image').forEach( i => i.addEventListener('click', deleteImage) );
  document.querySelectorAll('.copy_image').forEach( i => i.addEventListener('click', copyImage) );
});
