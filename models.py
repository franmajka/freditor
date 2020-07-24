import os
import uuid
from django.conf import settings
from django.db import models
from django.core.files.storage import default_storage
from django.core.files.storage import FileSystemStorage
from django.template.defaultfilters import slugify as django_slugify
import django.db.models.options as options


options.DEFAULT_NAMES = options.DEFAULT_NAMES + ('template',)

ALPHABET = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd',
  'е': 'e', 'є': 'ye', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'y',
  'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
  'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh',
  'щ': 'shch', 'ы': 'i', 'э': 'e', 'ю': 'yu', 'я': 'ya'
}

def slugify(s):
  '''
  Overriding django slugify that allows to use  cyrillic.
  '''
  return django_slugify(''.join(ALPHABET.get(w, w) for w in s.lower()))

def ImagePath(instance, filename):
  return f'images/{instance.pk}{os.path.splitext(filename)[1]}'

def FilePath(instance, filename):
  root, ext = os.path.splitext(filename)
  return f'files/{slugify(root)}{ext}'


class OverwriteStorage(FileSystemStorage):
  def get_available_name(self, name, max_length = None):
    if self.exists(name):
      self.delete(name)
      File.objects.get(pk=os.split(name)[1]).delete()
    return name


class Image(models.Model):
  id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
  image = models.ImageField(upload_to = ImagePath)

  def delete(self, *args, **kwargs):
    if default_storage.exists(self.image.name):
      default_storage.delete(self.image.name)
    super().delete(*args, **kwargs)

  def get_url(self):
    if self.image and default_storage.exists(self.image.name):
      return self.image.url
    return self.default_image

  @property
  def default_image(self):
    return settings.STATIC_URL + 'img/default_image.png'



class File(models.Model):
  filename = models.CharField(max_length = 256, primary_key = True, editable = False)
  file = models.FileField(upload_to = FilePath, storage = OverwriteStorage())

  def save(self, *args, **kwargs):
    self.filename = os.path.split(self.file.name)[1]
    super().save(*args, **kwargs)

  def delete(self, *args, **kwargs):
    if default_storage.exists(self.file.name):
      default_storage.delete(self.file.name)
    super().delete(*args, **kwargs)

  def __str__(self):
    return self.filename
