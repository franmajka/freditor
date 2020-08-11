import json
from django import forms
from django.utils.safestring import mark_safe
from django.template import loader


class FrEditorWidget(forms.Widget):
  template_name = 'freditor/freditor.html'

  class Media:
    css = {'all': ('freditor/bundles/freditor.css',)}
    js = ('freditor/bundles/freditor.bundle.js',)


  def __init__(self, attrs=None):
    default_attrs = {'style': 'min-height: 150px;'}
    if attrs:
      default_attrs.update(attrs)
    super().__init__(default_attrs)

  def render(self, name, value, attrs = None, renderer = None):
    context = self.get_context(name, value.text if value is not None else value, attrs)
    if value is not None:
      context['widget']['additions'] = json.dumps(value.additions)
    template = loader.get_template(self.template_name).render(context)
    return mark_safe(template)


class DragAndDropWidget(forms.FileInput):
  template_name = 'freditor/drag-n-drop.html'

  class Media:
    css = {'all': ('freditor/bundles/drag-n-drop.css',)}
    js = ('freditor/bundles/drag-n-drop.bundle.js',)


  def render(self, name, value, attrs=None, renderer=None):
    context = self.get_context(name, value, attrs)
    template = loader.get_template(self.template_name).render(context)
    return mark_safe(template)
