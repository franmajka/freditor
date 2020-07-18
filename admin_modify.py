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
	context.update({
		'isImage': img.image and img.image.url and default_storage.exists(img.image.path),
		'img': img,
	})
	print(context['isImage'])
	return context