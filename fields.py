import re
from django.utils.html import escape
from django.conf import settings
from django.db import models

from .forms import FrEditorFormField
from .models import Image, File


class FrEditorField(models.TextField):
  BTNS = {
    'subtitle':   {'description': 'Підзаголовок', 'tag': 'h2'   },
    'paragraph':  {'description': 'Параграф',     'tag': 'p'    },
    'bold':       {'description': 'Жирний',       'tag': 'b'    },
    'italic':     {'description': 'Курсив',       'tag': 'i'    },
    'strike':     {'description': 'Закреслений',  'tag': 's'    },
    'supscript':  {'description': 'Надрядковий',  'tag': 'sup'  },
    'subscript':  {'description': 'Підрядковий',  'tag': 'sub'  },
    'link':       {'description': 'Посилання',    'tag': 'link' },
    'image':      {'description': 'Зображення',   'tag': 'img'  },
    'file':       {'description': 'Файл',         'tag': 'file' }
  }

  FEATURES = ['iframe', 'tex']

  def __init__(self, *args, **kwargs):
    btns = kwargs.pop('allowed_btns', [])
    self.allowed_btns = self.BTNS.keys() if btns == '__all__' else btns
    features = kwargs.pop('allowed_features', [])
    self.allowed_features = self.FEATURES if features == '__all__' else features
    super().__init__(*args, **kwargs)

  def deconstruct(self):
    name, path, args, kwargs = super().deconstruct()
    kwargs['allowed_btns'] = self.allowed_btns
    kwargs['allowed_features'] = self.allowed_features
    return name, path, args, kwargs

  # Делаем из строки обратно словарь
  # Где-то тут нужно переводить словарь в строку для человеческого отображения в админке
  def from_db_value(self, value, expression, connection):
    return value

  # Делаем словарь текст + доп.
  def to_python(self, value):
    return value

  def pre_save(self, model_instance,  add):
    return super().pre_save(model_instance, add)

  # Записываем словарь в бд (переводим в строку json?)
  def get_prep_value(self, value):
    return value

  # Вот тут нужно отдавать знаечение для текстареа и для доп. то есть разбивать словарь
  def formfield(self, *args, **kwargs):
    defaults = {
      'form_class': FrEditorFormField,
      'allowed_btns': {i:self.BTNS[i]['description'] for i in self.allowed_btns},
    }
    defaults.update(kwargs)
    return super().formfield(*args, **defaults)

  def get_html(self, text):
    allowed_btns = [self.BTNS[i]['tag'] for i in self.allowed_btns]
    text = escape(text)

    btn_values = '|'.join(filter(lambda x: x in allowed_btns, ['h2', 'sub', 'sup', 'p', 'b', 'i', 's']))
    pattern = re.compile(
      r'\[(?P<tag>{0})\](?P<text>.*?)\[/(?P=tag)\]'.format(btn_values),
      flags = re.DOTALL,
    )
    while pattern.search(text) is not None:
      for i in pattern.finditer(text):
        text = text.replace(i.group(0), f'<{i.group("tag")}>{i.group("text")}</{i.group("tag")}>')

    if 'link' in allowed_btns:
      pattern = re.compile(r'^\s*\[(\d+)\]:\s*(\S+)', flags=re.MULTILINE)
      links = {}
      for i in pattern.finditer(text):
        links[i.group(1)] = i.group(2)
        print(i.group(0))
        text = text.replace(i.group(0), '')
      pattern = re.compile(r'\[url=(\d+?)\](.*?)\[/url\]', flags=re.DOTALL)
      for link in pattern.finditer(text):
        text = text.replace(link.group(0), f'''<a href="{links.get(link.group(1), '#')}">{link.group(2)}</a>''')

    if 'img' in allowed_btns:
      pattern = re.compile(r'\[img url=(.+?)\]')
      text = pattern.sub(r'<img src="\1" alt="\1">', text)
      if Image:
        pattern = re.compile(r'\[img=(.+?)\]')
        for img in pattern.finditer(text):
          try:
            model = Image.objects.get(pk = img.group(1))
            src = model.image.url
            if(src):
              text = text.replace(img.group(0), '<img src="{}">'.format(src))
            else:
              raise(Image.DoesNotExist)
          except Image.DoesNotExist:
            text = text.replace(img.group(0), '<img src="' + settings.STATIC_URL + 'img/default_image.png">')

    if 'file' in allowed_btns and File:
      pattern = re.compile(r'\[file=(.+?)\](.*?)\[/file\]', flags=re.DOTALL)
      for file in pattern.finditer(text):
        try:
          model = File.objects.get(pk = file.group(1))
          url = model.file.url
          if(url):
            text = text.replace(file.group(0), f'<a href="{url}" class="{get_extension(url)}">{file.group(2)}</a>')
          else:
            raise(File.DoesNotExist)
        except File.DoesNotExist:
          text = text.replace(file.group(0), f'<a href="#">{file.group(2)}</a>')

    if 'iframe' in self.allowed_features:
      pattern = re.compile(r'&lt;iframe(.*?)&gt;(.*?)&lt;\/iframe&gt;', flags=re.DOTALL)
      for iframe in pattern.finditer(text):
        iframe_attrs = iframe.group(1).replace('&quot;', '"').replace('&#x27;', "'")
        text = text.replace(iframe.group(0), '<iframe{0}>{1}</iframe>'.format(iframe_attrs, iframe.group(2)))
    return text

def get_extension(url):
  extension = url.split('.')[-1]
  if extension == 'pdf':
    return 'pdf'
  elif extension in ['pptx', 'ppt', 'pptm']:
    return 'pptx'
  elif extension in ['doc', 'docx', 'docm', 'dot', 'dotm', 'dotx']:
    return 'word'
  return ''
