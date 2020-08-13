/* eslint-disable no-undef */
export default {
  subtitle: `
    <h2>Підзаголовок</h2>
    <p>Дозволяє виділити окрему частину тексту, надавши їй відповідну назву.</p>
  `,
  paragraph: `
    <h2>Параграф</h2>
    <p>Дозволяє згрупувати частини тексту за змістом.</p>
  `,
  highlight: allowed => {
    let { bold = false, italic = false, strike = false } = allowed;
    if (!(bold || italic || strike)) return '';
    let html = '';
    html += '<h2>';

    let hl = [], tags = [];
    if (bold) {
      hl.push('жирний');
      tags.push('<b>жирний</b>');
    }
    if (italic) {
      hl.push('курсив');
      tags.push('<i>курсив</i>');
    }
    if (strike) {
      hl.push('закреслений');
      tags.push('<s>закреслений</s>');
    }

    hl[0] = hl[0][0].toUpperCase() + hl[0].slice(1);

    html += hl.join(', ') + '</h2>';

    html += `<p>Дозволя${hl.length >= 2 ? 'ють' : 'є'} виділити слово чи групу слів.</p>`;

    html += `<p>Приклади: ${tags.join(', ')}.</p>`;

    return html;
  },
  supscript: `
    <h2>Надрядковий</h2>
    <p>Дозволяє підняти текст у верхній регістр.</p>
    <p>Приклад: E = mc<sup>2</sup></p>
  `,
  subscript: `
    <h2>Підрядковий</h2>
    <p>Дозволяє опустити текст до нижнього регістру.</p>
    <p>Приклад: H<sub>2</sub>SO<sub>4</sub></p>
  `,
  link: `
    <h2>Посилання</h2>
    <p>Дозволяє створити посилання на певну адресу в мережі Інтернет.</p>
    <p>Приклад: <a href='http://example.com'>посилання</a></p>
  `,
  image: `
    <h2>Зображення</h2>
    <p>Дозволяє або завантажити, або створити посилання на зображення. У будь-якому разі на сторінці буде відображатися саме зображення, а не текст до якого прикріплене посилання.</p>
  `,
  file: `
    <h2>Файл</h2>
    <p>Дозволяє завантажити файл. На сторінці приймає вигляд тексту, при кліку на який користувачеві буде надаватись можливість скачати цей файл.</p>
  `,
  iframe: `
    <h2>iFrame</h2>
    <p>Дозволяє додавати на сторінку iFrame. Для цього достатньо скопіювати iFrame, що був згенерований стороннім ресурсом і вставити у поле вводу.</p>
    <p>Використання на прикладі відео з YouTube, у якому пояснюється, що таке iFrame:</p>
    <iframe width="100%" height="100%" src="https://www.youtube.com/embed/BZxcrSoY6GU" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  `,
  tex: async function () {
    let link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css;';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css';
    link.integrity = 'sha384-AfEj0r4/OFrOo5t7NnNe46zW/tFgW6x/bCJG8FqQCEo3+Aro6EYUG4+cU+KJWu/X';
    link.crossOrigin = 'anonymous';
    document.querySelector('head').append(link);

    let script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.js';
    script.integrity = 'sha384-g7c+Jr9ZivxKLnZTDUhnkOnsh30B4H0rpLUpJ4jAIKs4fnJI+sEnkvrMWph2EDg4';
    script.crossOrigin = 'anonymous';
    document.body.append(script);

    await Promise.all([
      new Promise(resolve => link.onload = () => resolve()),
      new Promise(resolve => script.onload = () => resolve()),
    ]);

    return `
      <h2>TeX</h2>
      <p>Дозволяє користуватись складними формулами, які не можна відобразити за допомоги звичайного тексту. Мови розмітки на базі TeX широко використовуються у наукових роботах. Також <a href ='https://uk.wikipedia.org/'>вікіпедія</a> користується ним для відображення свого контенту. Саме звідти можна взяти готові формули просто скопіювавши їх у буфер обміну. Для відображення на сторінці їх спершу потрібно буде виділити за допомоги символів \\(формула\\) чи $$формула$$, для режиму звичайного тексту чи для «режиму відображення» відповідно.</p>
      <p>Приклади:</p>
      <p>\\(F=G{\\frac  {m_{1}m_{2}}{r^{2}}}\\) → ${katex.renderToString('F=G{\\frac  {m_{1}m_{2}}{r^{2}}}')}</p>
      <p>\\(\\displaystyle \\int \\limits _{1}^{b}{\\frac {dx}{x}}=\\ln x{\\Big |}_{1}^{b}=\\ln b\\) → ${katex.renderToString('\\displaystyle \\int \\limits _{1}^{b}{\\frac {dx}{x}}=\\ln x{\\Big |}_{1}^{b}=\\ln b')}</p>
      <p>$$\\displaystyle \\left( \\sum_{k=1}^n a_k b_k \\right)^2 \\leq \\left( \\sum_{k=1}^n a_k^2 \\right) \\left( \\sum_{k=1}^n b_k^2 \\right)$$ ${katex.renderToString('\\displaystyle \\left( \\sum_{k=1}^n a_k b_k \\right)^2 \\leq \\left( \\sum_{k=1}^n a_k^2 \\right) \\left( \\sum_{k=1}^n b_k^2 \\right)', { displayMode: true })}</p>
    `;
  }
};
