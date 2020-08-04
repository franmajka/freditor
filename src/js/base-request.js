import Message from './Message';

export default async function baseRequest({url = '', method = 'GET', headers = {}, body = null} = {}) {
  let response = await fetch(
    url,
    {
      method,
      headers: Object.assign({
        'X-Requested-With': 'XMLHttpRequest',
      }, headers),
      body
    }
  );

  if (!response.ok) {
    let message = new Message;
    message.success = false;
    switch (response.status) {
      case 403:
        message.textContent = 'Відмовлено в доступі';
        break;

      case 0:
        message.textContent = 'Немає зв\'язку з сервером.';
        break;

      default:
        message.textContent = 'Щось пішло не так...';
        break;
    }

    Message.append(message);
    return false;
  }
  let json = await response.json();

  if (!json || !json.success) {
    let message = new Message();
    message.success = false;
    message.textContent = json?.error || 'Щось пішло не так...';
    Message.append(message);
    return false;
  }

  return json;
}
