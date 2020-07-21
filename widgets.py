from django import forms
from django.utils.safestring import mark_safe
from django.template import loader


class FrEditorWidget(forms.Widget):
  template_name = 'freditor/freditor.html'

  class Media:
    css = {
      'all': (
          "freditor/css/freditor.css",
          'freditor/css/gallery.css',
          'css/preloader.css'
      )
    }
    js = (
      'freditor/js/messages.js',
      'freditor/js/resize_gallery.js',
      'freditor/js/delete_image.js',
      'freditor/js/freditor.js',
    )


  def __init__(self, attrs=None):
    default_attrs = {'style': 'min-height: 150px;'}
    if attrs:
      default_attrs.update(attrs)
    super().__init__(default_attrs)


  def render(self, name, value, attrs=None, renderer=None):
    context = self.get_context(name, value, attrs)
    template = loader.get_template(self.template_name).render(context)
    return mark_safe(template)


class DragAndDropWidget(forms.FileInput):
  template_name = 'freditor/drag-n-drop.html'

  class Media:
    css = {'all': ('freditor/css/drag-n-drop.css',)}
    js = ('freditor/js/drag-n-drop.js',)


  def render(self, name, value, attrs=None, renderer=None):
    context = self.get_context(name, value, attrs)
    template = loader.get_template(self.template_name).render(context)
    return mark_safe(template)
