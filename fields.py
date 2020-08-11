import re
import json
from django.utils.html import escape
from django.conf import settings
from django.db import models

from .forms import FrEditorFormField
from .models import Image, File

BTNS = {
    'subtitle':   {'description': 'Підзаголовок', 'tag': 'h2'},
    'paragraph':  {'description': 'Параграф',     'tag': 'p'},
    'bold':       {'description': 'Жирний',       'tag': 'b'},
    'italic':     {'description': 'Курсив',       'tag': 'i'},
    'strike':     {'description': 'Закреслений',  'tag': 's'},
    'supscript':  {'description': 'Надрядковий',  'tag': 'sup'},
    'subscript':  {'description': 'Підрядковий',  'tag': 'sub'},
    'link':       {'description': 'Посилання',    'tag': 'link'},
    'image':      {'description': 'Зображення',   'tag': 'img'},
    'file':       {'description': 'Файл',         'tag': 'file'}
}

FEATURES = ['iframe', 'tex']

def list_safe_get(list, index, default):
  try:
    return list[index]
  except IndexError:
    return default


class FrEditor(object):
  def __init__(self, *args, **kwargs):
    if kwargs.get('raw', True):
      self.from_raw(*args)
    else:
      self.additions = kwargs.get('additions', '')
      self.text = kwargs.get('text', '')
      self.html = kwargs.get('html', '')


  def from_raw(self, raw_str, allowed_btns, allowed_features):
    if ('[[ADDITIONS]]' in raw_str):
      raw_str = raw_str.split('[[ADDITIONS]]')
      self.additions = json.loads(raw_str.pop())
      self.text = '[[ADDITIONS]]'.join(raw_str)
    else:
      self.text = raw_str
      self.additions = None

    self.html = self.get_html(allowed_btns, allowed_features)

  def get_html(self, allowed_btns, allowed_features):
    allowed_btns = [BTNS[i]['tag'] for i in allowed_btns]
    html = escape(self.text)

    btn_values = '|'.join(filter(lambda x: x in allowed_btns, ['h2', 'sub', 'sup', 'p', 'b', 'i', 's']))
    pattern = re.compile(
      r'\[(?P<tag>{0})\](?P<text>.*?)\[/(?P=tag)\]'.format(btn_values),
      flags = re.DOTALL,
    )
    while pattern.search(html) is not None:
      for i in pattern.finditer(html):
        html = html.replace(i.group(0), f'<{i.group("tag")}>{i.group("text")}</{i.group("tag")}>')

    if 'link' in allowed_btns:
      pattern = re.compile(
        r'\[url=(?P<index>\d+?)\](?P<text>.*?)\[/url\]',
        flags=re.DOTALL,
      )
      for link in pattern.finditer(html):
        href = list_safe_get(self.additions['links'], int(link.group('index')) - 1, '#')
        html = html.replace(
          link.group(0),
          f'<a href="{href}">{link.group("text")}</a>'
        )

    if 'img' in allowed_btns:
      pattern = re.compile(r'\[img url=(?P<index>\d+?)\]')
      for img in pattern.finditer(html):
        src = list_safe_get(self.additions['images'], int(img.group('index')) - 1, '#')
        html = html.replace(
          img.group(0),
          f'<img src="{src}" alt="{src}">'
        )
      if Image:
        pattern = re.compile(r'\[img=(?P<index>\d+?)\]')
        for img in pattern.finditer(html):
          try:
            pk = list_safe_get(self.additions['images'], int(img.group('index')) - 1, '#').get('pk', None)
            model = Image.objects.get(pk = pk)
            src = model.get_url()
            if(src):
              html = html.replace(img.group(0), f'<img src="{src}">')
            else:
              raise(Image.DoesNotExist)
          except Image.DoesNotExist:
            html = html.replace(img.group(0), f'<img src="{Image.get_default_image()}">')

    if 'file' in allowed_btns and File:
      pattern = re.compile(r'\[file=(?P<index>.+?)\](?P<text>.*?)\[/file\]', flags=re.DOTALL)
      for file in pattern.finditer(html):
        try:
          pk = list_safe_get(self.additions['files'], int(file.group('index')) - 1, '#').get('pk', None)
          model = File.objects.get(pk = pk)
          url = model.file.url or '#'
          if(url):
            html = html.replace(file.group(0), f'<a href="{url}" class="{FrEditor.get_extension(url)}">{file.group("text")}</a>')
          else:
            raise(File.DoesNotExist)
        except File.DoesNotExist:
          html = html.replace(file.group(0), f'<a href="#">{file.group("text")}</a>')

    if 'iframe' in allowed_features:
      pattern = re.compile(r'&lt;iframe(.*?)&gt;(.*?)&lt;\/iframe&gt;', flags=re.DOTALL)
      for iframe in pattern.finditer(html):
        iframe_attrs = iframe.group(1).replace('&quot;', '"').replace('&#x27;', "'")
        html = html.replace(iframe.group(0), '<iframe{0}>{1}</iframe>'.format(iframe_attrs, iframe.group(2)))
    return html

  @staticmethod
  def get_extension(url):
    extension = url.split('.')[-1]
    if extension == 'pdf':
      return 'pdf'
    elif extension in ['pptx', 'ppt', 'pptm']:
      return 'pptx'
    elif extension in ['doc', 'docx', 'docm', 'dot', 'dotm', 'dotx']:
      return 'word'
    return ''


class FrEditorField(models.TextField):
  def __init__(self, *args, **kwargs):
    btns = kwargs.pop('allowed_btns', [])
    self.allowed_btns = BTNS.keys() if btns == '__all__' else btns
    features = kwargs.pop('allowed_features', [])
    self.allowed_features = FEATURES if features == '__all__' else features
    super().__init__(*args, **kwargs)

  def deconstruct(self):
    name, path, args, kwargs = super().deconstruct()
    kwargs['allowed_btns'] = self.allowed_btns
    kwargs['allowed_features'] = self.allowed_features
    return name, path, args, kwargs

  # Делаем из строки обратно словарь
  # Где-то тут нужно переводить словарь в строку для человеческого отображения в админке
  def from_db_value(self, value, expression, connection):
    ctx = {'raw': False}
    ctx.update(json.loads(value))
    return FrEditor(**ctx)

  # Делаем словарь текст + доп.
  def to_python(self, value):
    if isinstance(value, FrEditor):
      return value

    if value is None:
      return value

    return FrEditor(value, self.allowed_btns, self.allowed_features, raw = True)

  def pre_save(self, model_instance,  add):
    return super().pre_save(model_instance, add)

  # Записываем словарь в бд (переводим в строку json?)
  def get_prep_value(self, value):
    return json.dumps({
      'text': value.text,
      'additions': value.additions,
      'html': value.html,
    })

  # Вот тут нужно отдавать знаечение для текстареа и для доп. то есть разбивать словарь
  def formfield(self, *args, **kwargs):
    defaults = {
      'form_class': FrEditorFormField,
      'allowed_btns': {i:BTNS[i]['description'] for i in self.allowed_btns},
    }
    defaults.update(kwargs)
    return super().formfield(*args, **defaults)
