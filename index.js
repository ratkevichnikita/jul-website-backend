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
  const { sum, productsNames, emailField } = req.body;
  const checkout = new YooCheckout({ shopId: '318765', secretKey: 'test_GHOrTwTOvGy-V-RWkqB04y_eTsQWRzam9PnqhgGoHUs' });

  const idempotenceKey = uuidv4();

  const createPayload = {
    amount: {
      value: `${sum}.00`,
      currency: 'RUB'
    },
    payment_method_data: {
      type: 'bank_card'
    },
    confirmation: {
      type: 'redirect',
      return_url: 'https://momjulee.ru/results'
    },
    capture: true,
    description: productsNames,
    metadata: {email: emailField}
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
  const checkout = new YooCheckout({ shopId: '318765', secretKey: 'test_GHOrTwTOvGy-V-RWkqB04y_eTsQWRzam9PnqhgGoHUs' });
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
        subject: "Гайд: Календарь развития ребенка",
        html: `
            <h1>Добрый день. Спасибо за покупку</h1>
            <a href="https://drive.google.com/drive/folders/1xV8YRBBkzrR6FwhoU4nKvT1NiOo-RsGX">Ваша ссылка на скачивание гайда</a>
            `,
        });
      console.log('info',info)
    }

    return  res.status(200).json(payment);
  } catch (error) {
    console.error(error);
  }
})

// app.post('/sendMail', async (req,res) => {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 465,
//     secure: true,
//     auth: {
//       user: "e6wuk1990@gmail.com", // Your email address
//       pass: "krcnxmjjyfnhpeeb", // Password (for gmail, your app password)
//     },
//   })
//   let info = await transporter.sendMail({
//     from: '"Юлия Раткевич" <***-e6wuk1990@gmail.com>',
//     to: "e6wuk1990@mail.ru",
//     subject: "Гайд: Календарь развития ребенка",
//     html: `
//     <h1>Добрый день. Спасибо за покупку</h1>
//     <a href="https://drive.google.com/drive/folders/1xV8YRBBkzrR6FwhoU4nKvT1NiOo-RsGX">Ваша ссылка на скачивание гайда</a>
//     `,
//   });
//   console.log('info',info.messageId)
// })

const PORT = 8000;

app.listen(PORT, () => console.log('server started on PORT ' + PORT))