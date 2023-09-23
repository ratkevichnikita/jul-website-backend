const { YooCheckout } = require('@a2seven/yoo-checkout');
const nodemailer = require('nodemailer')
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET','POST']
}));

app.post('/createPayment', async (req,res) => {
  const { sum, products, emailField } = req.body;
  const checkout = new YooCheckout({ shopId: '219584', secretKey: 'live_UN6Al9vIbRc6bBMdXTkJgCWFrZT9NLdpuOqw3OvbDEE' });
  const productsNames = products.map(item => item.name).join(', ')
  const idempotenceKey = uuidv4();

  const items = products.map(item => {
    return {
      description: item.name,
      quantity: "1",
      amount: {
        value: `${item.price}.00`,
        currency: "RUB"
      },
      vat_code: "1"
    }
  })

  const emailBody = products.map(product => {
    return `<div><p>${product.name}</p><a href="${product.link}">${product.link}</a></div>`
  }).join('');

  const finalMeta = {};

  finalMeta.email = emailField;
  finalMeta.emailBody = emailBody;

  const createPayload = {
    amount: {
      value: `${sum}.00`,
      currency: 'RUB'
    },
    confirmation: {
      type: 'redirect',
      return_url: 'https://momjulee.ru/results'
    },
    receipt: {
      customer: {
        email: emailField
      },
      items
    },
    capture: true,
    description: productsNames,
    metadata: finalMeta
  };
  try {
    const payment = await checkout.createPayment(createPayload, idempotenceKey);
    return  res.status(200).json(payment);
  } catch (error) {
    console.error(error);
  }
})

app.post('/checkPaymentStatus', async (req,res) => {
  const { paymentId } = req.body;
  const checkout = new YooCheckout({ shopId: '219584', secretKey: 'live_UN6Al9vIbRc6bBMdXTkJgCWFrZT9NLdpuOqw3OvbDEE' });
  try {
    const payment = await checkout.getPayment(paymentId);
    if(payment?.status === 'succeeded') {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "e6wuk1990@gmail.com", // Your email address
          pass: "krcnxmjjyfnhpeeb", // Password (for gmail, your app password)
        },
      })
      let info = await transporter.sendMail({
        from: '"Юлия Раткевич" <***-e6wuk1990@gmail.com>',
        to: payment.metadata.email,
        subject: payment.description,
        html: `
            <p style="margin-bottom:30px">Благодарю Вас за покупку!</p>
            <p style="margin-bottom:30px">Ваши покупки доступны. <br/>
              Их можно скачать перейдя по ссылке ниже.</p>
            ${payment.metadata.emailBody}
            <p>
              Присоединяйтесь ко мне в Инстаграм - <a target="_blank" href="https://www.instagram.com/momjulee/">
                @momjulee
              </a>
            </p>
            <p>
              В блоге я делюсь простыми и полезными идеями для детского творчества и развития. <br/>
              С любовью, Юлия Раткевич.
            </p>
            `,
      });
    }
    return  res.status(200).json(payment);
  } catch (error) {
    console.error(error);
  }
})

const PORT = 8000;

app.listen(PORT, () => console.log('server started on PORT ' + PORT))