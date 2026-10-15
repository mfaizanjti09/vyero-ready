'use strict';

const pages = {
  '/delivery': {
    title: 'A more personal kind of delivery.',
    intro: 'A few details depend on where you are. We will confirm the particulars with you before you order.',
    sections: [
      ['Delivery charges', 'Message VYERO with your city and the bag you are interested in. We will confirm the delivery charge for your destination directly, before you decide.'],
      ['Delivery estimate', 'Delivery estimates depend on your destination and will be confirmed directly on WhatsApp. We do not display guaranteed delivery dates on this site.'],
      ['Before it is an order', 'Asking about a bag or opening WhatsApp is not an order confirmation. Your order is confirmed only when VYERO replies to you directly.']
    ]
  },
  '/returns': {
    title: 'VYERO.PK — Return & Exchange Policy',
    intro: 'At VYERO, we want you to love your purchase! 👜',
    sections: [
      ['Exchange only', 'We do not offer returns or refunds.'],
      ['Condition requirement', 'Exchanges are allowed only if the bag is in its original, best condition, unused, and free from any damage, stains, or signs of use.'],
      ['Original packaging', 'The bag must be returned with its original packaging and accessories, if applicable.'],
      ['Final check', 'Please check your bag carefully upon delivery. Thank you for shopping with VYERO.PK! 🤎'],
      ['Signature', 'Carry Your Style.']
    ]
  },
  '/privacy': {
    title: 'Your details are yours.',
    intro: 'This shop is designed so you can look around without giving us your personal details.',
    sections: [
      ['Browsing the shop', 'The public shop does not offer customer accounts, an online checkout, payment collection, or customer order forms. This site does not intentionally collect or save visitors’ personal or payment information. Your browser and web host may process ordinary technical connection data.'],
      ['Choosing WhatsApp', 'When you choose to message VYERO, your device opens a WhatsApp chat with a message containing the bag, selected colour and shape, quantity, and current price. The message is not sent until you choose to send it. WhatsApp handles the message under its own terms and privacy policy.'],
      ['Products and photos', 'The store owner manages product information, bag photos, stock, and promotions in the private management area. The shop does not store customers’ chats or messages.']
    ]
  }
};

const page = pages[location.pathname.replace(/\/+$/, '')] || pages['/privacy'];
document.title = `${page.title} — VYERO`;
document.getElementById('policy-title').textContent = page.title;
document.getElementById('policy-intro').textContent = page.intro;
document.getElementById('policy-year').textContent = String(new Date().getFullYear());
document.getElementById('policy-copy').innerHTML = page.sections.map(([heading, copy]) =>
  `<section><h2>${heading}</h2><p>${copy}</p></section>`).join('');
