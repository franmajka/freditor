from django import forms

from .widgets import FrEditorWidget


class FrEditorFormField(forms.fields.CharField):
  def __init__(self, *args, **kwargs):
    kwargs.update({'widget': FrEditorWidget({'allowed_btns': kwargs.pop('allowed_btns', {})})})
    super().__init__(*args, **kwargs)