import os
import sys
import json
from django import forms
from django.contrib import admin
from django.shortcuts import render
from django.urls import path
from django.core.files.storage import default_storage
from django.views.decorators.csrf import csrf_exempt
from django.utils.safestring import mark_safe
from django.http import HttpResponse
from django.core.exceptions import ValidationError

from .widgets import DragAndDropWidget
from .models import Image, File
from .fields import FrEditorField


class FrEditorAdmin(admin.ModelAdmin):
  change_form_template = 'freditor/freditor_change.html'

  def get_urls(self):
    urls = super().get_urls()
    my_urls = [
      path('freditor_preview/', self.admin_site.admin_view(self.freditor_preview), name='freditor_preview'),
    ]
    return my_urls + urls

  def freditor_preview(self, request, context = {}):
    if request.method != 'POST': return HttpResponse()
    ModelForm = self.get_form(request, None)
    form = ModelForm(request.POST, request.FILES, instance=None)
    if not form.is_valid(): return HttpResponse('Форма не валідна')
    for field in self.model._meta.fields:
      if not field.__class__ == FrEditorField:
        context[field.name] = request.POST.get(field.name, '')
        continue
      content = request.POST.get(field.name, '')
      content = field.get_html(content)
      context.update({field.name: content})
    return render(request, self.model._meta.template, context)


class ImageAdminForm(forms.ModelForm):
  class Meta:
    model = Image
    fields = ('image',)
    widgets = {
      'image': DragAndDropWidget()
    }


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
  form = ImageAdminForm
  list_display = ('_image',)
  readonly_fields = ('_image',)
  fields = ('image',)
  list_display_links = None
  actions = None
  change_list_template = 'freditor/gallery.html'
  add_form_template = 'freditor/gallery_add.html'

  def _image(self, Image):
    if Image.image and Image.image.url:
      return mark_safe(u'<img src="{}">'.format(Image.image.url))

  _image.allow_tags = True
  _image.empty_value_display = None
  _image.short_description = 'Зображення'

  def get_urls(self):
    urls = super().get_urls()
    my_urls = [
      path('add_image/', self.admin_site.admin_view(self.add_image), name='add_image'),
      path('delete_image/', self.admin_site.admin_view(self.delete_image), name='delete_image'),
      path('get_images/', self.admin_site.admin_view(self.get_images), name='get_images')
    ]
    return my_urls + urls

  @csrf_exempt
  def add_image(self, request):
    if request.is_ajax() and request.method == 'POST':
      if request.FILES:
        image = Image(image = request.FILES['image'])
        try:
          image.full_clean()
        except ValidationError:
          HttpResponse(json.dumps({
            'success': False,
            'error': 'ValidationError',
          }))
        else:
          image.save()
          return HttpResponse(json.dumps({
            'success': True,
            'pk': str(image.pk),
            'url': image.image.url,
            'message': 'Зображення було завантажено',
          }))
    return HttpResponse()

  @csrf_exempt
  def delete_image(self, request):
    if request.is_ajax() and request.method == 'GET':
      try:
        img = self.model.objects.get(pk = request.GET['pk'])
        img.delete()
        return HttpResponse(json.dumps({'success': True, 'message': 'Зображення було видалено'}))
      except self.model.DoesNotExist:
        return HttpResponse(json.dumps({'success': False, 'error': 'Зображення не знайдено'}))
    return HttpResponse()

  @csrf_exempt
  def get_images(self, request):
    if request.is_ajax() and request.method == 'GET':
      response = {}
      try:
        response['success'] = True
        response['images'] = []
        for img in Image.objects.all():
          is_image = img.image and img.image.url and default_storage.exists(img.image.name)
          if not is_image:
            img.delete()
            continue
          response['images'].append({
            'pk': str(img.pk),
            'url': img.image.url
          })
        return HttpResponse(json.dumps(response))
      except:
        response['success'] = False
        response['error'] = str(sys.exc_info()[0])
        return HttpResponse(json.dumps(response))
    return HttpResponse()

  class Media:
    css = {
      "all": (
        'freditor/bundles/gallery.css',
      ),
    }
    js = (
      'freditor/bundles/gallery.bundle.js',
    )


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
  list_display = ('filename',)
  list_per_page = 15

  def get_urls(self):
    urls = super().get_urls()
    my_urls = [
      path('add_file/', self.admin_site.admin_view(self.add_file), name='add_file'),
    ]
    return my_urls + urls

  @csrf_exempt
  def add_file(self, request):
    if request.is_ajax() and request.method == 'POST':
      if request.FILES:
        file = File(file = request.FILES['file'])
        try:
          file.full_clean()
        except ValidationError:
          HttpResponse(json.dumps({
            'success': False,
            'error': 'ValidationError'
          }))
        else:
          file.save()
          return HttpResponse(json.dumps({
            'success': True,
            'pk': str(file.pk),
            'url': file.file.url,
            'message': 'Файл було завантажено',
          }))
    return HttpResponse()
