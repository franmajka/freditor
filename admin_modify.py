from django.contrib.admin.templatetags.admin_modify import register, submit_row
from django.core.files.storage import default_storage


@register.inclusion_tag('freditor/submit_line.html', takes_context=True)
def freditor_submit_row(context):
	ctx = submit_row(context)
	ctx.update({
		'preview': (context['has_add_permission'] or context['has_change_permission']) and not context['is_popup']
	})
	return ctx


@register.inclusion_tag('freditor/gallery_image.html', takes_context=True)
def freditor_gallery_image(context):
	img = context['result']
	is_image = img.image and img.image.url and default_storage.exists(img.image.name)
	if not is_image: img.delete()
	context.update({
		'isImage': is_image,
		'img': img,
	})
	return context
